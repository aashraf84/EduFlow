import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const specialization = searchParams.get('specialization') || '';
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
    const where: Prisma.TeacherWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (specialization) {
      where.specialization = { contains: specialization, mode: 'insensitive' };
    }

    const [teachers, total] = await Promise.all([
      tenantDb.teacher.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              phone: true,
              avatar: true,
              status: true,
            },
          },
          subjects: {
            include: {
              subject: {
                select: { id: true, name: true, code: true },
              },
              class: {
                select: { id: true, name: true },
              },
            },
          },
          classTeacherOf: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      tenantDb.teacher.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        teachers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Teachers GET error:', error);
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
      firstName,
      lastName,
      email,
      employeeId,
      qualification,
      specialization,
      salary,
      phone,
      address,
      dateOfJoining,
      performanceRating,
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
    if (!schoolId || !firstName || !lastName || !email || !employeeId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, firstName, lastName, email, employeeId' },
        { status: 400 }
      );
    }

    // Check if employee ID already exists
    const existingEmployee = await tenantDb.teacher.findUnique({
      where: { employeeId },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee ID already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingUser = await tenantDb.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Create user first
    const user = await tenantDb.user.create({
      data: {
        schoolId,
        email,
        password: 'hashed_teacher123', // Default demo password
        name: `${firstName} ${lastName}`,
        role: 'teacher',
        phone: phone || null,
        status: 'active',
      },
    });

    // Create teacher
    const teacher = await tenantDb.teacher.create({
      data: {
        schoolId,
        userId: user.id,
        employeeId,
        firstName,
        lastName,
        qualification: qualification || null,
        specialization: specialization || null,
        salary: salary ? parseFloat(String(salary)) : null,
        phone: phone || null,
        address: address || null,
        dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
        status: 'active',
        performanceRating: performanceRating ? parseFloat(String(performanceRating)) : null,
      },
      include: {
        user: {
          select: { email: true, phone: true, avatar: true, status: true },
        },
        subjects: {
          include: {
            subject: {
              select: { id: true, name: true, code: true },
            },
            class: {
              select: { id: true, name: true },
            },
          },
        },
        classTeacherOf: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: teacher },
      { status: 201 }
    );
  } catch (error) {
    console.error('Teachers POST error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'A record with this unique field already exists' },
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
