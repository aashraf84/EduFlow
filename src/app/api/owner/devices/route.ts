import { NextRequest, NextResponse } from 'next/server';
import { masterDb } from '@/lib/tenant-manager';

export async function GET() {
  try {
    const devices = await masterDb.device.findMany({
      include: {
        client: { select: { id: true, companyName: true } },
        serialKey: { select: { id: true, key: true, plan: true } },
        tenant: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = devices.map((d) => ({
      id: d.id,
      deviceName: d.deviceName || 'Unknown Device',
      fingerprint: d.fingerprint,
      browser: d.browser || 'Unknown',
      os: d.os || 'Unknown',
      clientId: d.clientId,
      client: d.client.companyName,
      serialKeyId: d.serialKeyId,
      serialKey: d.serialKey.key,
      tenantId: d.tenantId,
      tenant: d.tenant?.name || '',
      tenantCode: d.tenant?.code || '',
      status: d.status,
      approved: d.approved,
      lastAccessed: d.lastAccessedAt.toISOString(),
      ipAddress: d.ipAddress,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Owner Devices GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, action' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'revoke') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "revoke"' },
        { status: 400 }
      );
    }

    const device = await masterDb.device.findUnique({ where: { id } });
    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    await masterDb.device.update({
      where: { id },
      data: {
        approved: action === 'approve',
        status: action === 'approve' ? 'active' : 'revoked',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Owner Devices PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
