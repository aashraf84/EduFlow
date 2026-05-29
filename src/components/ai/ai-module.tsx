'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  FileText,
  Sparkles,
  Loader2,
  BarChart3,
  Users,
  Target,
  BookOpen,
  ChevronRight,
  Lightbulb,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ── Color palette ───────────────────────────────────────────────
const CHART_COLORS = {
  emerald: '#10b981',
  teal: '#14b8a6',
  orange: '#f59e0b',
  amber: '#fbbf24',
  rose: '#f43f5e',
  red: '#ef4444',
  slate: '#64748b',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
}

const RISK_COLORS: Record<string, string> = {
  low: CHART_COLORS.emerald,
  medium: CHART_COLORS.orange,
  high: CHART_COLORS.rose,
}

// ── Types ───────────────────────────────────────────────────────
type InsightType = 'student_risk' | 'performance' | 'admin_report' | 'teacher_assistant'

interface InsightRecord {
  id: string
  type: InsightType
  insight: string
  generatedAt: string
}

interface DashboardData {
  riskLevelDistribution: { riskLevel: string; count: number }[]
  weakStudents: {
    id: string
    firstName: string
    lastName: string
    admissionNo: string
    averageMarks: number
  }[]
  lowAttendanceStudents: {
    id: string
    firstName: string
    lastName: string
    admissionNo: string
    attendancePercentage: number
  }[]
  performanceTrend: { month: string; averageMarks: number; studentCount: number }[]
  overview: {
    totalStudents: number
    totalTeachers: number
    totalClasses: number
    attendanceRate: number
  }
  fees: {
    collected: number
    pending: number
    total: number
    collectionRate: number
  }
}

// ── Animation variants ──────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
}

