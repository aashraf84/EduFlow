import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const search = searchParams.get('search') || ''
    const tab = searchParams.get('tab') || 'staff'

    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'schoolId is required' }, { status: 400 })
    }

    const where: Prisma.StaffMemberWhereInput = { schoolId }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { employeeId: { contains: search } },
        { email: { contains: search } },
        { designation: { contains: search } },
        { department: { contains: search } },
      ]
    }

    const staff = await db.staffMember.findMany({
      where,
      include: {
        payroll: { orderBy: { month: 'desc' }, take: 3 },
        leaves: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Stats
    const totalStaff = staff.length
    const activeStaff = staff.filter(s => s.status === 'active').length
    const totalPayroll = staff.reduce((acc, s) => acc + (s.salary || 0), 0)
    const pendingLeaves = await db.leaveRecord.count({ where: { schoolId, status: 'pending' } })

    // Department distribution
    const deptData = await db.staffMember.groupBy({
      by: ['department'],
      where: { schoolId, department: { not: null } },
      _count: { department: true },
      orderBy: { _count: { department: 'desc' } },
    })

    // Payroll records
    const payrollRecords = await db.payrollRecord.findMany({
      where: { schoolId },
      include: { staff: { select: { id: true, name: true, employeeId: true, department: true } } },
      orderBy: { month: 'desc' },
      take: 50,
    })

    // Monthly payroll trend
    const payrollTrend = await db.payrollRecord.groupBy({
      by: ['month'],
      where: { schoolId, status: 'paid' },
      _sum: { netPay: true },
      orderBy: { month: 'asc' },
    })

    // Leave records
    const leaveRecords = await db.leaveRecord.findMany({
      where: { schoolId },
      include: { staff: { select: { id: true, name: true, employeeId: true, department: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      data: {
        staff,
        payrollRecords,
        leaveRecords,
        stats: { totalStaff, activeStaff, totalPayroll, pendingLeaves },
        deptData: deptData.map(d => ({ department: d.department || 'Unknown', count: d._count.department })),
        payrollTrend: payrollTrend.map(p => ({ month: p.month, netPay: p._sum.netPay || 0 })),
        summary: {
          totalStaff,
          totalSalary: totalPayroll,
          pendingLeaves,
          departmentBreakdown: deptData.map(d => ({ department: d.department, count: d._count.department, totalSalary: 0 })),
          payrollStatusBreakdown: [],
        },
      },
    })
  } catch (error) {
    console.error('HR GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, schoolId } = body

    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'schoolId is required' }, { status: 400 })
    }

    if (action === 'addStaff') {
      const { name, employeeId, email, phone, department, designation, salary, dateOfJoining, bankAccount, panNumber } = body
      if (!name || !employeeId) {
        return NextResponse.json({ success: false, error: 'name and employeeId required' }, { status: 400 })
      }
      const staffMember = await db.staffMember.create({
        data: {
          schoolId, name, employeeId,
          email: email || null,
          phone: phone || null,
          department: department || null,
          designation: designation || null,
          salary: salary ? parseFloat(String(salary)) : null,
          dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
          bankAccount: bankAccount || null,
          panNumber: panNumber || null,
          status: 'active',
        },
      })
      return NextResponse.json({ success: true, data: { staff: staffMember } }, { status: 201 })
    }

    if (action === 'processPayroll') {
      const { staffId, month, basicPay, allowances, deductions } = body
      if (!staffId || !month || !basicPay) {
        return NextResponse.json({ success: false, error: 'staffId, month, basicPay required' }, { status: 400 })
      }
      const a = parseFloat(allowances) || 0
      const d = parseFloat(deductions) || 0
      const b = parseFloat(basicPay)
      const payroll = await db.payrollRecord.create({
        data: { schoolId, staffId, month, basicPay: b, allowances: a, deductions: d, netPay: b + a - d, status: 'pending' },
      })
      return NextResponse.json({ success: true, data: { payroll } }, { status: 201 })
    }

    if (action === 'applyLeave') {
      const { staffId, leaveType, startDate, endDate, days, reason } = body
      if (!staffId || !leaveType || !startDate || !endDate || !days) {
        return NextResponse.json({ success: false, error: 'staffId, leaveType, startDate, endDate, days required' }, { status: 400 })
      }
      const leave = await db.leaveRecord.create({
        data: {
          schoolId, staffId, leaveType,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          days: parseInt(String(days)),
          reason: reason || null,
          status: 'pending',
        },
      })
      return NextResponse.json({ success: true, data: { leave } }, { status: 201 })
    }

    // Default: add staff (backward compat)
    const { name, employeeId, email, phone, department, designation, salary, dateOfJoining, bankAccount, panNumber } = body
    if (!name || !employeeId) {
      return NextResponse.json({ success: false, error: 'name and employeeId required' }, { status: 400 })
    }
    const staffMember = await db.staffMember.create({
      data: {
        schoolId, name, employeeId,
        email: email || null,
        phone: phone || null,
        department: department || null,
        designation: designation || null,
        salary: salary ? parseFloat(String(salary)) : null,
        dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
        bankAccount: bankAccount || null,
        panNumber: panNumber || null,
        status: 'active',
      },
    })
    return NextResponse.json({ success: true, data: staffMember }, { status: 201 })
  } catch (error) {
    console.error('HR POST error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ success: false, error: 'Employee ID already exists' }, { status: 409 })
      }
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'updateLeave') {
      const { leaveId, status } = body
      if (!leaveId || !status) {
        return NextResponse.json({ success: false, error: 'leaveId and status required' }, { status: 400 })
      }
      const leave = await db.leaveRecord.update({ where: { id: leaveId }, data: { status } })
      return NextResponse.json({ success: true, data: { leave } })
    }

    if (action === 'markPayrollPaid') {
      const { payrollId } = body
      if (!payrollId) {
        return NextResponse.json({ success: false, error: 'payrollId required' }, { status: 400 })
      }
      const payroll = await db.payrollRecord.update({
        where: { id: payrollId },
        data: { status: 'paid', paidDate: new Date() },
      })
      return NextResponse.json({ success: true, data: { payroll } })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('HR PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
  }
}
