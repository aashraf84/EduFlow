import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

const emptyLabData = {
  labs: [],
  summary: {
    totalLabs: 0,
    totalSchedules: 0,
    totalCapacity: 0,
    departmentBreakdown: [],
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
    const department = searchParams.get('department') || '';
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
      return NextResponse.json({ success: true, data: emptyLabData });
    }

    const where: Prisma.LabWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { incharge: { contains: search, mode: 'insensitive' } },
        { equipment: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (department) {
      where.department = department;
    }

    if (status) {
      where.status = status;
    }

    const [labs, total] = await Promise.all([
      tenantDb.lab.findMany({
        where,
        include: {
          schedules: {
            include: {
              lab: { select: { name: true } },
            },
            orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
          },
          _count: {
            select: { schedules: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      tenantDb.lab.count({ where }),
    ]);

    // Summary stats
    const schoolIdFilter = schoolId || undefined;
    const [totalLabs, departmentBreakdown, totalSchedules] = await Promise.all([
      tenantDb.lab.count({ where: { schoolId: schoolIdFilter } }),
      tenantDb.lab.groupBy({
        by: ['department'],
        where: { schoolId: schoolIdFilter },
        _count: { department: true },
        _sum: { capacity: true },
        orderBy: { _count: { department: 'desc' } },
      }),
      tenantDb.labSchedule.count({
        where: { lab: { schoolId: schoolIdFilter } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        labs,
        summary: {
          totalLabs,
          totalSchedules,
          totalCapacity: (await tenantDb.lab.aggregate({
            where: { schoolId: schoolIdFilter },
            _sum: { capacity: true },
          }))._sum.capacity || 0,
          departmentBreakdown: departmentBreakdown.map((d) => ({
            department: d.department,
            count: d._count.department,
            totalCapacity: d._sum.capacity || 0,
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
    console.error('Lab GET error:', error);
    return NextResponse.json({ success: true, data: emptyLabData });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schoolCode,
      schoolId,
      name,
      department,
      capacity,
      equipment,
      incharge,
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
      return NextResponse.json({ success: true, data: null });
    }

    if (!schoolId || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, name' },
        { status: 400 }
      );
    }

    const lab = await tenantDb.lab.create({
      data: {
        schoolId,
        name,
        department: department || null,
        capacity: capacity || 30,
        equipment: equipment || null,
        incharge: incharge || null,
        status: status || 'active',
      },
    });

    return NextResponse.json(
      { success: true, data: lab },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lab POST error:', error);
    return NextResponse.json({ success: true, data: null });
  }
}
