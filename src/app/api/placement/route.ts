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

    const where: Prisma.PlacementWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { position: { contains: search } },
        { student: { firstName: { contains: search } } },
        { student: { lastName: { contains: search } } },
        { student: { admissionNo: { contains: search } } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [placements, total] = await Promise.all([
      db.placement.findMany({
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
      db.placement.count({ where }),
    ]);

    // Company stats
    const [totalPlacements, companyBreakdown, typeBreakdown, avgPackage] = await Promise.all([
      db.placement.count({ where: { schoolId: schoolId || undefined } }),
      db.placement.groupBy({
        by: ['companyName'],
        where: { schoolId: schoolId || undefined },
        _count: { companyName: true },
        _sum: { package: true },
        orderBy: { _count: { companyName: 'desc' } },
        take: 10,
      }),
      db.placement.groupBy({
        by: ['type'],
        where: { schoolId: schoolId || undefined },
        _count: { type: true },
        _sum: { package: true },
      }),
      db.placement.aggregate({
        where: { schoolId: schoolId || undefined, package: { not: null } },
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
      schoolId,
      studentId,
      companyName,
      position,
      package: pkg,
      placementDate,
      type,
      status,
    } = body;

    if (!schoolId || !studentId || !companyName || !position) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, studentId, companyName, position' },
        { status: 400 }
      );
    }

    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    const placement = await db.placement.create({
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
