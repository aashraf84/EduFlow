import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const search = searchParams.get('search') || ''
    const graduationYear = searchParams.get('graduationYear') || ''
    const department = searchParams.get('department') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'schoolId is required' }, { status: 400 })
    }

    const where: Prisma.AlumniWhereInput = { schoolId }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { currentCompany: { contains: search } },
        { currentRole: { contains: search } },
        { department: { contains: search } },
      ]
    }

    if (graduationYear) where.graduationYear = parseInt(graduationYear, 10)
    if (department) where.department = department

    const [alumni, total] = await Promise.all([
      db.alumni.findMany({ where, orderBy: { graduationYear: 'desc' }, skip, take: limit }),
      db.alumni.count({ where }),
    ])

    // Stats
    const [totalAlumni, employed, thisYearGraduates] = await Promise.all([
      db.alumni.count({ where: { schoolId } }),
      db.alumni.count({ where: { schoolId, currentCompany: { not: null } } }),
      db.alumni.count({ where: { schoolId, graduationYear: new Date().getFullYear() } }),
    ])

    const companyBreakdown = await db.alumni.groupBy({
      by: ['currentCompany'],
      where: { schoolId, currentCompany: { not: null } },
      _count: { currentCompany: true },
      orderBy: { _count: { currentCompany: 'desc' } },
      take: 5,
    })

    const byYearData = await db.alumni.groupBy({
      by: ['graduationYear'],
      where: { schoolId },
      _count: { graduationYear: true },
      orderBy: { graduationYear: 'asc' },
    })

    const byDeptData = await db.alumni.groupBy({
      by: ['department'],
      where: { schoolId, department: { not: null } },
      _count: { department: true },
      orderBy: { _count: { department: 'desc' } },
    })

    return NextResponse.json({
      success: true,
      data: {
        alumni,
        stats: {
          totalAlumni,
          thisYearGraduates,
          employed,
          topCompanies: companyBreakdown.filter(c => c.currentCompany).length,
        },
        byYearData: byYearData.map(d => ({ year: d.graduationYear, count: d._count.graduationYear })),
        byDeptData: byDeptData.map(d => ({ department: d.department || 'Unknown', count: d._count.department })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    console.error('Alumni GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schoolId, name, email, phone, graduationYear, degree, department, currentCompany, currentRole, linkedIn } = body

    if (!schoolId || !name || !email) {
      return NextResponse.json({ success: false, error: 'Missing required fields: schoolId, name, email' }, { status: 400 })
    }

    const alumni = await db.alumni.create({
      data: {
        schoolId, name, email,
        phone: phone || null,
        graduationYear: parseInt(String(graduationYear), 10) || new Date().getFullYear(),
        degree: degree || null,
        department: department || null,
        currentCompany: currentCompany || null,
        currentRole: currentRole || null,
        linkedIn: linkedIn || null,
        status: 'active',
      },
    })

    return NextResponse.json({ success: true, data: { alumni } }, { status: 201 })
  } catch (error) {
    console.error('Alumni POST error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
