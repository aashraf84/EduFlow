import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const appliedClass = searchParams.get('appliedClass') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.AdmissionWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { applicantName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { previousSchool: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (appliedClass) {
      where.appliedClass = appliedClass;
    }

    const [admissions, total] = await Promise.all([
      db.admission.findMany({
        where,
        orderBy: { applicationDate: 'desc' },
        skip,
        take: limit,
      }),
      db.admission.count({ where }),
    ]);

    // Summary stats
    const [totalAdmissions, statusBreakdown, classBreakdown] = await Promise.all([
      db.admission.count({ where: { schoolId: schoolId || undefined } }),
      db.admission.groupBy({
        by: ['status'],
        where: { schoolId: schoolId || undefined },
        _count: { status: true },
      }),
      db.admission.groupBy({
        by: ['appliedClass'],
        where: { schoolId: schoolId || undefined },
        _count: { appliedClass: true },
        orderBy: { _count: { appliedClass: 'desc' } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        admissions,
        summary: {
          totalAdmissions,
          statusBreakdown: statusBreakdown.map((s) => ({
            status: s.status,
            count: s._count.status,
          })),
          classBreakdown: classBreakdown.map((c) => ({
            appliedClass: c.appliedClass,
            count: c._count.appliedClass,
          })),
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
    console.error('Admission GET error:', error);
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
      applicantName,
      email,
      phone,
      appliedClass,
      previousSchool,
      gpa,
      documents,
      status,
      applicationDate,
      remarks,
    } = body;

    if (!schoolId || !applicantName || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, applicantName, email' },
        { status: 400 }
      );
    }

    const admission = await db.admission.create({
      data: {
        schoolId,
        applicantName,
        email,
        phone: phone || null,
        appliedClass: appliedClass || null,
        previousSchool: previousSchool || null,
        gpa: gpa ? parseFloat(String(gpa)) : null,
        documents: documents || null,
        status: status || 'applied',
        applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
        remarks: remarks || null,
      },
    });

    return NextResponse.json(
      { success: true, data: admission },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admission POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { admissionId, status, reviewedBy, reviewDate, remarks } = body;

    if (!admissionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: admissionId' },
        { status: 400 }
      );
    }

    const existing = await db.admission.findUnique({
      where: { id: admissionId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Admission not found' },
        { status: 404 }
      );
    }

    const updateData: Prisma.AdmissionUpdateInput = {};

    if (status) {
      const validStatuses = ['applied', 'reviewed', 'interviewed', 'offered', 'enrolled', 'rejected', 'waitlisted'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
    }

    if (reviewDate) {
      updateData.reviewDate = new Date(reviewDate);
    } else if (status && status !== 'applied') {
      updateData.reviewDate = new Date();
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }

    const admission = await db.admission.update({
      where: { id: admissionId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: admission,
    });
  } catch (error) {
    console.error('Admission PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