// ── Skeleton ────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-52 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ── Quick Action Card ───────────────────────────────────────────
function QuickActionCard({
  title,
  description,
  icon: Icon,
  iconBg,
  iconColor,
  type,
  onAction,
  isLoading,
}: {
  title: string
  description: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  type: InsightType
  onAction: (type: InsightType) => void
  isLoading: boolean
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card
        className="cursor-pointer hover:shadow-md transition-all duration-300 group"
        onClick={() => !isLoading && onAction(type)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} transition-transform group-hover:scale-110 shrink-0`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-all group-hover:translate-x-0.5 shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Main Component ──────────────────────────────────────────────
export function AiModule() {
  const { user } = useAppStore()
  const schoolId = user?.schoolId || ''

  const [previousInsights, setPreviousInsights] = useState<InsightRecord[]>([])
  const [currentInsight, setCurrentInsight] = useState<InsightRecord | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Fetch dashboard data for risk/performance sections
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard', schoolId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard${schoolId ? `?schoolId=${schoolId}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch data')
      const json = await res.json()
      return json.data
    },
    staleTime: 60_000,
  })

  // AI insight mutation
  const aiMutation = useMutation({
    mutationFn: async (type: InsightType) => {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, schoolId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate insight')
      }
      return res.json()
    },
    onSuccess: (response) => {
      const record: InsightRecord = {
        id: Date.now().toString(),
        type: response.data.type,
        insight: response.data.insight,
        generatedAt: response.data.generatedAt,
      }
      setCurrentInsight(record)
      setPreviousInsights(prev => [record, ...prev])
      setIsAnalyzing(false)
      toast.success('AI insight generated successfully')
    },
    onError: (err: Error) => {
      setIsAnalyzing(false)
      toast.error(err.message || 'Failed to generate AI insight')
    },
  })

  function handleInsightAction(type: InsightType) {
    setIsAnalyzing(true)
    setCurrentInsight(null)
    aiMutation.mutate(type)
  }

  // Risk chart data
  const riskChartData = (dashboardData?.riskLevelDistribution || []).map(r => ({
    name: r.riskLevel ? r.riskLevel.charAt(0).toUpperCase() + r.riskLevel.slice(1) : 'Unknown',
    value: r.count,
    color: RISK_COLORS[r.riskLevel] || CHART_COLORS.slate,
  }))

  // Top at-risk students
  const atRiskStudents = (() => {
    const weak = (dashboardData?.weakStudents || []).map(s => ({
      ...s,
      reason: `Low academic performance (avg: ${s.averageMarks}%)`,
      riskLevel: 'high' as const,
    }))
    const lowAttend = (dashboardData?.lowAttendanceStudents || []).map(s => ({
      ...s,
      reason: `Low attendance (${s.attendancePercentage}%)`,
      riskLevel: 'medium' as const,
      averageMarks: 0,
    }))
    return [...weak, ...lowAttend].slice(0, 8)
  })()

  // Performance trend data
  const performanceChartData = (dashboardData?.performanceTrend || []).map(p => ({
    month: p.month,
    average: p.averageMarks,
    students: p.studentCount,
  }))

  // Subject comparison (mock data based on dashboard)
  const subjectComparisonData = [
    { subject: 'Mathematics', avgScore: 72, passRate: 85 },
    { subject: 'Science', avgScore: 68, passRate: 78 },
    { subject: 'English', avgScore: 76, passRate: 90 },
    { subject: 'History', avgScore: 71, passRate: 82 },
    { subject: 'Geography', avgScore: 74, passRate: 87 },
  ]

  // Grade distribution prediction
  const gradeDistributionData = [
    { grade: 'A (90-100)', count: 15, color: CHART_COLORS.emerald },
    { grade: 'B (75-89)', count: 30, color: CHART_COLORS.teal },
    { grade: 'C (55-74)', count: 25, color: CHART_COLORS.amber },
    { grade: 'D (40-54)', count: 18, color: CHART_COLORS.orange },
    { grade: 'F (<40)', count: 12, color: CHART_COLORS.rose },
  ]

  // Insight type labels
  const INSIGHT_LABELS: Record<InsightType, string> = {
    student_risk: 'Student Risk Analysis',
    performance: 'Performance Insights',
    admin_report: 'Admin Report',
    teacher_assistant: 'Teacher Assistant',
  }

  const INSIGHT_ICONS: Record<InsightType, React.ElementType> = {
    student_risk: AlertTriangle,
    performance: TrendingUp,
    admin_report: FileText,
    teacher_assistant: BookOpen,
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div animate={pulseAnimation}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30">
              <Brain className="h-5 w-5 text-white" />
            </div>
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-foreground">AI Education Intelligence</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Harness AI to drive better educational outcomes</p>
          </div>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px]">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Powered
        </Badge>
      </motion.div>

      {/* ── Quick Action Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          title="Student Risk Analysis"
          description="Identify at-risk students with AI-powered risk assessment and intervention recommendations"
          icon={AlertTriangle}
          iconBg="bg-red-50 dark:bg-red-950/30"
          iconColor="text-red-600 dark:text-red-400"
          type="student_risk"
          onAction={handleInsightAction}
          isLoading={isAnalyzing}
        />
        <QuickActionCard
          title="Performance Insights"
          description="Detect trends and patterns in academic performance across subjects and classes"
          icon={TrendingUp}
          iconBg="bg-teal-50 dark:bg-teal-950/30"
          iconColor="text-teal-600 dark:text-teal-400"
          type="performance"
          onAction={handleInsightAction}
          isLoading={isAnalyzing}
        />
        <QuickActionCard
          title="Admin Report"
          description="Auto-generate comprehensive school reports with AI analysis and recommendations"
          icon={FileText}
          iconBg="bg-amber-50 dark:bg-amber-950/30"
          iconColor="text-amber-600 dark:text-amber-400"
          type="admin_report"
          onAction={handleInsightAction}
          isLoading={isAnalyzing}
        />
        <QuickActionCard
          title="Teacher Assistant"
          description="AI-powered lesson planning, differentiation strategies, and resource recommendations"
          icon={BookOpen}
          iconBg="bg-violet-50 dark:bg-violet-950/30"
          iconColor="text-violet-600 dark:text-violet-400"
          type="teacher_assistant"
          onAction={handleInsightAction}
          isLoading={isAnalyzing}
        />
      </div>

      {/* ── AI Chat / Insight Area ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-500" />
              AI Insight Generator
            </CardTitle>
            <CardDescription className="text-xs">Select an insight type above or view previous insights below</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col items-center justify-center py-12 gap-4"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="h-10 w-10 text-emerald-500" />
                    </motion.div>
                    <Brain className="h-5 w-5 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Analyzing school data...</p>
                    <p className="text-xs text-muted-foreground mt-1">AI is processing your school&apos;s data to generate insights</p>
                  </div>
                </motion.div>
              ) : currentInsight ? (
                <motion.div
                  key="insight"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = INSIGHT_ICONS[currentInsight.type]
                      return <Icon className="h-4 w-4 text-emerald-500" />
                    })()}
                    <h4 className="text-sm font-semibold text-foreground">{INSIGHT_LABELS[currentInsight.type]}</h4>
                    <Badge className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      Generated
                    </Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(currentInsight.generatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-4 max-h-72 overflow-y-auto custom-scrollbar">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap">
                      {currentInsight.insight}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => handleInsightAction(currentInsight.type)}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Regenerate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => setCurrentInsight(null)}
                    >
                      Clear
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col items-center justify-center py-8 text-muted-foreground"
                >
                  <Sparkles className="h-10 w-10 opacity-30 mb-3" />
                  <p className="text-sm font-medium">No active insight</p>
                  <p className="text-xs">Click one of the quick action cards above to generate an AI insight</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Previous Insights */}
            {previousInsights.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Previous Insights</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {previousInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setCurrentInsight(insight)}
                    >
                      {(() => {
                        const Icon = INSIGHT_ICONS[insight.type]
                        return <Icon className="h-4 w-4 text-emerald-500 shrink-0" />
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{INSIGHT_LABELS[insight.type]}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(insight.generatedAt).toLocaleString()}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── AI Risk Dashboard & Performance Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Dashboard */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Student Risk Dashboard
              </CardTitle>
              <CardDescription className="text-xs">AI-powered risk assessment overview</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <ChartSkeleton />
              ) : (
                <div className="space-y-4">
                  {/* Risk Distribution Chart */}
                  <div className="h-44">
                    {riskChartData.length > 0 && riskChartData.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={riskChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {riskChartData.map((entry, index) => (
                              <Cell key={`risk-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No risk data available
                      </div>
                    )}
                  </div>

                  {/* Top At-Risk Students */}
                  <div>
                    <h5 className="text-xs font-semibold text-muted-foreground mb-2">Top At-Risk Students</h5>
                    <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar">
                      {atRiskStudents.length > 0 ? (
                        atRiskStudents.map((student, idx) => (
                          <div key={student.id || idx} className="flex items-center gap-2.5 rounded-lg border border-border/50 p-2.5 hover:bg-muted/30 transition-colors">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                              student.riskLevel === 'high'
                                ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{student.reason}</p>
                            </div>
                            <Badge className={`text-[9px] shrink-0 ${
                              student.riskLevel === 'high'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                            }`}>
                              {student.riskLevel}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-xs">
                          <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-400 mb-1" />
                          No at-risk students identified
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  <div>
                    <h5 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Recommended Actions
                    </h5>
                    <div className="space-y-1.5">
                      {atRiskStudents.length > 0 ? (
                        [
                          { text: 'Schedule parent-teacher meetings for high-risk students', icon: Users },
                          { text: 'Assign remedial classes for students below 50% average', icon: Target },
                          { text: 'Implement attendance improvement plans', icon: GraduationCap },
                        ].map((action, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/30">
                            <action.icon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span>{action.text}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No actions needed at this time.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal-500" />
                AI Performance Analysis
              </CardTitle>
              <CardDescription className="text-xs">Subject trends and predicted outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <ChartSkeleton />
              ) : (
                <div className="space-y-4">
                  {/* Subject Performance BarChart */}
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectComparisonData} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="avgScore" name="Avg Score" fill={CHART_COLORS.teal} radius={[3, 3, 0, 0]} maxBarSize={20} />
                        <Bar dataKey="passRate" name="Pass Rate" fill={CHART_COLORS.emerald} radius={[3, 3, 0, 0]} maxBarSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Class Comparison Metrics */}
                  <div>
                    <h5 className="text-xs font-semibold text-muted-foreground mb-2">Class Comparison</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Attendance Rate', value: `${dashboardData?.overview.attendanceRate ?? 0}%`, trend: (dashboardData?.overview.attendanceRate ?? 0) >= 80 ? 'up' : 'down' },
                        { label: 'Total Students', value: dashboardData?.overview.totalStudents ?? 0, trend: 'up' as const },
                        { label: 'Fee Collection', value: `${dashboardData?.fees.collectionRate ?? 0}%`, trend: (dashboardData?.fees.collectionRate ?? 0) >= 80 ? 'up' : 'down' },
                        { label: 'Total Classes', value: dashboardData?.overview.totalClasses ?? 0, trend: 'up' as const },
                      ].map((metric, idx) => (
                        <div key={idx} className="rounded-lg border border-border/50 p-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">{metric.label}</span>
                            {metric.trend === 'up' ? (
                              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm font-bold text-foreground mt-0.5">{metric.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Predicted Grade Distribution */}
                  <div>
                    <h5 className="text-xs font-semibold text-muted-foreground mb-2">Predicted Grade Distribution</h5>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={gradeDistributionData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2} dataKey="count" nameKey="grade" stroke="none">
                            {gradeDistributionData.map((entry, index) => (
                              <Cell key={`grade-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}


