import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Client stats
    const [totalClients, activeClients, trialClients] = await Promise.all([
      db.client.count(),
      db.client.count({ where: { status: 'active' } }),
      db.client.count({ where: { status: 'trial' } }),
    ]);

    // Serial key stats
    const [activatedKeys, availableKeys, expiredKeys] = await Promise.all([
      db.serialKey.count({ where: { status: 'activated' } }),
      db.serialKey.count({ where: { status: 'available' } }),
      db.serialKey.count({ where: { status: 'expired' } }),
    ]);

    // Device stats
    const [totalDevices, pendingDevices] = await Promise.all([
      db.device.count(),
      db.device.count({ where: { approved: false, status: 'active' } }),
    ]);

    // Revenue stats
    const paidInvoices = await db.invoice.findMany({
      where: { status: 'paid' },
      select: { total: true },
    });
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const outstandingInvoices = await db.invoice.findMany({
      where: { status: { in: ['sent', 'draft'] } },
      select: { total: true },
    });
    const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Recent invoices
    const recentInvoices = await db.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, companyName: true } },
        items: true,
      },
    });

    // Recent quotations
    const recentQuotations = await db.quotation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, companyName: true } },
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalClients,
        activeClients,
        trialClients,
        activeKeys: activatedKeys,
        availableKeys,
        expiredKeys,
        totalDevices,
        pendingApprovals: pendingDevices,
        revenue: totalRevenue,
        outstanding: outstandingAmount,
        recentInvoices,
        recentQuotations,
      },
    });
  } catch (error) {
    console.error('Owner Dashboard GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
