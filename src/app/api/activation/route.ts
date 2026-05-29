import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serialKey, schoolCode, deviceInfo } = body;

    if (!serialKey) {
      return NextResponse.json(
        { success: false, error: 'Serial key is required' },
        { status: 400 }
      );
    }

    // Generate device fingerprint from browser info
    const browser = deviceInfo?.browser || 'Unknown';
    const os = deviceInfo?.os || 'Unknown';
    const deviceFingerprint = `fp-${browser.toLowerCase().replace(/\s/g, '')}-${os.toLowerCase().replace(/\s/g, '')}-${Date.now().toString(36)}`;
    const deviceName = `${browser} on ${os}`;

    // Find the serial key
    const keyRecord = await db.serialKey.findUnique({
      where: { key: serialKey },
      include: { devices: true, client: true },
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
      await db.serialKey.update({
        where: { id: keyRecord.id },
        data: { status: 'expired' },
      });
      return NextResponse.json(
        { success: false, error: 'Serial key has expired. Please contact support.' },
        { status: 400 }
      );
    }

    // Find school by code if provided
    let school = null;
    if (schoolCode) {
      school = await db.school.findUnique({ where: { code: schoolCode } });
      if (!school) {
        return NextResponse.json(
          { success: false, error: 'School not found with this code' },
          { status: 404 }
        );
      }

      // Verify school's clientId matches key's clientId
      if (school.clientId && school.clientId !== keyRecord.clientId) {
        return NextResponse.json(
          { success: false, error: 'This serial key is not assigned to your school' },
          { status: 403 }
        );
      }
    }

    // If key has a linked school, use that
    if (!school && keyRecord.schoolId) {
      school = await db.school.findUnique({ where: { id: keyRecord.schoolId } });
    }

    // Check device count
    const activeDeviceCount = keyRecord.devices.filter(
      (d) => d.status === 'active'
    ).length;

    if (activeDeviceCount >= keyRecord.maxDevices) {
      return NextResponse.json(
        { success: false, error: `Maximum device limit (${keyRecord.maxDevices}) reached for this serial key` },
        { status: 400 }
      );
    }

    // Check if this exact device fingerprint already exists
    const existingDevice = await db.device.findUnique({
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
      // Device already registered
      device = await db.device.update({
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
      // New device
      isNewDevice = true;
      const isFirstDevice = keyRecord.devices.length === 0;

      device = await db.device.create({
        data: {
          clientId: keyRecord.clientId,
          serialKeyId: keyRecord.id,
          schoolId: school?.id || null,
          fingerprint: deviceFingerprint,
          deviceName: deviceName,
          browser,
          os,
          approved: isFirstDevice,
          status: isFirstDevice ? 'active' : 'pending',
        },
      });

      if (!isFirstDevice) {
        // Update serial key and school even for pending device
        await db.serialKey.update({
          where: { id: keyRecord.id },
          data: {
            schoolId: school?.id || keyRecord.schoolId,
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

    // Update serial key
    await db.serialKey.update({
      where: { id: keyRecord.id },
      data: {
        schoolId: school?.id || keyRecord.schoolId,
        status: 'activated',
        activatedAt: keyRecord.activatedAt || new Date(),
      },
    });

    // Update school if found
    if (school) {
      await db.school.update({
        where: { id: school.id },
        data: {
          activationStatus: 'active',
          clientId: keyRecord.clientId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        activated: true,
        school: school ? {
          id: school.id,
          name: school.name,
          code: school.code,
          activationStatus: 'active',
        } : null,
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

    const school = await db.school.findUnique({
      where: { code: schoolCode },
      include: {
        serialKey: { include: { devices: true } },
        devices: true,
      },
    });

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        activationStatus: school.activationStatus,
        school: { id: school.id, name: school.name, code: school.code },
        serialKey: school.serialKey ? {
          key: school.serialKey.key,
          plan: school.serialKey.plan,
          status: school.serialKey.status,
          maxDevices: school.serialKey.maxDevices,
        } : null,
        devices: school.devices.map((d) => ({
          id: d.id,
          deviceName: d.deviceName,
          approved: d.approved,
          status: d.status,
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
