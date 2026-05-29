import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    const status = searchParams.get('status') || '';
    const riskLevel = searchParams.get('riskLevel') || '';
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
    const where: Prisma.StudentWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNo: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (classId) {
      where.classId = classId;
    }

    if (status) {
      where.status = status;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    const [students, total] = await Promise.all([
      tenantDb.student.findMany({
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
          class: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
          section: {
            select: {
              id: true,
              name: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      tenantDb.student.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        students,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Students GET error:', error);
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
      admissionNo,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      emergencyContact,
      classId,
      sectionId,
      parentId,
      riskLevel,
      phone,
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
    if (!schoolId || !firstName || !lastName || !email || !admissionNo) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, firstName, lastName, email, admissionNo' },
        { status: 400 }
      );
    }

    // Check if admission number already exists
    const existingAdmission = await tenantDb.student.findUnique({
      where: { admissionNo },
    });

    if (existingAdmission) {
      return NextResponse.json(
        { success: false, error: 'Admission number already exists' },
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
        password: 'hashed_student123', // Default demo password
        name: `${firstName} ${lastName}`,
        role: 'student',
        phone: phone || null,
        status: 'active',
      },
    });

    // Create student
    const student = await tenantDb.student.create({
      data: {
        schoolId,
        userId: user.id,
        admissionNo,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        address: address || null,
        bloodGroup: bloodGroup || null,
        emergencyContact: emergencyContact || null,
        classId: classId || null,
        sectionId: sectionId || null,
        parentId: parentId || null,
        riskLevel: riskLevel || 'low',
        status: 'active',
      },
      include: {
        user: {
          select: { email: true, phone: true, avatar: true, status: true },
        },
        class: {
          select: { id: true, name: true, level: true },
        },
        section: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: student },
      { status: 201 }
    );
  } catch (error) {
    console.error('Students POST error:', error);
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
