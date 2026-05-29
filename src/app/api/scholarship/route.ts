import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ScholarshipWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { eligibility: { contains: search } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [scholarships, total] = await Promise.all([
      db.scholarship.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.scholarship.count({ where }),
    ]);

    // Summary stats
    const [totalScholarships, totalFunds, typeBreakdown, totalApplications] = await Promise.all([
      db.scholarship.count({ where: { schoolId: schoolId || undefined } }),
      db.scholarship.aggregate({
        where: { schoolId: schoolId || undefined },
        _sum: { amount: true },
      }),
      db.scholarship.groupBy({
        by: ['type'],
        where: { schoolId: schoolId || undefined },
        _count: { type: true },
        _sum: { amount: true },
      }),
      db.scholarship.aggregate({
        where: { schoolId: schoolId || undefined },
        _sum: { applicationCount: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        scholarships,
        summary: {
          totalScholarships,
          totalFunds: totalFunds._sum.amount || 0,
          totalApplications: totalApplications._sum.applicationCount || 0,
          typeBreakdown: typeBreakdown.map((t) => ({
            type: t.type,
            count: t._count.type,
            totalAmount: t._sum.amount || 0,
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
    console.error('Scholarship GET error:', error);
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
      name,
      description,
      amount,
      eligibility,
      deadline,
      type,
      status,
      applicationCount,
    } = body;

    if (!schoolId || !name || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, name, amount' },
        { status: 400 }
      );
    }

    const scholarship = await db.scholarship.create({
      data: {
        schoolId,
        name,
        description: description || null,
        amount: parseFloat(String(amount)),
        eligibility: eligibility || null,
        deadline: deadline ? new Date(deadline) : null,
        type: type || 'merit',
        status: status || 'active',
        applicationCount: applicationCount || 0,
      },
    });

    return NextResponse.json(
      { success: true, data: scholarship },
      { status: 201 }
    );
  } catch (error) {
    console.error('Scholarship POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
