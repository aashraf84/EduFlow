import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

const emptyCommunicationData = {
  announcements: [],
  notifications: [],
  unreadNotificationCount: 0,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  notificationPagination: null,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');
    const schoolId = searchParams.get('schoolId');
    const type = searchParams.get('type') || '';
    const target = searchParams.get('target') || '';
    const priority = searchParams.get('priority') || '';
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
      return NextResponse.json({ success: true, data: emptyCommunicationData });
    }

    // Build where clause for announcements
    const announcementWhere: Prisma.AnnouncementWhereInput = {};

    if (schoolId) {
      announcementWhere.schoolId = schoolId;
    }

    if (type) {
      announcementWhere.type = type;
    }

    if (target) {
      announcementWhere.target = target;
    }

    if (priority) {
      announcementWhere.priority = priority;
    }

    // Also get notifications if userId is provided
    const userId = searchParams.get('userId') || '';
    const notificationWhere: Prisma.NotificationWhereInput = {};

    if (schoolId) {
      notificationWhere.schoolId = schoolId;
    }

    if (userId) {
      notificationWhere.userId = userId;
    }

    const [announcements, announcementsTotal, notifications, notificationsTotal] = await Promise.all([
      tenantDb.announcement.findMany({
        where: announcementWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      tenantDb.announcement.count({ where: announcementWhere }),
      userId
        ? tenantDb.notification.findMany({
            where: notificationWhere,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          })
        : [],
      userId ? tenantDb.notification.count({ where: notificationWhere }) : 0,
    ]);

    // Get unread notification count if userId provided
    const unreadCount = userId
      ? await tenantDb.notification.count({
          where: { userId, read: false },
        })
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        announcements,
        notifications,
        unreadNotificationCount: unreadCount,
        pagination: {
          page,
          limit,
          total: announcementsTotal,
          totalPages: Math.ceil(announcementsTotal / limit),
        },
        notificationPagination: userId
          ? {
              page,
              limit,
              total: notificationsTotal,
              totalPages: Math.ceil(notificationsTotal / limit),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Communication GET error:', error);
    return NextResponse.json({ success: true, data: emptyCommunicationData });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schoolCode,
      schoolId,
      title,
      content,
      type,
      target,
      priority,
    } = body;

    if (!schoolCode) {
      return NextResponse.json(
        { success: false, error: 'schoolCode is required' },
        { status: 400 }
      );
    }

    const tenantDb = await getTenantDbByCode(schoolCode);
    if (!tenantDb) {
      return NextResponse.json({ success: true, data: null });
    }

    // Validate required fields
    if (!schoolId || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, title, content' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['general', 'academic', 'event', 'emergency', 'maintenance'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['normal', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { success: false, error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate target
    const validTargets = ['all', 'students', 'teachers', 'parents', 'staff'];
    if (target && !validTargets.includes(target)) {
      return NextResponse.json(
        { success: false, error: `Invalid target. Must be one of: ${validTargets.join(', ')}` },
        { status: 400 }
      );
    }

    // Create announcement
    const announcement = await tenantDb.announcement.create({
      data: {
        schoolId,
        title,
        content,
        type: type || 'general',
        target: target || 'all',
        priority: priority || 'normal',
      },
    });

    // Create notifications for relevant users based on target
    const userRoleMap: Record<string, string[]> = {
      all: ['admin', 'principal', 'teacher', 'student', 'parent'],
      students: ['student'],
      teachers: ['teacher'],
      parents: ['parent'],
      staff: ['admin', 'principal', 'teacher'],
    };

    const targetRoles = userRoleMap[target || 'all'] || userRoleMap.all;

    const users = await tenantDb.user.findMany({
      where: {
        schoolId,
        role: { in: targetRoles },
        status: 'active',
      },
      select: { id: true },
    });

    if (users.length > 0) {
      await tenantDb.notification.createMany({
        data: users.map((user) => ({
          schoolId,
          userId: user.id,
          title: `New Announcement: ${title}`,
          message: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          type: priority === 'urgent' ? 'warning' : type === 'emergency' ? 'error' : 'info',
        })),
      });
    }

    return NextResponse.json(
      { success: true, data: { announcement, notificationsCreated: users.length } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Communication POST error:', error);
    return NextResponse.json({ success: true, data: null });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolCode, notificationId, read } = body;

    if (!schoolCode) {
      return NextResponse.json(
        { success: false, error: 'schoolCode is required' },
        { status: 400 }
      );
    }

    const tenantDb = await getTenantDbByCode(schoolCode);
    if (!tenantDb) {
      return NextResponse.json({ success: true, data: null });
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: notificationId' },
        { status: 400 }
      );
    }

    const existingNotification = await tenantDb.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    const notification = await tenantDb.notification.update({
      where: { id: notificationId },
      data: { read: read !== undefined ? read : true },
    });

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Communication PATCH error:', error);
    return NextResponse.json({ success: true, data: null });
  }
}
