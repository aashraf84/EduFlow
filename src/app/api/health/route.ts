import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search') || '';
    const studentId = searchParams.get('studentId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.HealthRecordWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (search) {
      where.OR = [
        { student: { firstName: { contains: search } } },
        { student: { lastName: { contains: search } } },
        { student: { admissionNo: { contains: search } } },
        { allergies: { contains: search } },
        { conditions: { contains: search } },
        { doctorName: { contains: search } },
      ];
    }

    const [records, total] = await Promise.all([
      db.healthRecord.findMany({
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
      db.healthRecord.count({ where }),
    ]);

    // Summary stats
    const [totalRecords, allergyCount, conditionCount, visionCount] = await Promise.all([
      db.healthRecord.count({ where: { schoolId: schoolId || undefined } }),
      db.healthRecord.count({
        where: { schoolId: schoolId || undefined, allergies: { not: null } },
      }),
      db.healthRecord.count({
        where: { schoolId: schoolId || undefined, conditions: { not: null } },
      }),
      db.healthRecord.count({
        where: { schoolId: schoolId || undefined, vision: 'Needs correction' },
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

    if (!schoolId || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, studentId' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if health record already exists for this student
    const existing = await db.healthRecord.findFirst({
      where: { studentId },
    });

    let record;
    if (existing) {
      // Update existing record
      record = await db.healthRecord.update({
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
      record = await db.healthRecord.create({
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
