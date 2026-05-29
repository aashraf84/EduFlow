import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'schoolId is required' }, { status: 400 })
    }

    const where: Prisma.TransportRouteWhereInput = { schoolId }

    if (search) {
      where.OR = [
        { routeName: { contains: search } },
        { routeNumber: { contains: search } },
        { driverName: { contains: search } },
        { vehicleNo: { contains: search } },
      ]
    }

    if (status) where.status = status

    const [routes, total] = await Promise.all([
      db.transportRoute.findMany({
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
      db.transportRoute.count({ where }),
    ])

    // Stats
    const [totalRoutes, activeRoutes, totalAssignments] = await Promise.all([
      db.transportRoute.count({ where: { schoolId } }),
      db.transportRoute.count({ where: { schoolId, status: 'active' } }),
      db.transportAssignment.count({ where: { schoolId, status: 'active' } }),
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
      schoolId, routeName, routeNumber, driverName, driverPhone,
      vehicleNo, capacity, stops, morningTime, eveningTime, status,
    } = body

    if (!schoolId || !routeName || !routeNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, routeName, routeNumber' },
        { status: 400 }
      )
    }

    const route = await db.transportRoute.create({
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
