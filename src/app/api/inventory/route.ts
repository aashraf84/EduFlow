import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const condition = searchParams.get('condition') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'schoolId is required' }, { status: 400 })
    }

    const where: Prisma.AssetWhereInput = { schoolId }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { assetCode: { contains: search } },
        { location: { contains: search } },
        { assignedTo: { contains: search } },
        { vendor: { contains: search } },
      ]
    }

    if (category && category !== 'all') where.category = category
    if (status) where.status = status
    if (condition) where.condition = condition

    const [assets, total] = await Promise.all([
      db.asset.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      db.asset.count({ where }),
    ])

    // Stats
    const [totalAssets, activeAssets, totalValueAgg, maintenanceDue] = await Promise.all([
      db.asset.count({ where: { schoolId } }),
      db.asset.count({ where: { schoolId, status: 'active' } }),
      db.asset.aggregate({ where: { schoolId }, _sum: { purchaseCost: true } }),
      db.asset.count({ where: { schoolId, condition: { in: ['poor', 'needs_repair'] } } }),
    ])

    // By category
    const byCategoryData = await db.asset.groupBy({
      by: ['category'],
      where: { schoolId },
      _count: { category: true },
      _sum: { purchaseCost: true },
      orderBy: { _count: { category: 'desc' } },
    })

    // By condition
    const byConditionData = await db.asset.groupBy({
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
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schoolId, name, assetCode, category, purchaseDate, purchaseCost, condition, location, assignedTo, vendor, warrantyEnd } = body

    if (!schoolId || !name || !assetCode || !category) {
      return NextResponse.json({ success: false, error: 'Missing required fields: schoolId, name, assetCode, category' }, { status: 400 })
    }

    const asset = await db.asset.create({
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
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
