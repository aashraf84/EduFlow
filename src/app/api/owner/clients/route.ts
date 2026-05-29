import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const clients = await db.client.findMany({
      include: {
        _count: {
          select: {
            schools: true,
            serialKeys: true,
            devices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = clients.map((client) => ({
      id: client.id,
      company: client.companyName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone || '',
      address: client.address,
      city: client.city,
      state: client.state,
      country: client.country,
      website: client.website,
      taxId: client.taxId,
      logo: client.logo,
      status: client.status,
      notes: client.notes,
      schoolsCount: client._count.schools,
      keysCount: client._count.serialKeys,
      devicesCount: client._count.devices,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Owner Clients GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, contactPerson, email, phone, address, city, state, country, website, taxId, status, notes } = body;

    if (!company || !contactPerson || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: company, contactPerson, email' },
        { status: 400 }
      );
    }

    const client = await db.client.create({
      data: {
        companyName: company,
        contactPerson,
        email,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
        website: website || null,
        taxId: taxId || null,
        status: status || 'active',
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error) {
    console.error('Owner Clients POST error:', error);
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
