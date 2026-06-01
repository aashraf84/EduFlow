import { NextRequest, NextResponse } from 'next/server'
import { getTenantDbByCode } from '@/lib/tenant-manager'
import { Prisma } from '@prisma/client'

const emptyHostelData = {
  hostels: [],
  allocations: [],
  stats: {
    totalHostels: 0,
    totalRooms: 0,
    totalOccupants: 0,
    occupancyRate: 0,
  },
  occupancyByHostel: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolCode = searchParams.get('schoolCode')
    const schoolId = searchParams.get('schoolId')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    if (!schoolCode) {
      return NextResponse.json({ success: false, error: 'schoolCode is required' }, { status: 400 })
    }

    const tenantDb = await getTenantDbByCode(schoolCode)
    if (!tenantDb) {
      return NextResponse.json({ success: true, data: emptyHostelData })
    }

    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'schoolId is required' }, { status: 400 })
    }

    const where: Prisma.HostelWhereInput = { schoolId }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { wardenName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (type) where.type = type
    if (status) where.status = status

    const [hostels, total] = await Promise.all([
      tenantDb.hostel.findMany({
        where,
        include: {
          rooms: {
            include: {
              allocations: {
                where: { status: 'active' },
                include: {
                  student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
                },
              },
            },
            orderBy: { roomNumber: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      tenantDb.hostel.count({ where }),
    ])

    // Overall stats
    const [totalRooms, totalOccupants] = await Promise.all([
      tenantDb.hostelRoom.count({ where: { hostel: { schoolId } } }),
      tenantDb.hostelAllocation.count({ where: { schoolId, status: 'active' } }),
    ])

    const totalCapacity = await tenantDb.hostelRoom.aggregate({
      where: { hostel: { schoolId } },
      _sum: { capacity: true },
    })

    const occupancyRate = (totalCapacity._sum.capacity || 0) > 0
      ? Math.round((totalOccupants / (totalCapacity._sum.capacity || 1)) * 100)
      : 0

    // Occupancy by hostel
    const occupancyByHostel = hostels.map(h => {
      const roomCapacity = h.rooms.reduce((a, r) => a + r.capacity, 0)
      const roomOccupants = h.rooms.reduce((a, r) => a + r.occupants, 0)
      return { name: h.name, capacity: roomCapacity, occupants: roomOccupants }
    })

    // All allocations for tracking
    const allocations = await tenantDb.hostelAllocation.findMany({
      where: { schoolId },
      include: {
        room: { include: { hostel: { select: { name: true } } } },
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
      },
      orderBy: { checkIn: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      data: {
        hostels,
        allocations,
        stats: {
          totalHostels: hostels.length,
          totalRooms,
          totalOccupants,
          occupancyRate,
        },
        occupancyByHostel,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    console.error('Hostel GET error:', error)
    return NextResponse.json({ success: true, data: emptyHostelData })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schoolCode, action, schoolId } = body

    if (!schoolCode) {
      return NextResponse.json({ success: false, error: 'schoolCode is required' }, { status: 400 })
    }

    const tenantDb = await getTenantDbByCode(schoolCode)
    if (!tenantDb) {
      return NextResponse.json({ success: true, data: null })
    }

    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'schoolId is required' }, { status: 400 })
    }

    if (action === 'addHostel') {
      const { name, type, capacity, wardenName, wardenPhone, floors } = body
      if (!name) {
        return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 })
      }
      const hostel = await tenantDb.hostel.create({
        data: {
          schoolId, name,
          type: type || 'boys',
          capacity: capacity ? parseInt(String(capacity)) : 100,
          wardenName: wardenName || null,
          wardenPhone: wardenPhone || null,
          floors: floors ? parseInt(String(floors)) : 3,
          status: 'active',
        },
      })
      return NextResponse.json({ success: true, data: { hostel } }, { status: 201 })
    }

    if (action === 'addRoom') {
      const { hostelId, roomNumber, floor, capacity, roomType } = body
      if (!hostelId || !roomNumber) {
        return NextResponse.json({ success: false, error: 'hostelId and roomNumber required' }, { status: 400 })
      }
      const room = await tenantDb.hostelRoom.create({
        data: {
          hostelId,
          roomNumber,
          floor: floor ? parseInt(String(floor)) : 1,
          capacity: capacity ? parseInt(String(capacity)) : 2,
          roomType: roomType || 'shared',
          status: 'available',
        },
      })
      return NextResponse.json({ success: true, data: { room } }, { status: 201 })
    }

    // Default: add hostel (backward compat)
    const { name, type, capacity, wardenName, wardenPhone, floors } = body
    if (!name) {
      return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 })
    }
    const hostel = await tenantDb.hostel.create({
      data: {
        schoolId, name,
        type: type || 'boys',
        capacity: capacity || 100,
        wardenName: wardenName || null,
        wardenPhone: wardenPhone || null,
        floors: floors || 3,
        status: 'active',
      },
    })
    return NextResponse.json({ success: true, data: hostel }, { status: 201 })
  } catch (error) {
    console.error('Hostel POST error:', error)
    return NextResponse.json({ success: true, data: null })
  }
}
