import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';

// Empty dashboard data shape for fallback / OWNER users
const emptyDashboardData = {
  overview: { totalStudents: 0, totalTeachers: 0, totalClasses: 0, totalSubjects: 0, attendanceRate: 0 },
  attendance: { today: { present: 0, absent: 0, late: 0, excused: 0, total: 0 }, rate: 0 },
  fees: { collected: 0, pending: 0, total: 0, breakdown: { paid: 0, pending: 0, overdue: 0, partial: 0 }, collectionRate: 0 },
  genderDistribution: [],
  riskLevelDistribution: [],
  recentAnnouncements: [],
  performanceTrend: [],
  alerts: [],
  lowAttendanceStudents: [],
  unpaidFees: [],
  weakStudents: [],
};

/**
 * Wraps a promise with a timeout. Returns `fallback` if the promise
 * does not settle within `ms` milliseconds.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timer = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timer]).catch(() => fallback);
}

/**
 * Safely executes an async operation, returning `fallback` on any error.
 * This enables partial-data responses instead of total failure.
 */
function safeQuery<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return promise.catch((err) => {
    console.error('Dashboard partial query failed:', err);
    return fallback;
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');
    const schoolId = searchParams.get('schoolId');

    // Handle OWNER or missing schoolCode gracefully — return empty dashboard
    if (!schoolCode || schoolCode.toUpperCase() === 'OWNER') {
      return NextResponse.json({ success: true, data: emptyDashboardData });
    }

    const tenantDb = await getTenantDbByCode(schoolCode);
    if (!tenantDb) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get first school if no schoolId provided
    let targetSchoolId = schoolId;
    if (!targetSchoolId) {
      const firstSchool = await tenantDb.school.findFirst();
      if (!firstSchool) {
        return NextResponse.json(
          { success: false, error: 'No school found' },
          { status: 404 }
        );
      }
      targetSchoolId = firstSchool.id;
    }

    // -------------------------------------------------------------------
    // Fetch all dashboard data with a 10-second overall timeout.
    // If any individual query fails it returns its fallback value so the
    // dashboard can still render partial data.
    // -------------------------------------------------------------------
    const dashboardData = await withTimeout(
      fetchDashboardData(tenantDb, targetSchoolId),
      10_000,
      emptyDashboardData
    );

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------
// Main data-fetching function – each section is wrapped in safeQuery so
// that a single failure does not break the entire response.
// -----------------------------------------------------------------------
async function fetchDashboardData(tenantDb: ReturnType<typeof getTenantDbByCode> extends Promise<infer T> ? NonNullable<T> : never, targetSchoolId: string) {
  // Run all independent queries in parallel, each protected by safeQuery
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    todayAttendance,
    feePayments,
    genderDistribution,
    riskLevelDistribution,
    recentAnnouncements,
    recentExamResults,
    unpaidFees,
    lowAttendanceRaw,
    weakStudentIds,
  ] = await Promise.all([
    // Total students
    safeQuery(
      tenantDb.student.count({ where: { schoolId: targetSchoolId, status: 'active' } }),
      0
    ),

    // Total teachers
    safeQuery(
      tenantDb.teacher.count({ where: { schoolId: targetSchoolId, status: 'active' } }),
      0
    ),

    // Total classes
    safeQuery(
      tenantDb.class.count({ where: { schoolId: targetSchoolId } }),
      0
    ),

    // Total subjects
    safeQuery(
      tenantDb.subject.count({ where: { schoolId: targetSchoolId } }),
      0
    ),

    // Today's attendance
    safeQuery(fetchTodayAttendance(tenantDb, targetSchoolId), {
      present: 0, absent: 0, late: 0, excused: 0, total: 0,
    }),

    // Fee collection status
    safeQuery(fetchFeePayments(tenantDb, targetSchoolId), {
      paid: 0, pending: 0, overdue: 0, partial: 0,
      totalAmount: 0, totalPaid: 0, totalPending: 0,
    }),

    // Gender distribution
    safeQuery(
      tenantDb.student.groupBy({
        by: ['gender'],
        where: { schoolId: targetSchoolId, status: 'active' },
        _count: { gender: true },
      }),
      [] as { gender: string | null; _count: { gender: number } }[]
    ),

    // Risk level distribution
    safeQuery(
      tenantDb.student.groupBy({
        by: ['riskLevel'],
        where: { schoolId: targetSchoolId, status: 'active' },
        _count: { riskLevel: true },
      }),
      [] as { riskLevel: string | null; _count: { riskLevel: number } }[]
    ),

    // Recent announcements
    safeQuery(
      tenantDb.announcement.findMany({
        where: { schoolId: targetSchoolId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      []
    ),

    // Recent exam results for performance trend
    safeQuery(
      tenantDb.examResult.findMany({
        where: { exam: { schoolId: targetSchoolId } },
        include: {
          exam: {
            select: {
              name: true,
              date: true,
              subject: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      []
    ),

    // Unpaid/overdue fees
    safeQuery(
      tenantDb.feePayment.findMany({
        where: {
          schoolId: targetSchoolId,
          status: { in: ['pending', 'overdue'] },
        },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              admissionNo: true,
              class: { select: { name: true } },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      []
    ),

    // ---- FIXED: Low attendance — batch queries, no N+1 ----
    safeQuery(fetchLowAttendance(tenantDb, targetSchoolId), []),

    // ---- FIXED: Weak students — batch queries, no N+1 ----
    safeQuery(fetchWeakStudents(tenantDb, targetSchoolId), []),
  ]);

  // Compute performance trend data (monthly averages)
  const performanceTrend: { month: string; averageMarks: number; studentCount: number }[] = [];
  const resultsByMonth = new Map<string, { total: number; count: number }>();

  for (const result of recentExamResults as { exam: { date: Date }; marksObtained: number }[]) {
    const date = new Date(result.exam.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = resultsByMonth.get(monthKey) || { total: 0, count: 0 };
    existing.total += result.marksObtained;
    existing.count += 1;
    resultsByMonth.set(monthKey, existing);
  }

  for (const [month, data] of Array.from(resultsByMonth.entries()).sort()) {
    performanceTrend.push({
      month,
      averageMarks: Math.round((data.total / data.count) * 100) / 100,
      studentCount: data.count,
    });
  }

  // Format gender distribution
  const genderData = (genderDistribution as { gender: string | null; _count: { gender: number } }[]).map((g) => ({
    gender: g.gender || 'Not Specified',
    count: g._count.gender,
  }));

  // Format risk level distribution
  const riskData = (riskLevelDistribution as { riskLevel: string | null; _count: { riskLevel: number } }[]).map((r) => ({
    riskLevel: r.riskLevel,
    count: r._count.riskLevel,
  }));

  // Build alerts
  const alerts: { type: string; severity: string; message: string; count: number }[] = [];

  const lowAttendanceStudents = lowAttendanceRaw;
  const weakStudents = weakStudentIds;

  if (lowAttendanceStudents.length > 0) {
    alerts.push({
      type: 'attendance',
      severity: 'warning',
      message: `${lowAttendanceStudents.length} student(s) have attendance below 75%`,
      count: lowAttendanceStudents.length,
    });
  }

  if ((unpaidFees as { status: string }[]).length > 0) {
    const overdueCount = (unpaidFees as { status: string }[]).filter((f) => f.status === 'overdue').length;
    alerts.push({
      type: 'fees',
      severity: overdueCount > 5 ? 'critical' : 'warning',
      message: `${(unpaidFees as unknown[]).length} pending fee payment(s), ${overdueCount} overdue`,
      count: (unpaidFees as unknown[]).length,
    });
  }

  if (weakStudents.length > 0) {
    alerts.push({
      type: 'performance',
      severity: 'warning',
      message: `${weakStudents.length} student(s) with average marks below 50%`,
      count: weakStudents.length,
    });
  }

  // Attendance rate calculation
  const todayAtt = todayAttendance as { present: number; absent: number; late: number; excused: number; total: number };
  const attendanceRate =
    todayAtt.total > 0
      ? Math.round(((todayAtt.present + todayAtt.late) / todayAtt.total) * 10000) / 100
      : 0;

  // Fee calculations
  const fees = feePayments as { paid: number; pending: number; overdue: number; partial: number; totalAmount: number; totalPaid: number; totalPending: number };

  return {
    overview: {
      totalStudents: totalStudents as number,
      totalTeachers: totalTeachers as number,
      totalClasses: totalClasses as number,
      totalSubjects: totalSubjects as number,
      attendanceRate,
    },
    attendance: {
      today: todayAtt,
      rate: attendanceRate,
    },
    fees: {
      collected: fees.totalPaid,
      pending: fees.totalPending,
      total: fees.totalAmount,
      breakdown: {
        paid: fees.paid,
        pending: fees.pending,
        overdue: fees.overdue,
        partial: fees.partial,
      },
      collectionRate:
        fees.totalAmount > 0
          ? Math.round((fees.totalPaid / fees.totalAmount) * 10000) / 100
          : 0,
    },
    genderDistribution: genderData,
    riskLevelDistribution: riskData,
    recentAnnouncements,
    performanceTrend,
    alerts,
    lowAttendanceStudents,
    unpaidFees,
    weakStudents,
  };
}

// -----------------------------------------------------------------------
// Today's attendance — 5 count queries in parallel
// -----------------------------------------------------------------------
async function fetchTodayAttendance(db: NonNullable<Awaited<ReturnType<typeof getTenantDbByCode>>>, schoolId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateFilter = { gte: today, lt: tomorrow };

  const [present, absent, late, excused, total] = await Promise.all([
    db.attendance.count({ where: { schoolId, date: dateFilter, status: 'present' } }),
    db.attendance.count({ where: { schoolId, date: dateFilter, status: 'absent' } }),
    db.attendance.count({ where: { schoolId, date: dateFilter, status: 'late' } }),
    db.attendance.count({ where: { schoolId, date: dateFilter, status: 'excused' } }),
    db.attendance.count({ where: { schoolId, date: dateFilter } }),
  ]);

  return { present, absent, late, excused, total };
}

// -----------------------------------------------------------------------
// Fee payments — aggregate in parallel
// -----------------------------------------------------------------------
async function fetchFeePayments(db: NonNullable<Awaited<ReturnType<typeof getTenantDbByCode>>>, schoolId: string) {
  const [paid, pending, overdue, partial, totalAmount, totalPaid] = await Promise.all([
    db.feePayment.count({ where: { schoolId, status: 'paid' } }),
    db.feePayment.count({ where: { schoolId, status: 'pending' } }),
    db.feePayment.count({ where: { schoolId, status: 'overdue' } }),
    db.feePayment.count({ where: { schoolId, status: 'partial' } }),
    db.feePayment.aggregate({ where: { schoolId }, _sum: { amount: true } }),
    db.feePayment.aggregate({ where: { schoolId }, _sum: { paidAmount: true } }),
  ]);

  return {
    paid,
    pending,
    overdue,
    partial,
    totalAmount: totalAmount._sum.amount || 0,
    totalPaid: totalPaid._sum.paidAmount || 0,
    totalPending: (totalAmount._sum.amount || 0) - (totalPaid._sum.paidAmount || 0),
  };
}

// -----------------------------------------------------------------------
// FIXED: Low attendance students — NO N+1 queries
//
// Strategy:
//   1. Two groupBy queries in parallel: total records per student,
//      present+late records per student (last 30 days).
//   2. Calculate percentages in JavaScript.
//   3. Batch-fetch student details with a single findMany using
//      `where: { id: { in: [...] } }` with include.
//   4. Merge and return top 10.
//
// Query count: 2 (groupBy) + 1 (findMany) = 3  (was 1 + N + M)
// -----------------------------------------------------------------------
async function fetchLowAttendance(
  db: NonNullable<Awaited<ReturnType<typeof getTenantDbByCode>>>,
  schoolId: string
) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Two parallel groupBy queries
  const [totalByStudent, presentByStudent] = await Promise.all([
    db.attendance.groupBy({
      by: ['studentId'],
      where: { schoolId, date: { gte: thirtyDaysAgo } },
      _count: { id: true },
    }),
    db.attendance.groupBy({
      by: ['studentId'],
      where: {
        schoolId,
        date: { gte: thirtyDaysAgo },
        status: { in: ['present', 'late'] },
      },
      _count: { id: true },
    }),
  ]);

  // 2. Build lookup maps for O(1) access
  const totalMap = new Map<string, number>();
  for (const r of totalByStudent) {
    totalMap.set(r.studentId, r._count.id);
  }
  const presentMap = new Map<string, number>();
  for (const r of presentByStudent) {
    presentMap.set(r.studentId, r._count.id);
  }

  // 3. Calculate percentages and filter below 75%
  const lowAttendanceIds: { studentId: string; percentage: number }[] = [];
  for (const [studentId, totalDays] of totalMap) {
    const presentDays = presentMap.get(studentId) || 0;
    const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    if (percentage < 75) {
      lowAttendanceIds.push({ studentId, percentage });
    }
  }

  if (lowAttendanceIds.length === 0) return [];

  // Sort by percentage ascending (worst first) and take top 10
  lowAttendanceIds.sort((a, b) => a.percentage - b.percentage);
  const topIds = lowAttendanceIds.slice(0, 10);

  // 4. Single batch query for student details
  const students = await db.student.findMany({
    where: {
      id: { in: topIds.map((s) => s.studentId) },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNo: true,
      class: { select: { name: true } },
    },
  });

  // 5. Merge details with percentages
  const studentMap = new Map(students.map((s) => [s.id, s]));
  return topIds
    .map(({ studentId, percentage }) => {
      const student = studentMap.get(studentId);
      if (!student) return null;
      return {
        ...student,
        attendancePercentage: Math.round(percentage * 100) / 100,
      };
    })
    .filter(Boolean);
}

// -----------------------------------------------------------------------
// FIXED: Weak students — NO N+1 queries
//
// Strategy:
//   1. Single groupBy to get average marks per student with having < 50.
//   2. Batch-fetch student details with a single findMany using
//      `where: { id: { in: [...] } }` with include.
//   3. Merge and return.
//
// Query count: 1 (groupBy) + 1 (findMany) = 2  (was 1 + N)
// -----------------------------------------------------------------------
async function fetchWeakStudents(
  db: NonNullable<Awaited<ReturnType<typeof getTenantDbByCode>>>,
  schoolId: string
) {
  // 1. Group by student, filter to those with average < 50
  const resultsByStudent = await db.examResult.groupBy({
    by: ['studentId'],
    _avg: { marksObtained: true },
    _count: { id: true },
    having: {
      marksObtained: { _avg: { lt: 50 } },
    },
  });

  if (resultsByStudent.length === 0) return [];

  // Take only first 10
  const topWeak = resultsByStudent.slice(0, 10);

  // 2. Single batch query for student details
  const students = await db.student.findMany({
    where: {
      id: { in: topWeak.map((r) => r.studentId) },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNo: true,
      class: { select: { name: true } },
    },
  });

  // 3. Merge details with average marks
  const studentMap = new Map(students.map((s) => [s.id, s]));
  return topWeak
    .map((record) => {
      const student = studentMap.get(record.studentId);
      if (!student) return null;
      return {
        ...student,
        averageMarks: Math.round((record._avg.marksObtained || 0) * 100) / 100,
      };
    })
    .filter(Boolean);
}
