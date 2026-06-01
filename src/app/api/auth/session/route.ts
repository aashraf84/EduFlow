import { NextRequest, NextResponse } from 'next/server';
import { masterDb, getTenantDbByCode } from '@/lib/tenant-manager';

/**
 * GET /api/auth/session
 *
 * Validates the auth token from the Authorization header or cookie.
 * Returns user data if the token is valid, otherwise returns { authenticated: false }.
 *
 * Token format:
 *   - Owner:  owner_token_{userId}_{timestamp}
 *   - Tenant: demo_token_{userId}_{timestamp}
 */
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('eduflow_token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    // Parse token
    const isOwnerToken = token.startsWith('owner_token_');
    const isTenantToken = token.startsWith('demo_token_') || token.startsWith('tenant_token_');

    if (!isOwnerToken && !isTenantToken) {
      return NextResponse.json({ authenticated: false });
    }

    // Extract user ID from token
    const parts = token.split('_');
    // owner_token_{userId}_{timestamp} -> parts[2] is userId
    // demo_token_{userId}_{timestamp} -> parts[2] is userId
    const userId = parts[2];
    if (!userId) {
      return NextResponse.json({ authenticated: false });
    }

    // Validate owner token
    if (isOwnerToken) {
      const owner = await masterDb.ownerUser.findUnique({
        where: { id: userId },
      });

      if (!owner || owner.status !== 'active') {
        return NextResponse.json({ authenticated: false });
      }

      const { password: _, ...ownerWithoutPassword } = owner;
      return NextResponse.json({
        authenticated: true,
        user: {
          ...ownerWithoutPassword,
          tenantCode: 'OWNER',
          schoolId: '',
          isOwner: true,
        },
      });
    }

    // Validate tenant token — look up user across tenants
    // First check if we have a tenant code hint in the cookie
    const tenantCode = request.cookies.get('eduflow_tenant')?.value;

    if (tenantCode && tenantCode !== 'OWNER') {
      const tenantDb = await getTenantDbByCode(tenantCode);
      if (tenantDb) {
        const user = await tenantDb.user.findUnique({
          where: { id: userId },
          include: {
            school: {
              select: { id: true, name: true, code: true, plan: true, status: true, institutionType: true },
            },
          },
        });

        if (user && user.status === 'active') {
          const { password: _, ...userWithoutPassword } = user;
          return NextResponse.json({
            authenticated: true,
            user: {
              ...userWithoutPassword,
              tenantCode,
              isOwner: user.role === 'admin',
            },
          });
        }
      }
    }

    return NextResponse.json({ authenticated: false });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
