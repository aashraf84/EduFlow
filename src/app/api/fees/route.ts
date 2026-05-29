import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');
    const schoolId = searchParams.get('schoolId');
    const studentId = searchParams.get('studentId') || '';
    const status = searchParams.get('status') || '';
    const feeType = searchParams.get('feeType') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    if (!schoolCode) {
      return NextResponse.json(
        { success: false, error: 'schoolCode is required' },
        { status: 400 }
      );
    }

    const tenantDb = await getTenantDbByCode(schoolCode);
    if (!tenantDb) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: Prisma.FeePaymentWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (status) {
      where.status = status;
    }

    if (feeType) {
      where.feeType = feeType;
    }

    const [payments, total] = await Promise.all([
      tenantDb.feePayment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
              class: { select: { name: true } },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        skip,
        take: limit,
      }),
      tenantDb.feePayment.count({ where }),
    ]);

    // Compute summary stats
    const [totalAmount, totalPaid, totalPending, statusBreakdown] = await Promise.all([
      tenantDb.feePayment.aggregate({
        where,
        _sum: { amount: true },
      }),
      tenantDb.feePayment.aggregate({
        where,
        _sum: { paidAmount: true },
      }),
      tenantDb.feePayment.aggregate({
        where: { ...where, status: { in: ['pending', 'overdue', 'partial'] } },
        _sum: { amount: true },
      }),
      tenantDb.feePayment.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
        _sum: { amount: true, paidAmount: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        payments,
        summary: {
          totalAmount: totalAmount._sum.amount || 0,
          totalPaid: totalPaid._sum.paidAmount || 0,
          totalPending: (totalAmount._sum.amount || 0) - (totalPaid._sum.paidAmount || 0),
          outstandingAmount: totalPending._sum.amount || 0,
          statusBreakdown: statusBreakdown.map((s) => ({
            status: s.status,
            count: s._count.status,
            amount: s._sum.amount || 0,
            paidAmount: s._sum.paidAmount || 0,
          })),
          collectionRate:
            (totalAmount._sum.amount || 0) > 0
              ? Math.round(((totalPaid._sum.paidAmount || 0) / (totalAmount._sum.amount || 1)) * 10000) / 100
              : 0,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Fees GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schoolCode,
      schoolId,
      studentId,
      amount,
      paidAmount,
      feeType,
      status,
      dueDate,
      paidDate,
      paymentMode,
      transactionId,
      discount,
      remarks,
    } = body;

    if (!schoolCode) {
      return NextResponse.json(
        { success: false, error: 'schoolCode is required' },
        { status: 400 }
      );
    }

    const tenantDb = await getTenantDbByCode(schoolCode);
    if (!tenantDb) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!schoolId || !studentId || !amount || !feeType || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, studentId, amount, feeType, dueDate' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await tenantDb.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Validate fee type
    const validFeeTypes = ['Tuition Fee', 'Lab Fee', 'Library Fee', 'Transport Fee', 'Sports Fee', 'Other'];
    if (feeType && !validFeeTypes.includes(feeType)) {
      return NextResponse.json(
        { success: false, error: `Invalid fee type. Must be one of: ${validFeeTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const feePayment = await tenantDb.feePayment.create({
      data: {
        schoolId,
        studentId,
        amount: parseFloat(String(amount)),
        paidAmount: paidAmount ? parseFloat(String(paidAmount)) : 0,
        feeType,
        status: status || 'pending',
        dueDate: new Date(dueDate),
        paidDate: paidDate ? new Date(paidDate) : null,
        paymentMode: paymentMode || null,
        transactionId: transactionId || null,
        discount: discount ? parseFloat(String(discount)) : 0,
        remarks: remarks || null,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            class: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: feePayment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Fees POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolCode, paymentId, status, paidAmount, paymentMode, transactionId, paidDate, remarks } = body;

    if (!schoolCode) {
      return NextResponse.json(
        { success: false, error: 'schoolCode is required' },
        { status: 400 }
      );
    }

    const tenantDb = await getTenantDbByCode(schoolCode);
    if (!tenantDb) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: paymentId' },
        { status: 400 }
      );
    }

    // Check if payment exists
    const existingPayment = await tenantDb.feePayment.findUnique({
      where: { id: paymentId },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Fee payment not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Prisma.FeePaymentUpdateInput = {};

    if (status) {
      const validStatuses = ['pending', 'paid', 'partial', 'overdue'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (paidAmount !== undefined) {
      updateData.paidAmount = parseFloat(String(paidAmount));
    }

    if (paymentMode) {
      updateData.paymentMode = paymentMode;
    }

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    if (paidDate) {
      updateData.paidDate = new Date(paidDate);
    } else if (status === 'paid') {
      updateData.paidDate = new Date();
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }

    const payment = await tenantDb.feePayment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            class: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Fees PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
