import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');
    const schoolId = searchParams.get('schoolId');
    const subjectId = searchParams.get('subjectId') || '';
    const termId = searchParams.get('termId') || '';
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

    // Build where clause
    const where: Prisma.ExamWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (termId) {
      where.termId = termId;
    }

    const [exams, total] = await Promise.all([
      tenantDb.exam.findMany({
        where,
        include: {
          subject: {
            select: { id: true, name: true, code: true, type: true },
          },
          term: {
            select: { id: true, name: true, status: true },
          },
          results: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  admissionNo: true,
                  class: { select: { name: true } },
                },
              },
            },
            orderBy: { marksObtained: 'desc' },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      tenantDb.exam.count({ where }),
    ]);

    // Compute summary for each exam
    const examsWithStats = exams.map((exam) => {
      const results = exam.results;
      const totalMarks = exam.totalMarks;
      const passingMarks = exam.passingMarks;
      const totalStudents = results.length;
      const passedStudents = results.filter((r) => r.marksObtained >= passingMarks).length;
      const failedStudents = totalStudents - passedStudents;
      const averageMarks =
        totalStudents > 0
          ? Math.round((results.reduce((sum, r) => sum + r.marksObtained, 0) / totalStudents) * 100) / 100
          : 0;
      const highestMarks = totalStudents > 0 ? Math.max(...results.map((r) => r.marksObtained)) : 0;
      const lowestMarks = totalStudents > 0 ? Math.min(...results.map((r) => r.marksObtained)) : 0;
      const passRate =
        totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 10000) / 100 : 0;

      return {
        ...exam,
        stats: {
          totalStudents,
          passedStudents,
          failedStudents,
          averageMarks,
          highestMarks,
          lowestMarks,
          passRate,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        exams: examsWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Exams GET error:', error);
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
      subjectId,
      termId,
      name,
      type,
      totalMarks,
      passingMarks,
      date,
      duration,
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

    // Validate required fields
    if (!schoolId || !subjectId || !termId || !name || totalMarks === undefined || passingMarks === undefined || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, subjectId, termId, name, totalMarks, passingMarks, date' },
        { status: 400 }
      );
    }

    // Validate subject exists
    const subject = await tenantDb.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Validate term exists
    const term = await tenantDb.term.findUnique({
      where: { id: termId },
    });

    if (!term) {
      return NextResponse.json(
        { success: false, error: 'Term not found' },
        { status: 404 }
      );
    }

    const exam = await tenantDb.exam.create({
      data: {
        schoolId,
        subjectId,
        termId,
        name,
        type: type || 'written',
        totalMarks: parseFloat(String(totalMarks)),
        passingMarks: parseFloat(String(passingMarks)),
        date: new Date(date),
        duration: duration ? parseInt(String(duration), 10) : null,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true },
        },
        term: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: exam },
      { status: 201 }
    );
  } catch (error) {
    console.error('Exams POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolCode, resultId, marksObtained, grade, remarks } = body;

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

    if (!resultId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: resultId' },
        { status: 400 }
      );
    }

    // Check if result exists
    const existingResult = await tenantDb.examResult.findUnique({
      where: { id: resultId },
    });

    if (!existingResult) {
      return NextResponse.json(
        { success: false, error: 'Exam result not found' },
        { status: 404 }
      );
    }

    const updateData: Prisma.ExamResultUpdateInput = {};
    if (marksObtained !== undefined) {
      updateData.marksObtained = parseFloat(String(marksObtained));
    }
    if (grade !== undefined) {
      updateData.grade = grade;
    }
    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }

    const result = await tenantDb.examResult.update({
      where: { id: resultId },
      data: updateData,
      include: {
        exam: {
          select: { id: true, name: true, totalMarks: true, passingMarks: true },
        },
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Exams PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
