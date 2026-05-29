'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ClipboardCheck,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  AlertTriangle,
  BarChart3,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Activity,
  Filter,
  Eye,
  ChevronDown,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'

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

const STATUS_CONFIG: Record<string, { color: string; bg: string; badge: string; label: string }> = {
  present: {
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    label: 'Present',
  },
  absent: {
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    badge: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800',
    label: 'Absent',
  },
  late: {
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    label: 'Late',
  },
  excused: {
    color: 'text-sky-700 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-800',
    label: 'Excused',
  },
}

const BEHAVIOR_TYPE_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  positive: { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', icon: CheckCircle2 },
  negative: { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400', icon: AlertTriangle },
  neutral: { color: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: Eye },
}

// ── Types ───────────────────────────────────────────────────────
interface AttendanceRecord {
  id: string
  studentId: string
  date: string
  status: string
  remarks: string | null
  markedBy: string | null
  student: {
    id: string
    firstName: string
    lastName: string
    admissionNo: string
    class: { id: string; name: string } | null
    section: { id: string; name: string } | null
  }
}

interface AttendanceSummary {
  present: number
  absent: number
  late: number
  excused: number
  total: number
  attendanceRate: number
}

interface AttendanceData {
  records: AttendanceRecord[]
  summary: AttendanceSummary
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface BehaviorLogEntry {
  id: string
  studentId: string
  type: string
  category: string | null
  description: string
  action: string | null
  reportedBy: string | null
  date: string
  student: {
    id: string
    firstName: string
    lastName: string
    admissionNo: string
  }
}

// ── Animation variants ──────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

// ── Skeleton loaders ────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ── Stat Card ───────────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  iconBg,
  iconColor,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  iconBg: string
  iconColor: string
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </p>
              <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
              {trendLabel && (
                <div className="flex items-center gap-1">
                  {trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                  {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                  <span
                    className={`text-xs font-medium ${
                      trend === 'up'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : trend === 'down'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {trendLabel}
                  </span>
                </div>
              )}
              {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} transition-transform group-hover:scale-110`}
            >
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Mock data generators for analytics ──────────────────────────
function generateTrendData(summary: AttendanceSummary) {
  const today = new Date()
  const data: { date: string; rate: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const label = format(d, 'MMM dd')
    const base = summary.attendanceRate || 77.5
    const variation = (Math.random() - 0.5) * 15
    const rate = Math.max(50, Math.min(100, Math.round((base + variation) * 10) / 10))
    data.push({ date: label, rate })
  }
  return data
}

function generateClassComparison() {
  const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8']
  return classes.map((name) => ({
    name,
    rate: Math.round(65 + Math.random() * 30),
  }))
}

function generateDayOfWeekData() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days.map((day) => ({
    day,
    rate: Math.round(70 + Math.random() * 25),
  }))
}

// ── Mock teacher attendance data ────────────────────────────────
function generateTeacherAttendance() {
  const teachers = [
    { id: 't1', name: 'Dr. Sarah Johnson', employeeId: 'EMP001', status: 'present', checkIn: '08:15', checkOut: '16:30', remarks: '' },
    { id: 't2', name: 'Prof. Michael Chen', employeeId: 'EMP002', status: 'present', checkIn: '08:00', checkOut: '16:45', remarks: '' },
    { id: 't3', name: 'Ms. Emily Davis', employeeId: 'EMP003', status: 'late', checkIn: '09:20', checkOut: '16:30', remarks: 'Traffic delay' },
    { id: 't4', name: 'Mr. Robert Wilson', employeeId: 'EMP004', status: 'present', checkIn: '07:50', checkOut: '16:00', remarks: '' },
    { id: 't5', name: 'Dr. Lisa Anderson', employeeId: 'EMP005', status: 'absent', checkIn: '', checkOut: '', remarks: 'Sick leave' },
    { id: 't6', name: 'Mr. James Brown', employeeId: 'EMP006', status: 'present', checkIn: '08:10', checkOut: '17:00', remarks: '' },
    { id: 't7', name: 'Ms. Patricia Taylor', employeeId: 'EMP007', status: 'present', checkIn: '08:05', checkOut: '16:20', remarks: '' },
    { id: 't8', name: 'Dr. David Martinez', employeeId: 'EMP008', status: 'excused', checkIn: '', checkOut: '', remarks: 'Personal leave' },
  ]
  return teachers
}

// ── Mock behavior logs ──────────────────────────────────────────
function generateBehaviorLogs(): BehaviorLogEntry[] {
  return [
    {
      id: 'bl1',
      studentId: 's1',
      type: 'positive',
      category: 'Academic',
      description: 'Outstanding performance in science quiz',
      action: 'Certificate awarded',
      reportedBy: 'Dr. Sarah Johnson',
      date: new Date(Date.now() - 86400000).toISOString(),
      student: { id: 's1', firstName: 'Aarav', lastName: 'Sharma', admissionNo: 'ADM001' },
    },
    {
      id: 'bl2',
      studentId: 's2',
      type: 'negative',
      category: 'Discipline',
      description: 'Disrupting class during lecture',
      action: 'Verbal warning issued',
      reportedBy: 'Mr. Robert Wilson',
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      student: { id: 's2', firstName: 'Priya', lastName: 'Patel', admissionNo: 'ADM002' },
    },
    {
      id: 'bl3',
      studentId: 's3',
      type: 'positive',
      category: 'Leadership',
      description: 'Led the group project effectively',
      action: 'Appreciation note',
      reportedBy: 'Ms. Emily Davis',
      date: new Date(Date.now() - 3 * 86400000).toISOString(),
      student: { id: 's3', firstName: 'Arjun', lastName: 'Kumar', admissionNo: 'ADM003' },
    },
    {
      id: 'bl4',
      studentId: 's4',
      type: 'negative',
      category: 'Attendance',
      description: 'Consistently arriving late to school',
      action: 'Parent meeting scheduled',
      reportedBy: 'Dr. Lisa Anderson',
      date: new Date(Date.now() - 4 * 86400000).toISOString(),
      student: { id: 's4', firstName: 'Neha', lastName: 'Singh', admissionNo: 'ADM004' },
    },
    {
      id: 'bl5',
      studentId: 's5',
      type: 'neutral',
      category: 'General',
      description: 'Requested transfer to section B',
      action: 'Under review',
      reportedBy: 'Mr. James Brown',
      date: new Date(Date.now() - 5 * 86400000).toISOString(),
      student: { id: 's5', firstName: 'Vikram', lastName: 'Reddy', admissionNo: 'ADM005' },
    },
  ]
}

// ── Main Component ──────────────────────────────────────────────
export function AttendanceModule() {
  const { user } = useAppStore()
  const schoolId = user?.schoolId || ''
  const queryClient = useQueryClient()

  // ── State ──
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('student')
  const [attendanceEdits, setAttendanceEdits] = useState<Record<string, { status: string; remarks: string }>>({})
  const [teacherEdits, setTeacherEdits] = useState<Record<string, { status: string; checkIn: string; checkOut: string; remarks: string }>>({})
  const [behaviorDialogOpen, setBehaviorDialogOpen] = useState(false)
  const [behaviorForm, setBehaviorForm] = useState({
    studentId: '',
    type: 'positive',
    category: '',
    description: '',
    action: '',
  })

  // ── Fetch attendance data ──
  const { data, isLoading, isError, error } = useQuery<AttendanceData>({
    queryKey: ['attendance', schoolId, selectedDate, selectedClass],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (schoolId) params.set('schoolId', schoolId)
      if (selectedDate) params.set('date', selectedDate)
      if (selectedClass && selectedClass !== 'all') params.set('classId', selectedClass)
      params.set('limit', '50')
      const res = await fetch(`/api/attendance?${params}`)
      if (!res.ok) throw new Error('Failed to fetch attendance data')
      const json = await res.json()
      return json.data
    },
    staleTime: 15_000,
  })

  // ── Fetch classes for filter ──
  const { data: classesData } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['classes', schoolId],
    queryFn: async () => {
      const res = await fetch(`/api/students?schoolId=${schoolId}&limit=1`)
      if (!res.ok) return []
      const json = await res.json()
      // Extract unique classes from students or use mock
      return [
        { id: 'c1', name: 'Class 1 - A' },
        { id: 'c2', name: 'Class 2 - A' },
        { id: 'c3', name: 'Class 3 - A' },
        { id: 'c4', name: 'Class 4 - A' },
        { id: 'c5', name: 'Class 5 - A' },
        { id: 'c6', name: 'Class 6 - A' },
        { id: 'c7', name: 'Class 7 - A' },
        { id: 'c8', name: 'Class 8 - A' },
      ]
    },
    staleTime: 60_000,
  })

  // ── Save attendance mutation ──
  const saveAttendanceMutation = useMutation({
    mutationFn: async (records: { studentId: string; status: string; remarks?: string }[]) => {
      const promises = records.map((record) =>
        fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolId,
            studentId: record.studentId,
            date: selectedDate,
            status: record.status,
            remarks: record.remarks || '',
            markedBy: user?.name || 'System',
          }),
        })
      )
      const results = await Promise.allSettled(promises)
      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed > 0) throw new Error(`${failed} records failed to save`)
      return results.length
    },
    onSuccess: (count) => {
      toast.success(`${count} attendance records saved successfully`)
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      setAttendanceEdits({})
    },
    onError: (err) => {
      toast.error(`Failed to save attendance: ${err.message}`)
    },
  })

  // ── Add behavior log mutation ──
  const addBehaviorMutation = useMutation({
    mutationFn: async (log: typeof behaviorForm) => {
      // In production, this would POST to /api/behavior-logs
      await new Promise((resolve) => setTimeout(resolve, 500))
      return log
    },
    onSuccess: () => {
      toast.success('Behavior log added successfully')
      setBehaviorDialogOpen(false)
      setBehaviorForm({ studentId: '', type: 'positive', category: '', description: '', action: '' })
    },
    onError: () => {
      toast.error('Failed to add behavior log')
    },
  })

  // ── Derived data ──
  const summary = data?.summary ?? { present: 0, absent: 0, late: 0, excused: 0, total: 0, attendanceRate: 0 }
  const attendanceRate = summary.attendanceRate

  const trendData = useMemo(() => generateTrendData(summary), [summary.attendanceRate])
  const classComparisonData = useMemo(() => generateClassComparison(), [])
  const dayOfWeekData = useMemo(() => generateDayOfWeekData(), [])
  const teacherAttendance = useMemo(() => generateTeacherAttendance(), [])
  const behaviorLogs = useMemo(() => generateBehaviorLogs(), [])

  const topAbsentStudents = useMemo(() => {
    // Generate mock top absent students
    const names = ['Vikram Reddy', 'Neha Singh', 'Rohit Gupta', 'Kavita Joshi', 'Amit Verma']
    return names.map((name, i) => ({
      name,
      admissionNo: `ADM00${i + 5}`,
      absentDays: Math.round(8 + Math.random() * 15),
      rate: Math.round(60 + Math.random() * 25),
    })).sort((a, b) => a.rate - b.rate)
  }, [])

  // ── Handlers ──
  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceEdits((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }))
  }

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceEdits((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }))
  }

  const handleBulkPresent = () => {
    if (!data?.records) return
    const edits: Record<string, { status: string; remarks: string }> = {}
    data.records.forEach((record) => {
      edits[record.studentId] = { status: 'present', remarks: '' }
    })
    setAttendanceEdits(edits)
    toast.info('All students marked as present')
  }

  const handleSaveAttendance = () => {
    if (Object.keys(attendanceEdits).length === 0) {
      toast.error('No changes to save')
      return
    }
    const records = Object.entries(attendanceEdits).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      remarks: data.remarks,
    }))
    saveAttendanceMutation.mutate(records)
  }

  const handleTeacherStatusChange = (teacherId: string, field: string, value: string) => {
    setTeacherEdits((prev) => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], [field]: value },
    }))
  }

  const getEffectiveStatus = (record: AttendanceRecord) => {
    return attendanceEdits[record.studentId]?.status || record.status
  }

  const getEffectiveRemarks = (record: AttendanceRecord) => {
    return attendanceEdits[record.studentId]?.remarks || record.remarks || ''
  }

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold">Failed to load attendance data</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          {(error as Error)?.message || 'Something went wrong. Please try again later.'}
        </p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['attendance'] })}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-emerald-500" />
            Attendance & Discipline
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track daily attendance, manage discipline records, and analyze trends
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-8 w-auto text-xs"
            />
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="h-8 w-auto text-xs min-w-[140px]">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classesData?.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSaveAttendance}
            disabled={saveAttendanceMutation.isPending || Object.keys(attendanceEdits).length === 0}
          >
            {saveAttendanceMutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            Save
          </Button>
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Present Today"
          value={summary.present}
          icon={UserCheck}
          trend="up"
          trendLabel={`${summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0}% of total`}
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Absent Today"
          value={summary.absent}
          icon={UserX}
          trend={summary.absent > summary.total * 0.15 ? 'down' : 'neutral'}
          trendLabel={`${summary.total > 0 ? Math.round((summary.absent / summary.total) * 100) : 0}% of total`}
          iconBg="bg-red-50 dark:bg-red-950/30"
          iconColor="text-red-600 dark:text-red-400"
        />
        <StatCard
          title="Late Today"
          value={summary.late}
          icon={Clock}
          trend="neutral"
          trendLabel="Arrived after start"
          iconBg="bg-amber-50 dark:bg-amber-950/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          title="Attendance Rate"
          value={`${attendanceRate}%`}
          icon={Activity}
          trend={attendanceRate >= 90 ? 'up' : attendanceRate >= 75 ? 'neutral' : 'down'}
          trendLabel="Overall average"
          iconBg={attendanceRate >= 90 ? 'bg-emerald-50 dark:bg-emerald-950/30' : attendanceRate >= 75 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-red-50 dark:bg-red-950/30'}
          iconColor={attendanceRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : attendanceRate >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}
        />
      </div>

      {/* ── Tabs ── */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="student" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              Student Attendance
            </TabsTrigger>
            <TabsTrigger value="teacher" className="gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" />
              Teacher Attendance
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* ── Student Attendance Tab ── */}
          <TabsContent value="student" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-semibold">Student Attendance</CardTitle>
                    <CardDescription className="text-xs">
                      {format(new Date(selectedDate + 'T00:00:00'), 'MMMM dd, yyyy')} &mdash; {data?.records.length || 0} students
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleBulkPresent}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Mark All Present
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-semibold">Student Name</TableHead>
                        <TableHead className="text-xs font-semibold">Admission No</TableHead>
                        <TableHead className="text-xs font-semibold">Class</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Time</TableHead>
                        <TableHead className="text-xs font-semibold">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.records && data.records.length > 0 ? (
                        data.records.map((record) => {
                          const effectiveStatus = getEffectiveStatus(record)
                          const effectiveRemarks = getEffectiveRemarks(record)
                          const statusConfig = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.present
                          return (
                            <TableRow key={record.id} className="hover:bg-muted/30">
                              <TableCell className="text-xs font-medium">
                                {record.student.firstName} {record.student.lastName}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {record.student.admissionNo}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {record.student.class?.name || '-'} {record.student.section?.name ? `(${record.student.section.name})` : ''}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={effectiveStatus}
                                  onValueChange={(val) => handleStatusChange(record.studentId, val)}
                                >
                                  <SelectTrigger className="h-7 w-[110px] text-xs">
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusConfig.badge}`}>
                                      {statusConfig.label}
                                    </Badge>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                      <SelectItem key={key} value={key}>
                                        <span className="flex items-center gap-2">
                                          <span className={`h-2 w-2 rounded-full ${
                                            key === 'present' ? 'bg-emerald-500' :
                                            key === 'absent' ? 'bg-red-500' :
                                            key === 'late' ? 'bg-amber-500' : 'bg-sky-500'
                                          }`} />
                                          {cfg.label}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {effectiveStatus === 'present' ? '08:00 AM' :
                                 effectiveStatus === 'late' ? '09:15 AM' :
                                 effectiveStatus === 'excused' ? '-' : '-'}
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={effectiveRemarks}
                                  onChange={(e) => handleRemarksChange(record.studentId, e.target.value)}
                                  placeholder="Add remark..."
                                  className="h-7 text-xs w-[120px]"
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                            <div className="flex flex-col items-center gap-2">
                              <ClipboardCheck className="h-8 w-8 opacity-40" />
                              <p>No attendance records found for this date</p>
                              <Button variant="outline" size="sm" className="h-7 text-xs mt-1" onClick={handleBulkPresent}>
                                <Plus className="h-3 w-3 mr-1" />
                                Initialize Attendance
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Teacher Attendance Tab ── */}
          <TabsContent value="teacher" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Teacher Attendance</CardTitle>
                <CardDescription className="text-xs">
                  {format(new Date(selectedDate + 'T00:00:00'), 'MMMM dd, yyyy')} &mdash; {teacherAttendance.length} teachers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-semibold">Teacher Name</TableHead>
                        <TableHead className="text-xs font-semibold">Employee ID</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Check-in</TableHead>
                        <TableHead className="text-xs font-semibold">Check-out</TableHead>
                        <TableHead className="text-xs font-semibold">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherAttendance.map((teacher) => {
                        const edits = teacherEdits[teacher.id]
                        const effectiveStatus = edits?.status || teacher.status
                        const effectiveCheckIn = edits?.checkIn || teacher.checkIn
                        const effectiveCheckOut = edits?.checkOut || teacher.checkOut
                        const effectiveRemarks = edits?.remarks || teacher.remarks
                        const statusConfig = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.present
                        return (
                          <TableRow key={teacher.id} className="hover:bg-muted/30">
                            <TableCell className="text-xs font-medium">{teacher.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{teacher.employeeId}</TableCell>
                            <TableCell>
                              <Select
                                value={effectiveStatus}
                                onValueChange={(val) => handleTeacherStatusChange(teacher.id, 'status', val)}
                              >
                                <SelectTrigger className="h-7 w-[110px] text-xs">
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusConfig.badge}`}>
                                    {statusConfig.label}
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <SelectItem key={key} value={key}>
                                      <span className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${
                                          key === 'present' ? 'bg-emerald-500' :
                                          key === 'absent' ? 'bg-red-500' :
                                          key === 'late' ? 'bg-amber-500' : 'bg-sky-500'
                                        }`} />
                                        {cfg.label}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={effectiveCheckIn}
                                onChange={(e) => handleTeacherStatusChange(teacher.id, 'checkIn', e.target.value)}
                                className="h-7 text-xs w-[100px]"
                                disabled={effectiveStatus === 'absent' || effectiveStatus === 'excused'}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={effectiveCheckOut}
                                onChange={(e) => handleTeacherStatusChange(teacher.id, 'checkOut', e.target.value)}
                                className="h-7 text-xs w-[100px]"
                                disabled={effectiveStatus === 'absent' || effectiveStatus === 'excused'}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={effectiveRemarks}
                                onChange={(e) => handleTeacherStatusChange(teacher.id, 'remarks', e.target.value)}
                                placeholder="Add remark..."
                                className="h-7 text-xs w-[120px]"
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Attendance Trend */}
              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Attendance Trend
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Daily attendance rate over the past 30 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            interval={4}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            domain={[50, 100]}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              fontSize: 12,
                              borderRadius: 8,
                              border: '1px solid var(--border)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="rate"
                            name="Attendance Rate (%)"
                            stroke={CHART_COLORS.emerald}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 4, stroke: CHART_COLORS.emerald, strokeWidth: 2, fill: '#fff' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Class-wise Comparison */}
              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-teal-500" />
                      Class-wise Attendance
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Attendance rate comparison across classes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={classComparisonData} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              fontSize: 12,
                              borderRadius: 8,
                              border: '1px solid var(--border)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}
                          />
                          <Bar
                            dataKey="rate"
                            name="Attendance Rate (%)"
                            fill={CHART_COLORS.teal}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Absent Students */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <UserX className="h-4 w-4 text-red-500" />
                      Top Absent Students
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Students with lowest attendance rates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5">
                      {topAbsentStudents.map((student, idx) => (
                        <div
                          key={student.admissionNo}
                          className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-accent/50 transition-colors"
                        >
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            student.rate < 70
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{student.name}</p>
                            <p className="text-[11px] text-muted-foreground">{student.admissionNo} &middot; {student.absentDays} days absent</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              student.rate < 70
                                ? 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400'
                                : 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400'
                            }`}
                          >
                            {student.rate}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Attendance by Day of Week */}
              <motion.div variants={itemVariants}>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      Attendance by Day
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Average attendance rate by day of week
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dayOfWeekData} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            domain={[50, 100]}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              fontSize: 12,
                              borderRadius: 8,
                              border: '1px solid var(--border)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}
                          />
                          <Bar
                            dataKey="rate"
                            name="Attendance Rate (%)"
                            fill={CHART_COLORS.amber}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={36}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ── Discipline Section ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-teal-500" />
                  Recent Behavior Logs
                </CardTitle>
                <CardDescription className="text-xs">
                  Student discipline and behavior records
                </CardDescription>
              </div>
              <Dialog open={behaviorDialogOpen} onOpenChange={setBehaviorDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 bg-teal-600 hover:bg-teal-700 text-white text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Behavior Log
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Behavior Log</DialogTitle>
                    <DialogDescription>
                      Record a student behavior incident
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bl-student" className="text-xs">Student</Label>
                      <Input
                        id="bl-student"
                        placeholder="Search student by name or admission no..."
                        value={behaviorForm.studentId}
                        onChange={(e) => setBehaviorForm((prev) => ({ ...prev, studentId: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="bl-type" className="text-xs">Type</Label>
                        <Select
                          value={behaviorForm.type}
                          onValueChange={(val) => setBehaviorForm((prev) => ({ ...prev, type: val }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="positive">Positive</SelectItem>
                            <SelectItem value="negative">Negative</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="bl-category" className="text-xs">Category</Label>
                        <Select
                          value={behaviorForm.category}
                          onValueChange={(val) => setBehaviorForm((prev) => ({ ...prev, category: val }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Academic">Academic</SelectItem>
                            <SelectItem value="Discipline">Discipline</SelectItem>
                            <SelectItem value="Attendance">Attendance</SelectItem>
                            <SelectItem value="Leadership">Leadership</SelectItem>
                            <SelectItem value="General">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bl-description" className="text-xs">Description</Label>
                      <Textarea
                        id="bl-description"
                        placeholder="Describe the behavior incident..."
                        value={behaviorForm.description}
                        onChange={(e) => setBehaviorForm((prev) => ({ ...prev, description: e.target.value }))}
                        className="text-xs min-h-[80px]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bl-action" className="text-xs">Action Taken</Label>
                      <Input
                        id="bl-action"
                        placeholder="What action was taken?"
                        value={behaviorForm.action}
                        onChange={(e) => setBehaviorForm((prev) => ({ ...prev, action: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setBehaviorDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 bg-teal-600 hover:bg-teal-700 text-white text-xs"
                      onClick={() => addBehaviorMutation.mutate(behaviorForm)}
                      disabled={addBehaviorMutation.isPending || !behaviorForm.description}
                    >
                      {addBehaviorMutation.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        'Add Log'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">Student</TableHead>
                    <TableHead className="text-xs font-semibold">Type</TableHead>
                    <TableHead className="text-xs font-semibold">Category</TableHead>
                    <TableHead className="text-xs font-semibold">Description</TableHead>
                    <TableHead className="text-xs font-semibold">Action</TableHead>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {behaviorLogs.map((log) => {
                    const typeConfig = BEHAVIOR_TYPE_CONFIG[log.type] || BEHAVIOR_TYPE_CONFIG.neutral
                    const TypeIcon = typeConfig.icon
                    return (
                      <TableRow key={log.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">
                          {log.student.firstName} {log.student.lastName}
                          <span className="text-muted-foreground ml-1">({log.student.admissionNo})</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${typeConfig.bg}`}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.category || '-'}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {log.description}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.action || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(log.date), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
