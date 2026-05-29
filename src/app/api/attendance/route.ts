import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');
    const schoolId = searchParams.get('schoolId');
    const date = searchParams.get('date') || '';
    const classId = searchParams.get('classId') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    if (!schoolCode) {
      return NextResponse.json(
        { success: false, error: 'schoolCode is required' },
        { status: 400 }
      );
    }

    const tenantDb = await getTenantDbByCode(schoolCode);
    if (!tenantDb) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: Prisma.AttendanceWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: targetDate, lt: nextDay };
    }

    if (classId) {
      where.student = { classId };
    }

    if (status) {
      where.status = status;
    }

    const [records, total] = await Promise.all([
      tenantDb.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
              class: { select: { id: true, name: true } },
              section: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ date: 'desc' }, { student: { firstName: 'asc' } }],
        skip,
        take: limit,
      }),
      tenantDb.attendance.count({ where }),
    ]);

    // Compute summary stats for the filtered data
    const summaryWhere = { ...where };
    const [presentCount, absentCount, lateCount, excusedCount] = await Promise.all([
      tenantDb.attendance.count({ where: { ...summaryWhere, status: 'present' } }),
      tenantDb.attendance.count({ where: { ...summaryWhere, status: 'absent' } }),
      tenantDb.attendance.count({ where: { ...summaryWhere, status: 'late' } }),
      tenantDb.attendance.count({ where: { ...summaryWhere, status: 'excused' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        records,
        summary: {
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          total,
          attendanceRate: total > 0 ? Math.round(((presentCount + lateCount) / total) * 10000) / 100 : 0,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schoolCode,
      schoolId,
      studentId,
      date,
      status,
      remarks,
      markedBy,
    } = body;

    if (!schoolCode) {
      return NextResponse.json(
        { success: false, error: 'schoolCode is required' },
        { status: 400 }
      );
    }

    const tenantDb = await getTenantDbByCode(schoolCode);
    if (!tenantDb) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!schoolId || !studentId || !date || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, studentId, date, status' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await tenantDb.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Create or update attendance record (upsert)
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const attendance = await tenantDb.attendance.upsert({
      where: {
        studentId_date: {
          studentId,
          date: attendanceDate,
        },
      },
      update: {
        status,
        remarks: remarks || null,
        markedBy: markedBy || null,
      },
      create: {
        schoolId,
        studentId,
        date: attendanceDate,
        status,
        remarks: remarks || null,
        markedBy: markedBy || null,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            class: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: attendance },
      { status: 201 }
    );
  } catch (error) {
    console.error('Attendance POST error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'Attendance record already exists for this student and date' },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
