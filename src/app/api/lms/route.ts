import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
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

    const where: Prisma.CourseWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { instructor: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [courses, total] = await Promise.all([
      tenantDb.course.findMany({
        where,
        include: {
          _count: {
            select: { materials: true, enrollments: true },
          },
          enrollments: {
            where: { status: 'active' },
            select: { progress: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      tenantDb.course.count({ where }),
    ]);

    // Enrich with computed enrollment stats
    const enrichedCourses = courses.map((course) => {
      const activeEnrollments = course.enrollments.length;
      const avgProgress = activeEnrollments > 0
        ? Math.round(course.enrollments.reduce((sum, e) => sum + e.progress, 0) / activeEnrollments)
        : 0;
      return {
        id: course.id,
        schoolId: course.schoolId,
        title: course.title,
        code: course.code,
        description: course.description,
        instructor: course.instructor,
        classId: course.classId,
        subjectId: course.subjectId,
        thumbnail: course.thumbnail,
        duration: course.duration,
        status: course.status,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        materialCount: course._count.materials,
        totalEnrollments: course._count.enrollments,
        activeEnrollments,
        avgProgress,
      };
    });

    // Summary stats
    const schoolIdFilter = schoolId || undefined;
    const [totalCourses, publishedCourses, totalEnrollments, statusBreakdown] = await Promise.all([
      tenantDb.course.count({ where: { schoolId: schoolIdFilter } }),
      tenantDb.course.count({ where: { schoolId: schoolIdFilter, status: 'published' } }),
      tenantDb.courseEnrollment.count({
        where: { course: { schoolId: schoolIdFilter } },
      }),
      tenantDb.course.groupBy({
        by: ['status'],
        where: { schoolId: schoolIdFilter },
        _count: { status: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        courses: enrichedCourses,
        summary: {
          totalCourses,
          publishedCourses,
          draftCourses: totalCourses - publishedCourses,
          totalEnrollments,
          statusBreakdown: statusBreakdown.map((s) => ({
            status: s.status,
            count: s._count.status,
          })),
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
    console.error('LMS GET error:', error);
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
      title,
      code,
      description,
      instructor,
      classId,
      subjectId,
      thumbnail,
      duration,
      status,
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

    if (!schoolId || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, title' },
        { status: 400 }
      );
    }

    const course = await tenantDb.course.create({
      data: {
        schoolId,
        title,
        code: code || null,
        description: description || null,
        instructor: instructor || null,
        classId: classId || null,
        subjectId: subjectId || null,
        thumbnail: thumbnail || null,
        duration: duration || null,
        status: status || 'draft',
      },
    });

    return NextResponse.json(
      { success: true, data: course },
      { status: 201 }
    );
  } catch (error) {
    console.error('LMS POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
