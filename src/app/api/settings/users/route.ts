import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolCode, schoolId, name, email, role, phone } = body;

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

    if (!schoolId || !name || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, name, email' },
        { status: 400 }
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

    // Create user
    const user = await tenantDb.user.create({
      data: {
        schoolId,
        email,
        password: 'hashed_default123',
        name,
        role: role || 'teacher',
        phone: phone || null,
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        lastLogin: true,
      },
    });

    return NextResponse.json(
      { success: true, data: user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Settings users POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
