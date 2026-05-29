import { NextRequest, NextResponse } from 'next/server';
import { masterDb } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

async function generateQuotationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastQuotation = await masterDb.quotation.findFirst({
    where: { quotationNumber: { startsWith: `QUO-${year}-` } },
    orderBy: { quotationNumber: 'desc' },
  });

  let sequence = 1;
  if (lastQuotation) {
    const parts = lastQuotation.quotationNumber.split('-');
    sequence = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `QUO-${year}-${sequence.toString().padStart(3, '0')}`;
}

export async function GET() {
  try {
    const quotations = await masterDb.quotation.findMany({
      include: {
        client: { select: { id: true, companyName: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = quotations.map((q) => ({
      id: q.id,
      quotationNumber: q.quotationNumber,
      clientId: q.clientId,
      client: q.client.companyName,
      issueDate: q.issueDate.toISOString(),
      validUntil: q.validUntil.toISOString(),
      subtotal: q.subtotal,
      tax: q.taxAmount,
      taxRate: q.taxRate,
      discount: q.discount,
      total: q.total,
      status: q.status,
      notes: q.notes,
      terms: q.terms,
      convertedToInvoice: q.convertedToInvoice,
      items: q.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Owner Quotations GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, validUntil, taxRate, discount, notes, terms, items } = body;

    if (!clientId || !validUntil || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: clientId, validUntil, items' },
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

    const quotationNumber = await generateQuotationNumber();

    const quotation = await masterDb.quotation.create({
      data: {
        quotationNumber,
        clientId,
        validUntil: new Date(validUntil),
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

    return NextResponse.json({ success: true, data: quotation }, { status: 201 });
  } catch (error) {
    console.error('Owner Quotations POST error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Quotation number collision, please try again' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
