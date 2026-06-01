import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');
    const schoolId = searchParams.get('schoolId');

    // Handle OWNER or missing schoolCode gracefully — return empty dashboard
    if (!schoolCode || schoolCode.toUpperCase() === 'OWNER') {
      return NextResponse.json({
        success: true,
        data: {
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
        },
      });
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

    // Run all queries in parallel for performance
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
      lowAttendanceStudents,
      unpaidFees,
      weakStudents,
    ] = await Promise.all([
      // Total students
      tenantDb.student.count({
        where: { schoolId: targetSchoolId, status: 'active' },
      }),

      // Total teachers
      tenantDb.teacher.count({
        where: { schoolId: targetSchoolId, status: 'active' },
      }),

      // Total classes
      tenantDb.class.count({
        where: { schoolId: targetSchoolId },
      }),

      // Total subjects
      tenantDb.subject.count({
        where: { schoolId: targetSchoolId },
      }),

      // Today's attendance
      (async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [present, absent, late, excused, total] = await Promise.all([
          tenantDb.attendance.count({
            where: {
              schoolId: targetSchoolId,
              date: { gte: today, lt: tomorrow },
              status: 'present',
            },
          }),
          tenantDb.attendance.count({
            where: {
              schoolId: targetSchoolId,
              date: { gte: today, lt: tomorrow },
              status: 'absent',
            },
          }),
          tenantDb.attendance.count({
            where: {
              schoolId: targetSchoolId,
              date: { gte: today, lt: tomorrow },
              status: 'late',
            },
          }),
          tenantDb.attendance.count({
            where: {
              schoolId: targetSchoolId,
              date: { gte: today, lt: tomorrow },
              status: 'excused',
            },
          }),
          tenantDb.attendance.count({
            where: {
              schoolId: targetSchoolId,
              date: { gte: today, lt: tomorrow },
            },
          }),
        ]);

        return { present, absent, late, excused, total };
      })(),

      // Fee collection status
      (async () => {
        const [paid, pending, overdue, partial, totalAmount, totalPaid] = await Promise.all([
          tenantDb.feePayment.count({
            where: { schoolId: targetSchoolId, status: 'paid' },
          }),
          tenantDb.feePayment.count({
            where: { schoolId: targetSchoolId, status: 'pending' },
          }),
          tenantDb.feePayment.count({
            where: { schoolId: targetSchoolId, status: 'overdue' },
          }),
          tenantDb.feePayment.count({
            where: { schoolId: targetSchoolId, status: 'partial' },
          }),
          tenantDb.feePayment.aggregate({
            where: { schoolId: targetSchoolId },
            _sum: { amount: true },
          }),
          tenantDb.feePayment.aggregate({
            where: { schoolId: targetSchoolId },
            _sum: { paidAmount: true },
          }),
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
      })(),

      // Gender distribution
      tenantDb.student.groupBy({
        by: ['gender'],
        where: { schoolId: targetSchoolId, status: 'active' },
        _count: { gender: true },
      }),

      // Risk level distribution
      tenantDb.student.groupBy({
        by: ['riskLevel'],
        where: { schoolId: targetSchoolId, status: 'active' },
        _count: { riskLevel: true },
      }),

      // Recent announcements
      tenantDb.announcement.findMany({
        where: { schoolId: targetSchoolId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Recent exam results for performance trend
      tenantDb.examResult.findMany({
        where: {
          exam: { schoolId: targetSchoolId },
        },
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

      // Low attendance students (below 75% in last 30 days)
      (async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendanceByStudent = await tenantDb.attendance.groupBy({
          by: ['studentId'],
          where: {
            schoolId: targetSchoolId,
            date: { gte: thirtyDaysAgo },
          },
          _count: { id: true },
        });

        const lowAttendanceList = [];
        for (const record of attendanceByStudent) {
          const totalDays = record._count.id;
          const presentDays = await tenantDb.attendance.count({
            where: {
              schoolId: targetSchoolId,
              studentId: record.studentId,
              date: { gte: thirtyDaysAgo },
              status: { in: ['present', 'late'] },
            },
          });

          const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
          if (percentage < 75) {
            const student = await tenantDb.student.findUnique({
              where: { id: record.studentId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNo: true,
                class: { select: { name: true } },
              },
            });
            if (student) {
              lowAttendanceList.push({
                ...student,
                attendancePercentage: Math.round(percentage * 100) / 100,
              });
            }
          }
        }

        return lowAttendanceList.slice(0, 10);
      })(),

      // Unpaid/overdue fees
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

      // Weak students (average marks below 50%)
      (async () => {
        const resultsByStudent = await tenantDb.examResult.groupBy({
          by: ['studentId'],
          _avg: { marksObtained: true },
          _count: { id: true },
          having: {
            marksObtained: { _avg: { lt: 50 } },
          },
        });

        const weakStudentList = [];
        for (const record of resultsByStudent.slice(0, 10)) {
          const student = await tenantDb.student.findUnique({
            where: { id: record.studentId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
              class: { select: { name: true } },
            },
          });
          if (student) {
            weakStudentList.push({
              ...student,
              averageMarks: Math.round((record._avg.marksObtained || 0) * 100) / 100,
            });
          }
        }

        return weakStudentList;
      })(),
    ]);

    // Compute performance trend data (monthly averages)
    const performanceTrend: { month: string; averageMarks: number; studentCount: number }[] = [];
    const resultsByMonth = new Map<string, { total: number; count: number }>();

    for (const result of recentExamResults) {
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
    const genderData = genderDistribution.map((g) => ({
      gender: g.gender || 'Not Specified',
      count: g._count.gender,
    }));

    // Format risk level distribution
    const riskData = riskLevelDistribution.map((r) => ({
      riskLevel: r.riskLevel,
      count: r._count.riskLevel,
    }));

    // Build alerts
    const alerts: { type: string; severity: string; message: string; count: number }[] = [];

    if (lowAttendanceStudents.length > 0) {
      alerts.push({
        type: 'attendance',
        severity: 'warning',
        message: `${lowAttendanceStudents.length} student(s) have attendance below 75%`,
        count: lowAttendanceStudents.length,
      });
    }

    if (unpaidFees.length > 0) {
      const overdueCount = unpaidFees.filter((f) => f.status === 'overdue').length;
      alerts.push({
        type: 'fees',
        severity: overdueCount > 5 ? 'critical' : 'warning',
        message: `${unpaidFees.length} pending fee payment(s), ${overdueCount} overdue`,
        count: unpaidFees.length,
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
    const attendanceRate =
      todayAttendance.total > 0
        ? Math.round(
            ((todayAttendance.present + todayAttendance.late) / todayAttendance.total) * 10000
          ) / 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalTeachers,
          totalClasses,
          totalSubjects,
          attendanceRate,
        },
        attendance: {
          today: todayAttendance,
          rate: attendanceRate,
        },
        fees: {
          collected: feePayments.totalPaid,
          pending: feePayments.totalPending,
          total: feePayments.totalAmount,
          breakdown: {
            paid: feePayments.paid,
            pending: feePayments.pending,
            overdue: feePayments.overdue,
            partial: feePayments.partial,
          },
          collectionRate:
            feePayments.totalAmount > 0
              ? Math.round((feePayments.totalPaid / feePayments.totalAmount) * 10000) / 100
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
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
