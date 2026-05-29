import { NextRequest, NextResponse } from 'next/server';
import { masterDb } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastInvoice = await masterDb.invoice.findFirst({
    where: { invoiceNumber: { startsWith: `INV-${year}-` } },
    orderBy: { invoiceNumber: 'desc' },
  });

  let sequence = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-');
    sequence = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `INV-${year}-${sequence.toString().padStart(3, '0')}`;
}

export async function GET() {
  try {
    const invoices = await masterDb.invoice.findMany({
      include: {
        client: { select: { id: true, companyName: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientId: inv.clientId,
      client: inv.client.companyName,
      issueDate: inv.issueDate.toISOString(),
      dueDate: inv.dueDate.toISOString(),
      subtotal: inv.subtotal,
      tax: inv.taxAmount,
      taxRate: inv.taxRate,
      discount: inv.discount,
      total: inv.total,
      status: inv.status,
      notes: inv.notes,
      terms: inv.terms,
      paidDate: inv.paidDate?.toISOString(),
      items: inv.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Owner Invoices GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, dueDate, taxRate, discount, notes, terms, items } = body;

    if (!clientId || !dueDate || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: clientId, dueDate, items' },
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

    const subtotal = items.reduce((sum: number, item: { quantity?: number; unitPrice: number }) => {
      return sum + (item.quantity || 1) * item.unitPrice;
    }, 0);

    const taxRateValue = taxRate || 0;
    const discountValue = discount || 0;
    const taxAmount = subtotal * (taxRateValue / 100);
    const total = subtotal + taxAmount - discountValue;

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await masterDb.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        dueDate: new Date(dueDate),
        subtotal,
        taxRate: taxRateValue,
        taxAmount,
        discount: discountValue,
        total,
        status: 'draft',
        notes: notes || null,
        terms: terms || null,
        items: {
          create: items.map((item: { description: string; quantity?: number; unitPrice: number }) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            total: (item.quantity || 1) * item.unitPrice,
          })),
        },
      },
      include: { client: true, items: true },
    });

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error) {
    console.error('Owner Invoices POST error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Invoice number collision, please try again' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
