import { NextRequest, NextResponse } from 'next/server';
import { masterDb, getTenantDbByCode } from '@/lib/tenant-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, schoolCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!schoolCode) {
      return NextResponse.json(
        { success: false, error: 'School code is required' },
        { status: 400 }
      );
    }

    // ============================================
    // TENANT USER LOGIN PATH
    // ============================================

    // 1. Look up the Tenant by schoolCode in the master DB
    const tenant = await masterDb.tenant.findUnique({
      where: { code: schoolCode },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Invalid school code. Please check and try again.' },
        { status: 404 }
      );
    }

    if (tenant.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'This school account is not active. Please contact support.' },
        { status: 403 }
      );
    }

    // 2. Get the tenant's PrismaClient
    const tenantDb = await getTenantDbByCode(schoolCode);
    if (!tenantDb) {
      return NextResponse.json(
        { success: false, error: 'Unable to connect to school database. Please try again later.' },
        { status: 500 }
      );
    }

    // 3. Authenticate the user in the TENANT database
    const user = await tenantDb.user.findUnique({
      where: { email },
      include: {
        school: true,
        student: true,
        teacher: true,
        parent: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 4. Verify password (demo-style hashed check)
    const expectedPassword = `hashed_${password}`;
    if (user.password !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Account is inactive. Please contact administrator.' },
        { status: 403 }
      );
    }

    // 5. Update last login in the tenant database
    await tenantDb.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // 6. Return user data with school info and tenant code
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          school: user.school
            ? {
                id: user.school.id,
                name: user.school.name,
                code: user.school.code,
                plan: user.school.plan,
                status: user.school.status,
                institutionType: user.school.institutionType,
              }
            : null,
        },
        token: `demo_token_${user.id}_${Date.now()}`,
        tenantCode: tenant.code,
        isDemo: user.isDemo,
        isOwner: user.role === 'admin',
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
