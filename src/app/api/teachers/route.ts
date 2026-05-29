import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const specialization = searchParams.get('specialization') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TeacherWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeId: { contains: search } },
        { user: { email: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (specialization) {
      where.specialization = { contains: specialization };
    }

    const [teachers, total] = await Promise.all([
      db.teacher.findMany({
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
      db.teacher.count({ where }),
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

    // Validate required fields
    if (!schoolId || !firstName || !lastName || !email || !employeeId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, firstName, lastName, email, employeeId' },
        { status: 400 }
      );
    }

    // Check if employee ID already exists
    const existingEmployee = await db.teacher.findUnique({
      where: { employeeId },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee ID already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Create user first
    const user = await db.user.create({
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
    const teacher = await db.teacher.create({
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
