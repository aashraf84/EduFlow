import { NextRequest, NextResponse } from 'next/server';
import { masterDb, getTenantDbByCode } from '@/lib/tenant-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serialKey, schoolCode, deviceInfo, fingerprint: clientFingerprint } = body;

    if (!serialKey) {
      return NextResponse.json(
        { success: false, error: 'Serial key is required' },
        { status: 400 }
      );
    }

    if (!schoolCode) {
      return NextResponse.json(
        { success: false, error: 'School code is required' },
        { status: 400 }
      );
    }

    // Use client-provided fingerprint or generate one from browser info
    const browser = deviceInfo?.browser || 'Unknown';
    const os = deviceInfo?.os || 'Unknown';
    const deviceFingerprint = clientFingerprint || `fp-${browser.toLowerCase().replace(/\s/g, '')}-${os.toLowerCase().replace(/\s/g, '')}-${Date.now().toString(36)}`;
    const deviceName = `${browser} on ${os}`;

    // ============================================
    // 1. Look up serial key in master DB
    // ============================================
    const keyRecord = await masterDb.serialKey.findUnique({
      where: { key: serialKey },
      include: { client: true, devices: true },
    });

    if (!keyRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid serial key. Please check and try again.' },
        { status: 404 }
      );
    }

    // Validate key status
    if (keyRecord.status !== 'available' && keyRecord.status !== 'activated') {
      return NextResponse.json(
        { success: false, error: `Serial key is ${keyRecord.status} and cannot be used` },
        { status: 400 }
      );
    }

    // Check if key is expired
    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      await masterDb.serialKey.update({
        where: { id: keyRecord.id },
        data: { status: 'expired' },
      });
      return NextResponse.json(
        { success: false, error: 'Serial key has expired. Please contact support.' },
        { status: 400 }
      );
    }

    // ============================================
    // 2. Look up tenant by schoolCode in master DB
    // ============================================
    const tenant = await masterDb.tenant.findUnique({
      where: { code: schoolCode },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'School not found with this code' },
        { status: 404 }
      );
    }

    if (tenant.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'This school account is not active' },
        { status: 403 }
      );
    }

    // ============================================
    // 3. Verify that the tenant's client matches the serial key's client
    //    SerialKey has tenantId; if already linked, it must match the requesting tenant.
    //    If not yet linked, verify via the Client-Tenant relationship.
    // ============================================
    if (keyRecord.tenantId && keyRecord.tenantId !== tenant.id) {
      return NextResponse.json(
        { success: false, error: 'This serial key is not assigned to your school' },
        { status: 403 }
      );
    }

    // If the key is not yet linked to a tenant, verify the client-tenant relationship
    if (!keyRecord.tenantId) {
      const keyClient = keyRecord.client;
      if (keyClient.tenantId && keyClient.tenantId !== tenant.id) {
        return NextResponse.json(
          { success: false, error: 'This serial key is not assigned to your school' },
          { status: 403 }
        );
      }
    }

    // ============================================
    // 4. Check device count against maxDevices
    // ============================================
    const activeDeviceCount = keyRecord.devices.filter(
      (d) => d.status === 'active'
    ).length;

    if (activeDeviceCount >= keyRecord.maxDevices) {
      return NextResponse.json(
        { success: false, error: `Maximum device limit (${keyRecord.maxDevices}) reached for this serial key` },
        { status: 400 }
      );
    }

    // ============================================
    // 5. Check if this exact device fingerprint already exists
    // ============================================
    const existingDevice = await masterDb.device.findUnique({
      where: {
        serialKeyId_fingerprint: {
          serialKeyId: keyRecord.id,
          fingerprint: deviceFingerprint,
        },
      },
    });

    let device;
    let isNewDevice = false;

    if (existingDevice) {
      // Device already registered — update last accessed
      device = await masterDb.device.update({
        where: { id: existingDevice.id },
        data: { lastAccessedAt: new Date() },
      });

      if (!existingDevice.approved) {
        return NextResponse.json(
          {
            success: false,
            error: 'This device is pending approval from the owner',
            data: { deviceId: existingDevice.id, approved: false, status: 'pending_approval' },
          },
          { status: 202 }
        );
      }
    } else {
      // New device registration
      isNewDevice = true;
      const isFirstDevice = keyRecord.devices.length === 0;

      device = await masterDb.device.create({
        data: {
          clientId: keyRecord.clientId,
          serialKeyId: keyRecord.id,
          tenantId: tenant.id,
          fingerprint: deviceFingerprint,
          deviceName: deviceName,
          browser,
          os,
          approved: isFirstDevice,
          status: isFirstDevice ? 'active' : 'pending',
        },
      });

      if (!isFirstDevice) {
        // Update serial key even for pending device — link tenantId
        await masterDb.serialKey.update({
          where: { id: keyRecord.id },
          data: {
            tenantId: tenant.id,
            status: 'activated',
            activatedAt: keyRecord.activatedAt || new Date(),
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: 'New device registered. Awaiting owner approval.',
            data: { deviceId: device.id, approved: false, status: 'pending_approval' },
          },
          { status: 202 }
        );
      }
    }

    // ============================================
    // 6. On successful activation: update SerialKey status and link tenantId
    // ============================================
    await masterDb.serialKey.update({
      where: { id: keyRecord.id },
      data: {
        tenantId: tenant.id,
        status: 'activated',
        activatedAt: keyRecord.activatedAt || new Date(),
      },
    });

    // ============================================
    // 7. Look up school info from tenant DB for the response
    // ============================================
    let schoolInfo = null;
    try {
      const tenantDb = await getTenantDbByCode(schoolCode);
      if (tenantDb) {
        const school = await tenantDb.school.findFirst();
        if (school) {
          schoolInfo = {
            id: school.id,
            name: school.name,
            code: school.code,
          };
        }
      }
    } catch {
      // Non-critical — activation still succeeds even if we can't read school info
    }

    return NextResponse.json({
      success: true,
      data: {
        activated: true,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          code: tenant.code,
          plan: tenant.plan,
          status: tenant.status,
        },
        school: schoolInfo,
        serialKey: {
          id: keyRecord.id,
          key: keyRecord.key,
          plan: keyRecord.plan,
          maxDevices: keyRecord.maxDevices,
          maxStudents: keyRecord.maxStudents,
        },
        device: {
          id: device.id,
          approved: device.approved,
          isNewDevice,
        },
      },
    });
  } catch (error) {
    console.error('Activation POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');

    if (!schoolCode) {
      return NextResponse.json(
        { success: false, error: 'Missing required query param: schoolCode' },
        { status: 400 }
      );
    }

    // ============================================
    // Look up tenant by schoolCode from master DB
    // ============================================
    const tenant = await masterDb.tenant.findUnique({
      where: { code: schoolCode },
      include: {
        serialKeys: { include: { devices: true } },
        devices: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    // Derive activation status from the tenant's serial keys
    const hasActivatedKey = tenant.serialKeys.some(
      (key) => key.status === 'activated'
    );
    const activationStatus = hasActivatedKey ? 'active' : 'inactive';

    // Get school info from tenant DB
    let schoolInfo = null;
    try {
      const tenantDb = await getTenantDbByCode(schoolCode);
      if (tenantDb) {
        const school = await tenantDb.school.findFirst();
        if (school) {
          schoolInfo = {
            id: school.id,
            name: school.name,
            code: school.code,
          };
        }
      }
    } catch {
      // Non-critical — return tenant info without school details
    }

    return NextResponse.json({
      success: true,
      data: {
        activationStatus,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          code: tenant.code,
          plan: tenant.plan,
          status: tenant.status,
        },
        school: schoolInfo,
        serialKeys: tenant.serialKeys.map((key) => ({
          id: key.id,
          key: key.key,
          plan: key.plan,
          status: key.status,
          maxDevices: key.maxDevices,
          maxStudents: key.maxStudents,
        })),
        devices: tenant.devices.map((d) => ({
          id: d.id,
          deviceName: d.deviceName,
          approved: d.approved,
          status: d.status,
          browser: d.browser,
          os: d.os,
        })),
      },
    });
  } catch (error) {
    console.error('Activation GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
