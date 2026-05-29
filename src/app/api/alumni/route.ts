import { NextRequest, NextResponse } from 'next/server'
import { getTenantDbByCode } from '@/lib/tenant-manager'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolCode = searchParams.get('schoolCode')
    const schoolId = searchParams.get('schoolId')
    const search = searchParams.get('search') || ''
    const graduationYear = searchParams.get('graduationYear') || ''
    const department = searchParams.get('department') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    if (!schoolCode) {
      return NextResponse.json({ success: false, error: 'schoolCode is required' }, { status: 400 })
    }

    const tenantDb = await getTenantDbByCode(schoolCode)
    if (!tenantDb) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })
    }

    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'schoolId is required' }, { status: 400 })
    }

    const where: Prisma.AlumniWhereInput = { schoolId }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { currentCompany: { contains: search, mode: 'insensitive' } },
        { currentRole: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (graduationYear) where.graduationYear = parseInt(graduationYear, 10)
    if (department) where.department = department

    const [alumni, total] = await Promise.all([
      tenantDb.alumni.findMany({ where, orderBy: { graduationYear: 'desc' }, skip, take: limit }),
      tenantDb.alumni.count({ where }),
    ])

    // Stats
    const [totalAlumni, employed, thisYearGraduates] = await Promise.all([
      tenantDb.alumni.count({ where: { schoolId } }),
      tenantDb.alumni.count({ where: { schoolId, currentCompany: { not: null } } }),
      tenantDb.alumni.count({ where: { schoolId, graduationYear: new Date().getFullYear() } }),
    ])

    const companyBreakdown = await tenantDb.alumni.groupBy({
      by: ['currentCompany'],
      where: { schoolId, currentCompany: { not: null } },
      _count: { currentCompany: true },
      orderBy: { _count: { currentCompany: 'desc' } },
      take: 5,
    })

    const byYearData = await tenantDb.alumni.groupBy({
      by: ['graduationYear'],
      where: { schoolId },
      _count: { graduationYear: true },
      orderBy: { graduationYear: 'asc' },
    })

    const byDeptData = await tenantDb.alumni.groupBy({
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
    const { schoolCode, schoolId, name, email, phone, graduationYear, degree, department, currentCompany, currentRole, linkedIn } = body

    if (!schoolCode) {
      return NextResponse.json({ success: false, error: 'schoolCode is required' }, { status: 400 })
    }

    const tenantDb = await getTenantDbByCode(schoolCode)
    if (!tenantDb) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })
    }

    if (!schoolId || !name || !email) {
      return NextResponse.json({ success: false, error: 'Missing required fields: schoolId, name, email' }, { status: 400 })
    }

    const alumni = await tenantDb.alumni.create({
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
