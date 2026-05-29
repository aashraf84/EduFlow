import { NextRequest, NextResponse } from 'next/server'
import { getTenantDbByCode } from '@/lib/tenant-manager'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolCode = searchParams.get('schoolCode')
    const schoolId = searchParams.get('schoolId')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
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

    const where: Prisma.TransportRouteWhereInput = { schoolId }

    if (search) {
      where.OR = [
        { routeName: { contains: search, mode: 'insensitive' } },
        { routeNumber: { contains: search, mode: 'insensitive' } },
        { driverName: { contains: search, mode: 'insensitive' } },
        { vehicleNo: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) where.status = status

    const [routes, total] = await Promise.all([
      tenantDb.transportRoute.findMany({
        where,
        include: {
          assignments: {
            where: { status: 'active' },
            include: {
              student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      tenantDb.transportRoute.count({ where }),
    ])

    // Stats
    const [totalRoutes, activeRoutes, totalAssignments] = await Promise.all([
      tenantDb.transportRoute.count({ where: { schoolId } }),
      tenantDb.transportRoute.count({ where: { schoolId, status: 'active' } }),
      tenantDb.transportAssignment.count({ where: { schoolId, status: 'active' } }),
    ])

    // Route utilization data for analytics
    const routeUtilization = routes.map(r => ({
      name: r.routeName,
      capacity: r.capacity,
      assigned: r.assignments.length,
    }))

    return NextResponse.json({
      success: true,
      data: {
        routes,
        stats: {
          totalRoutes,
          totalVehicles: totalRoutes,
          studentsUsing: totalAssignments,
          activeRoutes,
        },
        routeUtilization,
        summary: {
          totalRoutes,
          activeRoutes,
          inactiveRoutes: totalRoutes - activeRoutes,
          totalAssignments,
        },
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    console.error('Transport GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      schoolCode, schoolId, routeName, routeNumber, driverName, driverPhone,
      vehicleNo, capacity, stops, morningTime, eveningTime, status,
    } = body

    if (!schoolCode) {
      return NextResponse.json({ success: false, error: 'schoolCode is required' }, { status: 400 })
    }

    const tenantDb = await getTenantDbByCode(schoolCode)
    if (!tenantDb) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })
    }

    if (!schoolId || !routeName || !routeNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, routeName, routeNumber' },
        { status: 400 }
      )
    }

    const route = await tenantDb.transportRoute.create({
      data: {
        schoolId,
        routeName,
        routeNumber,
        driverName: driverName || '',
        driverPhone: driverPhone || null,
        vehicleNo: vehicleNo || '',
        capacity: capacity ? parseInt(String(capacity)) : 40,
        stops: stops || null,
        morningTime: morningTime || null,
        eveningTime: eveningTime || null,
        status: status || 'active',
      },
    })

    return NextResponse.json({ success: true, data: { route } }, { status: 201 })
  } catch (error) {
    console.error('Transport POST error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
