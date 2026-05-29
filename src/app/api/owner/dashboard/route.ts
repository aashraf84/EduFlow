import { NextResponse } from 'next/server';
import { masterDb } from '@/lib/tenant-manager';

export async function GET() {
  try {
    // Client stats
    const [totalClients, activeClients, trialClients] = await Promise.all([
      masterDb.client.count(),
      masterDb.client.count({ where: { status: 'active' } }),
      masterDb.client.count({ where: { status: 'trial' } }),
    ]);

    // Serial key stats
    const [activatedKeys, availableKeys, expiredKeys] = await Promise.all([
      masterDb.serialKey.count({ where: { status: 'activated' } }),
      masterDb.serialKey.count({ where: { status: 'available' } }),
      masterDb.serialKey.count({ where: { status: 'expired' } }),
    ]);

    // Device stats
    const [totalDevices, pendingDevices] = await Promise.all([
      masterDb.device.count(),
      masterDb.device.count({ where: { approved: false, status: 'active' } }),
    ]);

    // Revenue stats
    const paidInvoices = await masterDb.invoice.findMany({
      where: { status: 'paid' },
      select: { total: true },
    });
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const outstandingInvoices = await masterDb.invoice.findMany({
      where: { status: { in: ['sent', 'draft'] } },
      select: { total: true },
    });
    const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Recent invoices
    const recentInvoices = await masterDb.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, companyName: true } },
        items: true,
      },
    });

    // Recent quotations
    const recentQuotations = await masterDb.quotation.findMany({
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
