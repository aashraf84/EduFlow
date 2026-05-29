import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type InsightType = 'student_risk' | 'performance' | 'admin_report' | 'teacher_assistant';

const INSIGHT_SYSTEM_PROMPTS: Record<InsightType, string> = {
  student_risk:
    'You are an AI education analytics assistant specializing in student risk assessment. Analyze the provided student data and identify at-risk students, explain risk factors, and provide actionable recommendations for intervention. Be specific, data-driven, and practical. Format your response with clear sections and bullet points.',
  performance:
    'You are an AI education analytics assistant specializing in academic performance analysis. Analyze the provided exam and result data to identify trends, patterns, and insights about student performance. Provide actionable recommendations for improvement. Be specific with data references and format with clear sections.',
  admin_report:
    'You are an AI education analytics assistant generating administrative reports. Analyze the provided school data comprehensively, covering attendance, academics, finances, and operations. Provide executive summaries, key metrics, trends, and strategic recommendations. Format as a professional report with sections and highlights.',
  teacher_assistant:
    'You are an AI teaching assistant for educators. Based on the provided class and student data, offer personalized teaching strategies, differentiation suggestions, classroom management tips, and resource recommendations. Be practical, specific, and pedagogically sound.',
};

async function gatherStudentRiskData(schoolId: string) {
  const [students, attendance, behaviorLogs, examResults] = await Promise.all([
    db.student.findMany({
      where: { schoolId, status: 'active' },
      include: {
        class: { select: { name: true } },
        attendance: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        examResults: {
          include: { exam: { select: { name: true, totalMarks: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    }),
    db.attendance.groupBy({
      by: ['studentId'],
      where: { schoolId },
      _count: { id: true },
      _sum: {},
    }),
    db.behaviorLog.findMany({
      where: { schoolId },
      orderBy: { date: 'desc' },
      take: 50,
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    }),
    db.examResult.findMany({
      where: {
        exam: { schoolId },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        student: { select: { firstName: true, lastName: true, admissionNo: true } },
        exam: { select: { name: true, totalMarks: true } },
      },
    }),
  ]);

  // Calculate attendance rates per student
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const studentRiskData = await Promise.all(
    students.slice(0, 30).map(async (student) => {
      const totalDays = await db.attendance.count({
        where: { studentId: student.id, date: { gte: thirtyDaysAgo } },
      });
      const presentDays = await db.attendance.count({
        where: {
          studentId: student.id,
          date: { gte: thirtyDaysAgo },
          status: { in: ['present', 'late'] },
        },
      });
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      const avgMarks =
        student.examResults.length > 0
          ? student.examResults.reduce((sum, r) => sum + (r.marksObtained / (r.exam?.totalMarks || 100)) * 100, 0) /
            student.examResults.length
          : null;

      return {
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        class: student.class?.name || 'Unassigned',
        riskLevel: student.riskLevel,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        averageScore: avgMarks !== null ? Math.round(avgMarks * 100) / 100 : null,
        recentResults: student.examResults.slice(0, 5).map((r) => ({
          exam: r.exam?.name,
          marks: r.marksObtained,
          total: r.exam?.totalMarks,
          grade: r.grade,
        })),
      };
    })
  );

  return {
    totalStudents: students.length,
    riskDistribution: {
      high: students.filter((s) => s.riskLevel === 'high').length,
      medium: students.filter((s) => s.riskLevel === 'medium').length,
      low: students.filter((s) => s.riskLevel === 'low').length,
    },
    studentData: studentRiskData,
    recentBehaviorIssues: behaviorLogs
      .filter((b) => b.type === 'negative')
      .slice(0, 10)
      .map((b) => ({
        student: b.student.firstName + ' ' + b.student.lastName,
        description: b.description,
        action: b.action,
        date: b.date,
      })),
  };
}

async function gatherPerformanceData(schoolId: string) {
  const [exams, resultsBySubject, resultsByClass] = await Promise.all([
    db.exam.findMany({
      where: { schoolId },
      include: {
        subject: { select: { name: true, code: true } },
        term: { select: { name: true } },
        results: {
          include: {
            student: { select: { firstName: true, lastName: true, classId: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 20,
    }),
    db.examResult.groupBy({
      by: ['examId'],
      _avg: { marksObtained: true },
      _count: { id: true },
      _min: { marksObtained: true },
      _max: { marksObtained: true },
    }),
    db.student.groupBy({
      by: ['classId'],
      where: { schoolId, status: 'active' },
      _count: { id: true },
    }),
  ]);

  // Subject-wise performance
  const subjectPerformance = await Promise.all(
    (
      await db.subject.findMany({ where: { schoolId } })
    ).map(async (subject) => {
      const subjectExams = await db.exam.findMany({
        where: { schoolId, subjectId: subject.id },
        include: { results: true },
      });

      const allMarks = subjectExams.flatMap((e) => e.results.map((r) => r.marksObtained));
      const avg = allMarks.length > 0 ? allMarks.reduce((a, b) => a + b, 0) / allMarks.length : 0;

      return {
        subject: subject.name,
        code: subject.code,
        examCount: subjectExams.length,
        averageMarks: Math.round(avg * 100) / 100,
        totalResults: allMarks.length,
      };
    })
  );

  return {
    examCount: exams.length,
    recentExams: exams.slice(0, 10).map((e) => ({
      name: e.name,
      subject: e.subject.name,
      term: e.term.name,
      date: e.date,
      totalMarks: e.totalMarks,
      passingMarks: e.passingMarks,
      resultCount: e.results.length,
      averageMarks:
        e.results.length > 0
          ? Math.round(
              (e.results.reduce((sum, r) => sum + r.marksObtained, 0) / e.results.length) * 100
            ) / 100
          : 0,
      passRate:
        e.results.length > 0
          ? Math.round(
              (e.results.filter((r) => r.marksObtained >= e.passingMarks).length /
                e.results.length) *
                10000
            ) / 100
          : 0,
    })),
    subjectPerformance,
    classDistribution: resultsByClass,
  };
}

async function gatherAdminReportData(schoolId: string) {
  const school = await db.school.findUnique({ where: { id: schoolId } });
  if (!school) return null;

  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    feeData,
    attendanceData,
    riskData,
  ] = await Promise.all([
    db.student.count({ where: { schoolId, status: 'active' } }),
    db.teacher.count({ where: { schoolId, status: 'active' } }),
    db.class.count({ where: { schoolId } }),
    db.feePayment.aggregate({
      where: { schoolId },
      _sum: { amount: true, paidAmount: true },
      _count: true,
    }),
    db.attendance.groupBy({
      by: ['status'],
      where: { schoolId },
      _count: { status: true },
    }),
    db.student.groupBy({
      by: ['riskLevel'],
      where: { schoolId, status: 'active' },
      _count: { riskLevel: true },
    }),
  ]);

  const totalAmount = feeData._sum.amount || 0;
  const totalPaid = feeData._sum.paidAmount || 0;

  // Fee breakdown by status
  const feeBreakdown = await db.feePayment.groupBy({
    by: ['status'],
    where: { schoolId },
    _count: { status: true },
    _sum: { amount: true },
  });

  // Gender distribution
  const genderData = await db.student.groupBy({
    by: ['gender'],
    where: { schoolId, status: 'active' },
    _count: { gender: true },
  });

  return {
    school: {
      name: school.name,
      code: school.code,
      plan: school.plan,
      maxStudents: school.maxStudents,
    },
    overview: {
      totalStudents,
      totalTeachers,
      totalClasses,
      studentTeacherRatio: totalTeachers > 0 ? Math.round((totalStudents / totalTeachers) * 100) / 100 : 0,
      capacityUtilization: school.maxStudents > 0 ? Math.round((totalStudents / school.maxStudents) * 10000) / 100 : 0,
    },
    finances: {
      totalFees: totalAmount,
      totalCollected: totalPaid,
      totalPending: totalAmount - totalPaid,
      collectionRate: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 10000) / 100 : 0,
      breakdown: feeBreakdown.map((f) => ({
        status: f.status,
        count: f._count.status,
        amount: f._sum.amount || 0,
      })),
    },
    attendance: attendanceData.map((a) => ({
      status: a.status,
      count: a._count.status,
    })),
    riskLevels: riskData.map((r) => ({
      level: r.riskLevel,
      count: r._count.riskLevel,
    })),
    genderDistribution: genderData.map((g) => ({
      gender: g.gender || 'Not Specified',
      count: g._count.gender,
    })),
  };
}

async function gatherTeacherAssistantData(schoolId: string, classId?: string) {
  const whereCondition: Record<string, unknown> = { schoolId, status: 'active' };
  if (classId) {
    whereCondition.classId = classId;
  }

  const [students, subjects, exams] = await Promise.all([
    db.student.findMany({
      where: whereCondition,
      include: {
        class: { select: { name: true } },
        attendance: {
          orderBy: { date: 'desc' },
          take: 20,
        },
        examResults: {
          include: { exam: { select: { name: true, totalMarks: true, subject: { select: { name: true } } } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        behaviorLogs: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    }),
    db.subject.findMany({
      where: { schoolId },
      include: {
        teachers: {
          include: {
            teacher: { select: { firstName: true, lastName: true, specialization: true } },
          },
        },
      },
    }),
    db.exam.findMany({
      where: { schoolId },
      include: {
        subject: { select: { name: true } },
        results: true,
      },
      orderBy: { date: 'desc' },
      take: 10,
    }),
  ]);

  // Analyze class performance by subject
  const subjectAnalysis = subjects.slice(0, 8).map((subject) => {
    const subjectExams = exams.filter((e) => e.subjectId === subject.id);
    const allMarks = subjectExams.flatMap((e) => e.results.map((r) => r.marksObtained));

    return {
      subject: subject.name,
      type: subject.type,
      examCount: subjectExams.length,
      averageMarks: allMarks.length > 0 ? Math.round((allMarks.reduce((a, b) => a + b, 0) / allMarks.length) * 100) / 100 : 0,
      teachers: subject.teachers.map((t) => `${t.teacher.firstName} ${t.teacher.lastName}`),
    };
  });

  return {
    totalStudents: students.length,
    classInfo: classId
      ? students[0]?.class?.name || 'Unknown'
      : 'All Classes',
    students: students.slice(0, 25).map((s) => ({
      name: `${s.firstName} ${s.lastName}`,
      class: s.class?.name || 'Unassigned',
      riskLevel: s.riskLevel,
      attendanceRate:
        s.attendance.length > 0
          ? Math.round(
              (s.attendance.filter((a) => a.status === 'present' || a.status === 'late').length /
                s.attendance.length) *
                10000
            ) / 100
          : 0,
      recentPerformance: s.examResults.slice(0, 5).map((r) => ({
        subject: r.exam?.subject?.name,
        marks: r.marksObtained,
        total: r.exam?.totalMarks,
        grade: r.grade,
      })),
      behaviorNotes: s.behaviorLogs.slice(0, 3).map((b) => ({
        type: b.type,
        description: b.description,
      })),
    })),
    subjectAnalysis,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, schoolId, classId, prompt } = body as {
      type: InsightType;
      schoolId: string;
      classId?: string;
      prompt?: string;
    };

    // Validate type
    const validTypes: InsightType[] = ['student_risk', 'performance', 'admin_report', 'teacher_assistant'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: 'schoolId is required' },
        { status: 400 }
      );
    }

    // Gather relevant data from the database
    let contextData: unknown;
    switch (type) {
      case 'student_risk':
        contextData = await gatherStudentRiskData(schoolId);
        break;
      case 'performance':
        contextData = await gatherPerformanceData(schoolId);
        break;
      case 'admin_report':
        contextData = await gatherAdminReportData(schoolId);
        break;
      case 'teacher_assistant':
        contextData = await gatherTeacherAssistantData(schoolId, classId);
        break;
    }

    if (!contextData) {
      return NextResponse.json(
        { success: false, error: 'Failed to gather data for the specified school' },
        { status: 404 }
      );
    }

    // Use z-ai-web-dev-sdk for AI insights
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const systemPrompt = INSIGHT_SYSTEM_PROMPTS[type];
    const userPrompt = prompt || `Please analyze the following education data and provide detailed insights for ${type.replace(/_/g, ' ')}:\n\n${JSON.stringify(contextData, null, 2)}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    });

    const aiInsight = completion.choices?.[0]?.message?.content || 'No insight generated';

    return NextResponse.json({
      success: true,
      data: {
        type,
        insight: aiInsight,
        dataPoints: contextData,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('AI insights error:', error);
    // If AI SDK fails, return a helpful error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate AI insights',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
