import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { code: { contains: search } },
        { instructor: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [courses, total] = await Promise.all([
      db.course.findMany({
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
      db.course.count({ where }),
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
    const [totalCourses, publishedCourses, totalEnrollments, statusBreakdown] = await Promise.all([
      db.course.count({ where: { schoolId: schoolId || undefined } }),
      db.course.count({ where: { schoolId: schoolId || undefined, status: 'published' } }),
      db.courseEnrollment.count({
        where: { course: { schoolId: schoolId || undefined } },
      }),
      db.course.groupBy({
        by: ['status'],
        where: { schoolId: schoolId || undefined },
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

    if (!schoolId || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, title' },
        { status: 400 }
      );
    }

    const course = await db.course.create({
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
