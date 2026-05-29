import { NextRequest, NextResponse } from 'next/server';
import { masterDb } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

function generateSerialKey(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomSegment = () => {
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return `EDUF-${year}-${randomSegment()}-${randomSegment()}-${randomSegment()}`;
}

export async function GET() {
  try {
    const serialKeys = await masterDb.serialKey.findMany({
      include: {
        client: { select: { id: true, companyName: true } },
        tenant: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = serialKeys.map((sk) => ({
      id: sk.id,
      key: sk.key,
      clientId: sk.clientId,
      client: sk.client.companyName,
      tenantId: sk.tenantId,
      tenant: sk.tenant?.name || '',
      tenantCode: sk.tenant?.code || '',
      plan: sk.plan,
      maxDevices: sk.maxDevices,
      maxStudents: sk.maxStudents,
      status: sk.status,
      activatedAt: sk.activatedAt,
      expiresAt: sk.expiresAt,
      expiry: sk.expiresAt?.toISOString() || '',
      notes: sk.notes,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Owner Serial Keys GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, plan, maxDevices, maxStudents, notes, tenantId } = body;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: clientId' },
        { status: 400 }
      );
    }

    const client = await masterDb.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    let key = generateSerialKey();
    let existingKey = await masterDb.serialKey.findUnique({ where: { key } });
    while (existingKey) {
      key = generateSerialKey();
      existingKey = await masterDb.serialKey.findUnique({ where: { key } });
    }

    const serialKey = await masterDb.serialKey.create({
      data: {
        key,
        clientId,
        tenantId: tenantId || null,
        plan: plan || 'starter',
        maxDevices: maxDevices || 3,
        maxStudents: maxStudents || 500,
        status: 'available',
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: serialKey }, { status: 201 });
  } catch (error) {
    console.error('Owner Serial Keys POST error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'Serial key collision, please try again' },
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
