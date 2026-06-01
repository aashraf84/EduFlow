import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

const emptyScholarshipData = {
  scholarships: [],
  summary: {
    totalScholarships: 0,
    totalFunds: 0,
    totalApplications: 0,
    typeBreakdown: [],
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
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
      return NextResponse.json({ success: true, data: emptyScholarshipData });
    }

    const where: Prisma.ScholarshipWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { eligibility: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [scholarships, total] = await Promise.all([
      tenantDb.scholarship.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      tenantDb.scholarship.count({ where }),
    ]);

    // Summary stats
    const schoolIdFilter = schoolId || undefined;
    const [totalScholarships, totalFunds, typeBreakdown, totalApplications] = await Promise.all([
      tenantDb.scholarship.count({ where: { schoolId: schoolIdFilter } }),
      tenantDb.scholarship.aggregate({
        where: { schoolId: schoolIdFilter },
        _sum: { amount: true },
      }),
      tenantDb.scholarship.groupBy({
        by: ['type'],
        where: { schoolId: schoolIdFilter },
        _count: { type: true },
        _sum: { amount: true },
      }),
      tenantDb.scholarship.aggregate({
        where: { schoolId: schoolIdFilter },
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
    return NextResponse.json({ success: true, data: emptyScholarshipData });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schoolCode,
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

    if (!schoolCode) {
      return NextResponse.json(
        { success: false, error: 'schoolCode is required' },
        { status: 400 }
      );
    }

    const tenantDb = await getTenantDbByCode(schoolCode);
    if (!tenantDb) {
      return NextResponse.json({ success: true, data: null });
    }

    if (!schoolId || !name || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, name, amount' },
        { status: 400 }
      );
    }

    const scholarship = await tenantDb.scholarship.create({
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
    return NextResponse.json({ success: true, data: null });
  }
}
