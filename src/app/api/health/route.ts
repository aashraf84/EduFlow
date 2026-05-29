import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search') || '';
    const studentId = searchParams.get('studentId') || '';
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

    const where: Prisma.HealthRecordWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (search) {
      where.OR = [
        { student: { firstName: { contains: search, mode: 'insensitive' } } },
        { student: { lastName: { contains: search, mode: 'insensitive' } } },
        { student: { admissionNo: { contains: search, mode: 'insensitive' } } },
        { allergies: { contains: search, mode: 'insensitive' } },
        { conditions: { contains: search, mode: 'insensitive' } },
        { doctorName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [records, total] = await Promise.all([
      tenantDb.healthRecord.findMany({
        where,
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
        orderBy: { lastCheckup: 'desc' },
        skip,
        take: limit,
      }),
      tenantDb.healthRecord.count({ where }),
    ]);

    // Summary stats
    const schoolIdFilter = schoolId || undefined;
    const [totalRecords, allergyCount, conditionCount, visionCount] = await Promise.all([
      tenantDb.healthRecord.count({ where: { schoolId: schoolIdFilter } }),
      tenantDb.healthRecord.count({
        where: { schoolId: schoolIdFilter, allergies: { not: null } },
      }),
      tenantDb.healthRecord.count({
        where: { schoolId: schoolIdFilter, conditions: { not: null } },
      }),
      tenantDb.healthRecord.count({
        where: { schoolId: schoolIdFilter, vision: 'Needs correction' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        records,
        summary: {
          totalRecords,
          allergyCount,
          conditionCount,
          visionCorrectionCount: visionCount,
          healthyCount: totalRecords - conditionCount,
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
    console.error('Health GET error:', error);
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
      height,
      weight,
      bloodGroup,
      vision,
      allergies,
      conditions,
      medications,
      lastCheckup,
      doctorName,
      notes,
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

    if (!schoolId || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, studentId' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await tenantDb.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if health record already exists for this student
    const existing = await tenantDb.healthRecord.findFirst({
      where: { studentId },
    });

    let record;
    if (existing) {
      // Update existing record
      record = await tenantDb.healthRecord.update({
        where: { id: existing.id },
        data: {
          height: height !== undefined ? parseFloat(String(height)) : undefined,
          weight: weight !== undefined ? parseFloat(String(weight)) : undefined,
          bloodGroup: bloodGroup || undefined,
          vision: vision || undefined,
          allergies: allergies !== undefined ? allergies : undefined,
          conditions: conditions !== undefined ? conditions : undefined,
          medications: medications !== undefined ? medications : undefined,
          lastCheckup: lastCheckup ? new Date(lastCheckup) : new Date(),
          doctorName: doctorName || undefined,
          notes: notes !== undefined ? notes : undefined,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
            },
          },
        },
      });
    } else {
      // Create new record
      record = await tenantDb.healthRecord.create({
        data: {
          schoolId,
          studentId,
          height: height ? parseFloat(String(height)) : null,
          weight: weight ? parseFloat(String(weight)) : null,
          bloodGroup: bloodGroup || null,
          vision: vision || null,
          allergies: allergies || null,
          conditions: conditions || null,
          medications: medications || null,
          lastCheckup: lastCheckup ? new Date(lastCheckup) : new Date(),
          doctorName: doctorName || null,
          notes: notes || null,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
            },
          },
        },
      });
    }

    return NextResponse.json(
      { success: true, data: record },
      { status: existing ? 200 : 201 }
    );
  } catch (error) {
    console.error('Health POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
