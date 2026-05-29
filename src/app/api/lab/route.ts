import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.LabWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { incharge: { contains: search } },
        { equipment: { contains: search } },
      ];
    }

    if (department) {
      where.department = department;
    }

    if (status) {
      where.status = status;
    }

    const [labs, total] = await Promise.all([
      db.lab.findMany({
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
      db.lab.count({ where }),
    ]);

    // Summary stats
    const [totalLabs, departmentBreakdown, totalSchedules] = await Promise.all([
      db.lab.count({ where: { schoolId: schoolId || undefined } }),
      db.lab.groupBy({
        by: ['department'],
        where: { schoolId: schoolId || undefined },
        _count: { department: true },
        _sum: { capacity: true },
        orderBy: { _count: { department: 'desc' } },
      }),
      db.labSchedule.count({
        where: { lab: { schoolId: schoolId || undefined } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        labs,
        summary: {
          totalLabs,
          totalSchedules,
          totalCapacity: (await db.lab.aggregate({
            where: { schoolId: schoolId || undefined },
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
      department,
      capacity,
      equipment,
      incharge,
      status,
    } = body;

    if (!schoolId || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, name' },
        { status: 400 }
      );
    }

    const lab = await db.lab.create({
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
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
