import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

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
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const where: Prisma.PlacementWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
        { student: { firstName: { contains: search, mode: 'insensitive' } } },
        { student: { lastName: { contains: search, mode: 'insensitive' } } },
        { student: { admissionNo: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [placements, total] = await Promise.all([
      tenantDb.placement.findMany({
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
        orderBy: { placementDate: 'desc' },
        skip,
        take: limit,
      }),
      tenantDb.placement.count({ where }),
    ]);

    // Company stats
    const schoolIdFilter = schoolId || undefined;
    const [totalPlacements, companyBreakdown, typeBreakdown, avgPackage] = await Promise.all([
      tenantDb.placement.count({ where: { schoolId: schoolIdFilter } }),
      tenantDb.placement.groupBy({
        by: ['companyName'],
        where: { schoolId: schoolIdFilter },
        _count: { companyName: true },
        _sum: { package: true },
        orderBy: { _count: { companyName: 'desc' } },
        take: 10,
      }),
      tenantDb.placement.groupBy({
        by: ['type'],
        where: { schoolId: schoolIdFilter },
        _count: { type: true },
        _sum: { package: true },
      }),
      tenantDb.placement.aggregate({
        where: { schoolId: schoolIdFilter, package: { not: null } },
        _avg: { package: true },
        _max: { package: true },
        _min: { package: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        placements,
        summary: {
          totalPlacements,
          companyBreakdown: companyBreakdown.map((c) => ({
            company: c.companyName,
            count: c._count.companyName,
            totalPackage: c._sum.package || 0,
          })),
          typeBreakdown: typeBreakdown.map((t) => ({
            type: t.type,
            count: t._count.type,
            totalPackage: t._sum.package || 0,
          })),
          avgPackage: avgPackage._avg.package || 0,
          maxPackage: avgPackage._max.package || 0,
          minPackage: avgPackage._min.package || 0,
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
    console.error('Placement GET error:', error);
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
      companyName,
      position,
      package: pkg,
      placementDate,
      type,
      status,
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

    if (!schoolId || !studentId || !companyName || !position) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, studentId, companyName, position' },
        { status: 400 }
      );
    }

    const student = await tenantDb.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    const placement = await tenantDb.placement.create({
      data: {
        schoolId,
        studentId,
        companyName,
        position,
        package: pkg ? parseFloat(String(pkg)) : null,
        placementDate: placementDate ? new Date(placementDate) : new Date(),
        type: type || 'job',
        status: status || 'offered',
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

    return NextResponse.json(
      { success: true, data: placement },
      { status: 201 }
    );
  } catch (error) {
    console.error('Placement POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
