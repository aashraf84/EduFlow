import { NextRequest, NextResponse } from 'next/server'
import { getTenantDbByCode } from '@/lib/tenant-manager'
import { Prisma } from '@prisma/client'

const emptyInventoryData = {
  assets: [],
  stats: {
    totalAssets: 0,
    activeAssets: 0,
    totalValue: 0,
    maintenanceDue: 0,
  },
  byCategoryData: [],
  byConditionData: [],
  summary: {
    totalAssets: 0,
    totalValue: 0,
    totalDepreciation: 0,
    netValue: 0,
    categoryBreakdown: [],
    conditionBreakdown: [],
  },
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolCode = searchParams.get('schoolCode')
    const schoolId = searchParams.get('schoolId')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const condition = searchParams.get('condition') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    if (!schoolCode) {
      return NextResponse.json({ success: false, error: 'schoolCode is required' }, { status: 400 })
    }

    const tenantDb = await getTenantDbByCode(schoolCode)
    if (!tenantDb) {
      return NextResponse.json({ success: true, data: emptyInventoryData })
    }

    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'schoolId is required' }, { status: 400 })
    }

    const where: Prisma.AssetWhereInput = { schoolId }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { assetCode: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { assignedTo: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category && category !== 'all') where.category = category
    if (status) where.status = status
    if (condition) where.condition = condition

    const [assets, total] = await Promise.all([
      tenantDb.asset.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      tenantDb.asset.count({ where }),
    ])

    // Stats
    const [totalAssets, activeAssets, totalValueAgg, maintenanceDue] = await Promise.all([
      tenantDb.asset.count({ where: { schoolId } }),
      tenantDb.asset.count({ where: { schoolId, status: 'active' } }),
      tenantDb.asset.aggregate({ where: { schoolId }, _sum: { purchaseCost: true } }),
      tenantDb.asset.count({ where: { schoolId, condition: { in: ['poor', 'needs_repair'] } } }),
    ])

    // By category
    const byCategoryData = await tenantDb.asset.groupBy({
      by: ['category'],
      where: { schoolId },
      _count: { category: true },
      _sum: { purchaseCost: true },
      orderBy: { _count: { category: 'desc' } },
    })

    // By condition
    const byConditionData = await tenantDb.asset.groupBy({
      by: ['condition'],
      where: { schoolId },
      _count: { condition: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        assets,
        stats: {
          totalAssets,
          activeAssets,
          totalValue: totalValueAgg._sum.purchaseCost || 0,
          maintenanceDue,
        },
        byCategoryData: byCategoryData.map(d => ({
          category: d.category,
          count: d._count.category,
          value: d._sum.purchaseCost || 0,
        })),
        byConditionData: byConditionData.map(d => ({
          condition: d.condition,
          count: d._count.condition,
        })),
        summary: {
          totalAssets,
          totalValue: totalValueAgg._sum.purchaseCost || 0,
          totalDepreciation: 0,
          netValue: totalValueAgg._sum.purchaseCost || 0,
          categoryBreakdown: byCategoryData.map(c => ({ category: c.category, count: c._count.category, value: c._sum.purchaseCost || 0, depreciation: 0 })),
          conditionBreakdown: byConditionData.map(c => ({ condition: c.condition, count: c._count.condition })),
        },
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    console.error('Inventory GET error:', error)
    return NextResponse.json({ success: true, data: emptyInventoryData })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schoolCode, schoolId, name, assetCode, category, purchaseDate, purchaseCost, condition, location, assignedTo, vendor, warrantyEnd } = body

    if (!schoolCode) {
      return NextResponse.json({ success: false, error: 'schoolCode is required' }, { status: 400 })
    }

    const tenantDb = await getTenantDbByCode(schoolCode)
    if (!tenantDb) {
      return NextResponse.json({ success: true, data: null })
    }

    if (!schoolId || !name || !assetCode || !category) {
      return NextResponse.json({ success: false, error: 'Missing required fields: schoolId, name, assetCode, category' }, { status: 400 })
    }

    const asset = await tenantDb.asset.create({
      data: {
        schoolId, name, assetCode, category,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        purchaseCost: parseFloat(String(purchaseCost || 0)),
        condition: condition || 'good',
        location: location || null,
        assignedTo: assignedTo || null,
        vendor: vendor || null,
        warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
        depreciation: 0,
        status: 'active',
      },
    })

    return NextResponse.json({ success: true, data: { asset } }, { status: 201 })
  } catch (error) {
    console.error('Inventory POST error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ success: false, error: 'Asset code already exists' }, { status: 409 })
      }
    }
    return NextResponse.json({ success: true, data: null })
  }
}
