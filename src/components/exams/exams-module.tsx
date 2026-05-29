'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Plus,
  Award,
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  Edit,
  Eye,
  Filter,
  Printer,
  Star,
  Target,
  Users,
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

const GRADE_COLORS: Record<string, string> = {
  'A+': CHART_COLORS.emerald,
  'A': CHART_COLORS.emerald,
  'B+': CHART_COLORS.teal,
  'B': CHART_COLORS.teal,
  'C+': CHART_COLORS.amber,
  'C': CHART_COLORS.amber,
  'D+': CHART_COLORS.orange,
  'D': CHART_COLORS.orange,
  'E': CHART_COLORS.orange,
  'F': CHART_COLORS.red,
}

const GRADE_TEXT_COLORS: Record<string, string> = {
  'A+': 'text-emerald-700 dark:text-emerald-400',
  'A': 'text-emerald-700 dark:text-emerald-400',
  'B+': 'text-teal-700 dark:text-teal-400',
  'B': 'text-teal-700 dark:text-teal-400',
  'C+': 'text-amber-700 dark:text-amber-400',
  'C': 'text-amber-700 dark:text-amber-400',
  'D+': 'text-orange-700 dark:text-orange-400',
  'D': 'text-orange-700 dark:text-orange-400',
  'E': 'text-orange-700 dark:text-orange-400',
  'F': 'text-red-700 dark:text-red-400',
}

const GRADE_BG_COLORS: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  'A': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  'B+': 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  'B': 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  'C+': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'C': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'D+': 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  'D': 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  'E': 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  'F': 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800',
}

const EXAM_TYPE_COLORS: Record<string, string> = {
  written: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  practical: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
  oral: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  project: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
}

const EXAM_STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  'in-progress': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
}

// ── Types ───────────────────────────────────────────────────────
interface ExamResult {
  id: string
  examId: string
  studentId: string
  marksObtained: number
  grade: string | null
  remarks: string | null
  student: {
    id: string
    firstName: string
    lastName: string
    admissionNo: string
    class: { name: string } | null
  }
}

interface ExamWithStats {
  id: string
  schoolId: string
  subjectId: string
  termId: string
  name: string
  type: string
  totalMarks: number
  passingMarks: number
  date: string
  duration: number | null
  createdAt: string
  updatedAt: string
  subject: { id: string; name: string; code: string | null; type: string }
  term: { id: string; name: string; status: string }
  results: ExamResult[]
  stats: {
    totalStudents: number
    passedStudents: number
    failedStudents: number
    averageMarks: number
    highestMarks: number
    lowestMarks: number
    passRate: number
  }
}

interface ExamsData {
  exams: ExamWithStats[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
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

// ── Helper: compute grade from marks ────────────────────────────
function computeGrade(marks: number, total: number): string {
  const pct = (marks / total) * 100
  if (pct >= 95) return 'A+'
  if (pct >= 85) return 'A'
  if (pct >= 75) return 'B+'
  if (pct >= 65) return 'B'
  if (pct >= 55) return 'C+'
  if (pct >= 45) return 'C'
  if (pct >= 35) return 'D'
  if (pct >= 25) return 'E'
  return 'F'
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

// ── Mock data generators ────────────────────────────────────────
function generateMockExams(): ExamWithStats[] {
  return [
    {
      id: 'ex1',
      schoolId: 'sch1',
      subjectId: 'sub1',
      termId: 't1',
      name: 'Mid-Term Mathematics',
      type: 'written',
      totalMarks: 100,
      passingMarks: 35,
      date: new Date(Date.now() - 7 * 86400000).toISOString(),
      duration: 180,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subject: { id: 'sub1', name: 'Mathematics', code: 'MATH101', type: 'core' },
      term: { id: 't1', name: 'Term 1 - 2026', status: 'active' },
      results: [
        { id: 'r1', examId: 'ex1', studentId: 's1', marksObtained: 92, grade: 'A', remarks: 'Excellent', student: { id: 's1', firstName: 'Aarav', lastName: 'Sharma', admissionNo: 'ADM001', class: { name: 'Class 8' } } },
        { id: 'r2', examId: 'ex1', studentId: 's2', marksObtained: 78, grade: 'B+', remarks: 'Good', student: { id: 's2', firstName: 'Priya', lastName: 'Patel', admissionNo: 'ADM002', class: { name: 'Class 8' } } },
        { id: 'r3', examId: 'ex1', studentId: 's3', marksObtained: 65, grade: 'B', remarks: '', student: { id: 's3', firstName: 'Arjun', lastName: 'Kumar', admissionNo: 'ADM003', class: { name: 'Class 8' } } },
        { id: 'r4', examId: 'ex1', studentId: 's4', marksObtained: 45, grade: 'C', remarks: 'Needs improvement', student: { id: 's4', firstName: 'Neha', lastName: 'Singh', admissionNo: 'ADM004', class: { name: 'Class 8' } } },
        { id: 'r5', examId: 'ex1', studentId: 's5', marksObtained: 28, grade: 'F', remarks: 'Failed - remedial needed', student: { id: 's5', firstName: 'Vikram', lastName: 'Reddy', admissionNo: 'ADM005', class: { name: 'Class 8' } } },
        { id: 'r6', examId: 'ex1', studentId: 's6', marksObtained: 85, grade: 'A', remarks: '', student: { id: 's6', firstName: 'Kavita', lastName: 'Joshi', admissionNo: 'ADM006', class: { name: 'Class 8' } } },
        { id: 'r7', examId: 'ex1', studentId: 's7', marksObtained: 55, grade: 'C+', remarks: '', student: { id: 's7', firstName: 'Rohit', lastName: 'Gupta', admissionNo: 'ADM007', class: { name: 'Class 8' } } },
        { id: 'r8', examId: 'ex1', studentId: 's8', marksObtained: 72, grade: 'B', remarks: 'Good effort', student: { id: 's8', firstName: 'Ananya', lastName: 'Das', admissionNo: 'ADM008', class: { name: 'Class 8' } } },
      ],
      stats: { totalStudents: 8, passedStudents: 7, failedStudents: 1, averageMarks: 65, highestMarks: 92, lowestMarks: 28, passRate: 87.5 },
    },
    {
      id: 'ex2',
      schoolId: 'sch1',
      subjectId: 'sub2',
      termId: 't1',
      name: 'Mid-Term Science',
      type: 'written',
      totalMarks: 100,
      passingMarks: 35,
      date: new Date(Date.now() - 5 * 86400000).toISOString(),
      duration: 180,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subject: { id: 'sub2', name: 'Science', code: 'SCI101', type: 'core' },
      term: { id: 't1', name: 'Term 1 - 2026', status: 'active' },
      results: [
        { id: 'r9', examId: 'ex2', studentId: 's1', marksObtained: 88, grade: 'A', remarks: '', student: { id: 's1', firstName: 'Aarav', lastName: 'Sharma', admissionNo: 'ADM001', class: { name: 'Class 8' } } },
        { id: 'r10', examId: 'ex2', studentId: 's2', marksObtained: 72, grade: 'B', remarks: '', student: { id: 's2', firstName: 'Priya', lastName: 'Patel', admissionNo: 'ADM002', class: { name: 'Class 8' } } },
        { id: 'r11', examId: 'ex2', studentId: 's3', marksObtained: 56, grade: 'C+', remarks: '', student: { id: 's3', firstName: 'Arjun', lastName: 'Kumar', admissionNo: 'ADM003', class: { name: 'Class 8' } } },
        { id: 'r12', examId: 'ex2', studentId: 's4', marksObtained: 41, grade: 'D', remarks: 'Borderline', student: { id: 's4', firstName: 'Neha', lastName: 'Singh', admissionNo: 'ADM004', class: { name: 'Class 8' } } },
        { id: 'r13', examId: 'ex2', studentId: 's5', marksObtained: 35, grade: 'D', remarks: 'Just passed', student: { id: 's5', firstName: 'Vikram', lastName: 'Reddy', admissionNo: 'ADM005', class: { name: 'Class 8' } } },
        { id: 'r14', examId: 'ex2', studentId: 's6', marksObtained: 95, grade: 'A+', remarks: 'Outstanding', student: { id: 's6', firstName: 'Kavita', lastName: 'Joshi', admissionNo: 'ADM006', class: { name: 'Class 8' } } },
        { id: 'r15', examId: 'ex2', studentId: 's7', marksObtained: 62, grade: 'B', remarks: '', student: { id: 's7', firstName: 'Rohit', lastName: 'Gupta', admissionNo: 'ADM007', class: { name: 'Class 8' } } },
        { id: 'r16', examId: 'ex2', studentId: 's8', marksObtained: 80, grade: 'A', remarks: '', student: { id: 's8', firstName: 'Ananya', lastName: 'Das', admissionNo: 'ADM008', class: { name: 'Class 8' } } },
      ],
      stats: { totalStudents: 8, passedStudents: 8, failedStudents: 0, averageMarks: 66.13, highestMarks: 95, lowestMarks: 35, passRate: 100 },
    },
    {
      id: 'ex3',
      schoolId: 'sch1',
      subjectId: 'sub3',
      termId: 't1',
      name: 'English Literature - Unit Test',
      type: 'written',
      totalMarks: 50,
      passingMarks: 18,
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      duration: 90,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subject: { id: 'sub3', name: 'English', code: 'ENG101', type: 'core' },
      term: { id: 't1', name: 'Term 1 - 2026', status: 'active' },
      results: [],
      stats: { totalStudents: 0, passedStudents: 0, failedStudents: 0, averageMarks: 0, highestMarks: 0, lowestMarks: 0, passRate: 0 },
    },
    {
      id: 'ex4',
      schoolId: 'sch1',
      subjectId: 'sub4',
      termId: 't1',
      name: 'Hindi - Final Exam',
      type: 'written',
      totalMarks: 100,
      passingMarks: 35,
      date: new Date(Date.now() + 7 * 86400000).toISOString(),
      duration: 180,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subject: { id: 'sub4', name: 'Hindi', code: 'HIN101', type: 'core' },
      term: { id: 't1', name: 'Term 1 - 2026', status: 'active' },
      results: [],
      stats: { totalStudents: 0, passedStudents: 0, failedStudents: 0, averageMarks: 0, highestMarks: 0, lowestMarks: 0, passRate: 0 },
    },
    {
      id: 'ex5',
      schoolId: 'sch1',
      subjectId: 'sub5',
      termId: 't1',
      name: 'Computer Science - Practical',
      type: 'practical',
      totalMarks: 50,
      passingMarks: 20,
      date: new Date(Date.now() + 10 * 86400000).toISOString(),
      duration: 120,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subject: { id: 'sub5', name: 'Computer Science', code: 'CS101', type: 'elective' },
      term: { id: 't1', name: 'Term 1 - 2026', status: 'active' },
      results: [],
      stats: { totalStudents: 0, passedStudents: 0, failedStudents: 0, averageMarks: 0, highestMarks: 0, lowestMarks: 0, passRate: 0 },
    },
  ]
}

function generateReportCardData() {
  const subjects = [
    { name: 'Mathematics', marks: 92, total: 100, grade: 'A' },
    { name: 'Science', marks: 88, total: 100, grade: 'A' },
    { name: 'English', marks: 78, total: 100, grade: 'B+' },
    { name: 'Hindi', marks: 85, total: 100, grade: 'A' },
    { name: 'Social Studies', marks: 72, total: 100, grade: 'B' },
    { name: 'Computer Science', marks: 95, total: 100, grade: 'A+' },
  ]
  const totalMarks = subjects.reduce((sum, s) => sum + s.marks, 0)
  const totalPossible = subjects.reduce((sum, s) => sum + s.total, 0)
  const percentage = Math.round((totalMarks / totalPossible) * 100)
  const overallGrade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : 'D'
  return { subjects, totalMarks, totalPossible, percentage, overallGrade }
}

// ── Main Component ──────────────────────────────────────────────
export function ExamsModule() {
  const { user } = useAppStore()
  const schoolId = user?.schoolId || ''
  const queryClient = useQueryClient()

  // ── State ──
  const [activeTab, setActiveTab] = useState('exams')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedTerm, setSelectedTerm] = useState<string>('all')
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editResultDialog, setEditResultDialog] = useState<{ open: boolean; resultId: string; marks: string; remarks: string }>({
    open: false,
    resultId: '',
    marks: '',
    remarks: '',
  })
  const [examForm, setExamForm] = useState({
    name: '',
    subjectId: '',
    termId: '',
    type: 'written',
    totalMarks: '100',
    passingMarks: '35',
    date: format(new Date(), 'yyyy-MM-dd'),
    duration: '180',
  })

  // ── Fetch exams data ──
  const { data, isLoading, isError, error } = useQuery<ExamsData>({
    queryKey: ['exams', schoolId, selectedSubject, selectedTerm],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (schoolId) params.set('schoolId', schoolId)
      if (selectedSubject && selectedSubject !== 'all') params.set('subjectId', selectedSubject)
      if (selectedTerm && selectedTerm !== 'all') params.set('termId', selectedTerm)
      params.set('limit', '50')
      const res = await fetch(`/api/exams?${params}`)
      if (!res.ok) throw new Error('Failed to fetch exams data')
      const json = await res.json()
      return json.data
    },
    staleTime: 15_000,
  })

  // ── Derived data - use mock data as fallback ──
  const exams = useMemo(() => {
    if (data?.exams && data.exams.length > 0) return data.exams
    return generateMockExams()
  }, [data])

  const totalExams = exams.length
  const completedExams = exams.filter((e) => e.stats.totalStudents > 0)
  const averageScore = completedExams.length > 0
    ? Math.round(completedExams.reduce((sum, e) => sum + e.stats.averageMarks, 0) / completedExams.length)
    : 0
  const passRate = completedExams.length > 0
    ? Math.round(completedExams.reduce((sum, e) => sum + e.stats.passRate, 0) / completedExams.length)
    : 0
  const examsThisMonth = exams.filter((e) => {
    const examDate = new Date(e.date)
    const now = new Date()
    return examDate.getMonth() === now.getMonth() && examDate.getFullYear() === now.getFullYear()
  }).length

  // ── Selected exam for results view ──
  const selectedExam = exams.find((e) => e.id === selectedExamId)

  // ── Create exam mutation ──
  const createExamMutation = useMutation({
    mutationFn: async (formData: typeof examForm) => {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          ...formData,
          totalMarks: parseFloat(formData.totalMarks),
          passingMarks: parseFloat(formData.passingMarks),
          duration: parseInt(formData.duration, 10) || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create exam')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Exam created successfully')
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      setCreateDialogOpen(false)
      setExamForm({
        name: '',
        subjectId: '',
        termId: '',
        type: 'written',
        totalMarks: '100',
        passingMarks: '35',
        date: format(new Date(), 'yyyy-MM-dd'),
        duration: '180',
      })
    },
    onError: (err) => {
      toast.error(`Failed to create exam: ${err.message}`)
    },
  })

  // ── Update result mutation ──
  const updateResultMutation = useMutation({
    mutationFn: async ({ resultId, marksObtained, remarks }: { resultId: string; marksObtained: number; remarks?: string }) => {
      const res = await fetch('/api/exams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId, marksObtained, remarks }),
      })
      if (!res.ok) throw new Error('Failed to update result')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Result updated successfully')
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      setEditResultDialog({ open: false, resultId: '', marks: '', remarks: '' })
    },
    onError: (err) => {
      toast.error(`Failed to update result: ${err.message}`)
    },
  })

  // ── Grade distribution for selected exam ──
  const gradeDistribution = useMemo(() => {
    if (!selectedExam || selectedExam.results.length === 0) return []
    const dist: Record<string, number> = {}
    selectedExam.results.forEach((r) => {
      const grade = r.grade || computeGrade(r.marksObtained, selectedExam.totalMarks)
      dist[grade] = (dist[grade] || 0) + 1
    })
    return Object.entries(dist)
      .map(([grade, count]) => ({
        grade,
        count,
        color: GRADE_COLORS[grade] || CHART_COLORS.slate,
      }))
      .sort((a, b) => a.grade.localeCompare(b.grade))
  }, [selectedExam])

  // ── Analytics data ──
  const subjectPerformanceData = useMemo(() => {
    return completedExams.map((e) => ({
      subject: e.subject.name,
      average: Math.round(e.stats.averageMarks),
      passRate: Math.round(e.stats.passRate),
    }))
  }, [completedExams])

  const performanceTrendData = useMemo(() => {
    const terms = ['Term 1', 'Term 2', 'Term 3']
    return terms.map((term, i) => ({
      term,
      average: Math.round(60 + Math.random() * 25),
      passRate: Math.round(70 + Math.random() * 25),
    }))
  }, [])

  const overallGradeDist = useMemo(() => {
    const allResults = exams.flatMap((e) => e.results)
    if (allResults.length === 0) return []
    const dist: Record<string, number> = {}
    allResults.forEach((r) => {
      const grade = r.grade || 'N/A'
      dist[grade] = (dist[grade] || 0) + 1
    })
    return Object.entries(dist)
      .map(([grade, count]) => ({
        name: grade,
        value: count,
        color: GRADE_COLORS[grade] || CHART_COLORS.slate,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [exams])

  const reportCard = useMemo(() => generateReportCardData(), [])

  // ── Get exam status ──
  const getExamStatus = (exam: ExamWithStats) => {
    const examDate = new Date(exam.date)
    const now = new Date()
    if (exam.stats.totalStudents > 0) return 'completed'
    if (examDate > now) return 'upcoming'
    return 'completed'
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
        <ChartSkeleton />
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
        <h3 className="text-lg font-semibold">Failed to load exams data</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          {(error as Error)?.message || 'Something went wrong. Please try again later.'}
        </p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['exams'] })}>
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
            <FileText className="h-6 w-6 text-emerald-500" />
            Exams & Grading Engine
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage exams, track results, and generate report cards
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="h-8 w-auto text-xs min-w-[130px]">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {Array.from(new Set(exams.map((e) => e.subject.id))).map((id) => {
                const exam = exams.find((e) => e.subject.id === id)
                return (
                  <SelectItem key={id} value={id}>
                    {exam?.subject.name || id}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="h-8 w-auto text-xs min-w-[130px]">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {Array.from(new Set(exams.map((e) => e.term.id))).map((id) => {
                const exam = exams.find((e) => e.term.id === id)
                return (
                  <SelectItem key={id} value={id}>
                    {exam?.term.name || id}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
                <DialogDescription>
                  Set up a new examination for your school
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="exam-name" className="text-xs">Exam Name</Label>
                  <Input
                    id="exam-name"
                    placeholder="e.g. Mid-Term Mathematics"
                    value={examForm.name}
                    onChange={(e) => setExamForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="exam-subject" className="text-xs">Subject</Label>
                    <Select
                      value={examForm.subjectId}
                      onValueChange={(val) => setExamForm((prev) => ({ ...prev, subjectId: val }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set(exams.map((e) => e.subject.id))).map((id) => {
                          const exam = exams.find((e) => e.subject.id === id)
                          return (
                            <SelectItem key={id} value={id}>
                              {exam?.subject.name || id}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="exam-term" className="text-xs">Term</Label>
                    <Select
                      value={examForm.termId}
                      onValueChange={(val) => setExamForm((prev) => ({ ...prev, termId: val }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set(exams.map((e) => e.term.id))).map((id) => {
                          const exam = exams.find((e) => e.term.id === id)
                          return (
                            <SelectItem key={id} value={id}>
                              {exam?.term.name || id}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="exam-type" className="text-xs">Type</Label>
                    <Select
                      value={examForm.type}
                      onValueChange={(val) => setExamForm((prev) => ({ ...prev, type: val }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="written">Written</SelectItem>
                        <SelectItem value="practical">Practical</SelectItem>
                        <SelectItem value="oral">Oral</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="exam-date" className="text-xs">Date</Label>
                    <Input
                      id="exam-date"
                      type="date"
                      value={examForm.date}
                      onChange={(e) => setExamForm((prev) => ({ ...prev, date: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="exam-total" className="text-xs">Total Marks</Label>
                    <Input
                      id="exam-total"
                      type="number"
                      value={examForm.totalMarks}
                      onChange={(e) => setExamForm((prev) => ({ ...prev, totalMarks: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="exam-passing" className="text-xs">Passing Marks</Label>
                    <Input
                      id="exam-passing"
                      type="number"
                      value={examForm.passingMarks}
                      onChange={(e) => setExamForm((prev) => ({ ...prev, passingMarks: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="exam-duration" className="text-xs">Duration (min)</Label>
                    <Input
                      id="exam-duration"
                      type="number"
                      value={examForm.duration}
                      onChange={(e) => setExamForm((prev) => ({ ...prev, duration: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  onClick={() => createExamMutation.mutate(examForm)}
                  disabled={createExamMutation.isPending || !examForm.name}
                >
                  {createExamMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    'Create Exam'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Exams"
          value={totalExams}
          icon={FileText}
          trend="neutral"
          trendLabel="All subjects"
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          subtitle={`${completedExams.length} completed`}
        />
        <StatCard
          title="Average Score"
          value={`${averageScore}%`}
          icon={Target}
          trend={averageScore >= 70 ? 'up' : 'down'}
          trendLabel={averageScore >= 70 ? 'Good performance' : 'Below target'}
          iconBg="bg-teal-50 dark:bg-teal-950/30"
          iconColor="text-teal-600 dark:text-teal-400"
        />
        <StatCard
          title="Pass Rate"
          value={`${passRate}%`}
          icon={CheckCircle2}
          trend={passRate >= 80 ? 'up' : passRate >= 60 ? 'neutral' : 'down'}
          trendLabel={passRate >= 80 ? 'Excellent' : passRate >= 60 ? 'Needs attention' : 'Critical'}
          iconBg={passRate >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/30' : passRate >= 60 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-red-50 dark:bg-red-950/30'}
          iconColor={passRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : passRate >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}
        />
        <StatCard
          title="Exams This Month"
          value={examsThisMonth}
          icon={Calendar}
          trend="neutral"
          trendLabel="Scheduled"
          iconBg="bg-amber-50 dark:bg-amber-950/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* ── Tabs ── */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="exams" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              Exams
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              Results
            </TabsTrigger>
            <TabsTrigger value="report-cards" className="gap-1.5 text-xs">
              <Award className="h-3.5 w-3.5" />
              Report Cards
            </TabsTrigger>
          </TabsList>

          {/* ── Exams Tab ── */}
          <TabsContent value="exams" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">All Examinations</CardTitle>
                <CardDescription className="text-xs">
                  {totalExams} exams &mdash; {completedExams.length} completed
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-semibold">Exam Name</TableHead>
                        <TableHead className="text-xs font-semibold">Subject</TableHead>
                        <TableHead className="text-xs font-semibold">Type</TableHead>
                        <TableHead className="text-xs font-semibold">Date</TableHead>
                        <TableHead className="text-xs font-semibold">Total Marks</TableHead>
                        <TableHead className="text-xs font-semibold">Passing</TableHead>
                        <TableHead className="text-xs font-semibold">Duration</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.map((exam) => {
                        const status = getExamStatus(exam)
                        return (
                          <TableRow key={exam.id} className="hover:bg-muted/30">
                            <TableCell className="text-xs font-medium">{exam.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{exam.subject.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${EXAM_TYPE_COLORS[exam.type] || ''}`}>
                                {exam.type.charAt(0).toUpperCase() + exam.type.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {format(new Date(exam.date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="text-xs">{exam.totalMarks}</TableCell>
                            <TableCell className="text-xs">{exam.passingMarks}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {exam.duration ? `${exam.duration} min` : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${EXAM_STATUS_COLORS[status]}`}>
                                {status === 'upcoming' ? 'Upcoming' : 'Completed'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                onClick={() => {
                                  setSelectedExamId(exam.id)
                                  setActiveTab('results')
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
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

          {/* ── Results Tab ── */}
          <TabsContent value="results" className="space-y-4 mt-4">
            {/* Exam selector */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-semibold">Exam Results</CardTitle>
                    <CardDescription className="text-xs">
                      Select an exam to view student results
                    </CardDescription>
                  </div>
                  <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                    <SelectTrigger className="h-8 w-auto text-xs min-w-[200px]">
                      <SelectValue placeholder="Select exam..." />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.filter((e) => e.stats.totalStudents > 0).map((exam) => (
                        <SelectItem key={exam.id} value={exam.id}>
                          {exam.name} ({exam.subject.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
            </Card>

            {selectedExam ? (
              <>
                {/* Stats cards for selected exam */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Class Average</p>
                    <p className="text-lg font-bold text-foreground">{selectedExam.stats.averageMarks.toFixed(1)}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Highest</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedExam.stats.highestMarks}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lowest</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{selectedExam.stats.lowestMarks}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pass Rate</p>
                    <p className={`text-lg font-bold ${selectedExam.stats.passRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : selectedExam.stats.passRate >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                      {selectedExam.stats.passRate}%
                    </p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Results table */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">
                          {selectedExam.name} &mdash; Student Results
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {selectedExam.results.length} students &middot; Total: {selectedExam.totalMarks} marks
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/30">
                                <TableHead className="text-xs font-semibold">Student Name</TableHead>
                                <TableHead className="text-xs font-semibold">Marks</TableHead>
                                <TableHead className="text-xs font-semibold">Grade</TableHead>
                                <TableHead className="text-xs font-semibold">Remarks</TableHead>
                                <TableHead className="text-xs font-semibold">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedExam.results.map((result) => {
                                const grade = result.grade || computeGrade(result.marksObtained, selectedExam.totalMarks)
                                const gradeBg = GRADE_BG_COLORS[grade] || GRADE_BG_COLORS['F']
                                return (
                                  <TableRow key={result.id} className="hover:bg-muted/30">
                                    <TableCell className="text-xs font-medium">
                                      {result.student.firstName} {result.student.lastName}
                                      <span className="text-muted-foreground ml-1">({result.student.admissionNo})</span>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <span className="font-semibold">{result.marksObtained}</span>
                                      <span className="text-muted-foreground">/{selectedExam.totalMarks}</span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-bold ${gradeBg}`}>
                                        {grade}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                                      {result.remarks || '-'}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => setEditResultDialog({
                                          open: true,
                                          resultId: result.id,
                                          marks: String(result.marksObtained),
                                          remarks: result.remarks || '',
                                        })}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Grade distribution chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-teal-500" />
                        Grade Distribution
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Performance breakdown
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        {gradeDistribution.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gradeDistribution} barGap={4}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                              <XAxis
                                dataKey="grade"
                                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                              />
                              <RechartsTooltip
                                contentStyle={{
                                  fontSize: 12,
                                  borderRadius: 8,
                                  border: '1px solid var(--border)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                }}
                              />
                              <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]} maxBarSize={30}>
                                {gradeDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            <div className="text-center space-y-2">
                              <BarChart3 className="h-8 w-8 mx-auto opacity-40" />
                              <p>No results data</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <FileText className="h-10 w-10 opacity-40" />
                    <p className="text-sm">Select an exam to view results</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Report Cards Tab ── */}
          <TabsContent value="report-cards" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-semibold">Report Card Generator</CardTitle>
                    <CardDescription className="text-xs">
                      Generate and preview student report cards
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search student..."
                      className="h-8 w-auto text-xs min-w-[200px]"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>

            {selectedStudentId ? (
              <Card className="overflow-hidden">
                <CardHeader className="pb-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Aarav Sharma</CardTitle>
                        <CardDescription>ADM001 &middot; Class 8 &middot; Term 1 - 2026</CardDescription>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Generate Report Card
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs font-semibold">Subject</TableHead>
                          <TableHead className="text-xs font-semibold">Marks Obtained</TableHead>
                          <TableHead className="text-xs font-semibold">Total Marks</TableHead>
                          <TableHead className="text-xs font-semibold">Percentage</TableHead>
                          <TableHead className="text-xs font-semibold">Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportCard.subjects.map((subject) => {
                          const pct = Math.round((subject.marks / subject.total) * 100)
                          const grade = subject.grade
                          const gradeBg = GRADE_BG_COLORS[grade] || GRADE_BG_COLORS['C']
                          return (
                            <TableRow key={subject.name} className="hover:bg-muted/30">
                              <TableCell className="text-xs font-medium">{subject.name}</TableCell>
                              <TableCell className="text-xs font-semibold">{subject.marks}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{subject.total}</TableCell>
                              <TableCell className="text-xs">{pct}%</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-bold ${gradeBg}`}>
                                  {grade}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {/* Total row */}
                        <TableRow className="bg-muted/20 font-semibold">
                          <TableCell className="text-xs">Total</TableCell>
                          <TableCell className="text-xs">{reportCard.totalMarks}</TableCell>
                          <TableCell className="text-xs">{reportCard.totalPossible}</TableCell>
                          <TableCell className="text-xs">{reportCard.percentage}%</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] px-2 py-0 h-5 font-bold ${GRADE_BG_COLORS[reportCard.overallGrade]}`}>
                              {reportCard.overallGrade}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>

                {/* Additional info */}
                <div className="p-4 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Attendance Summary</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium">92% Present</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">184/200 days attended</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Overall Rank</p>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium">3rd in Class</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Out of 40 students</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Teacher Remarks</p>
                      <p className="text-xs text-foreground">Excellent academic performance. Shows strong aptitude in Mathematics and Science. Could improve in physical activities.</p>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Award className="h-10 w-10 opacity-40" />
                    <p className="text-sm">Search for a student to generate their report card</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ── Analytics Section ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              Performance Analytics
            </CardTitle>
            <CardDescription className="text-xs">
              Comparative analysis and trends across exams
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subject-wise Performance */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-teal-500" />
                Subject-wise Performance
              </CardTitle>
              <CardDescription className="text-xs">
                Average marks and pass rate by subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {subjectPerformanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectPerformanceData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis
                        dataKey="subject"
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
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar
                        dataKey="average"
                        name="Avg Marks"
                        fill={CHART_COLORS.emerald}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                      />
                      <Bar
                        dataKey="passRate"
                        name="Pass Rate"
                        fill={CHART_COLORS.teal}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No subject data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Trend over Terms */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Performance Trend
              </CardTitle>
              <CardDescription className="text-xs">
                Average performance across academic terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis
                      dataKey="term"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
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
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="average"
                      name="Avg Marks (%)"
                      stroke={CHART_COLORS.emerald}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: CHART_COLORS.emerald, strokeWidth: 0 }}
                      activeDot={{ r: 6, stroke: CHART_COLORS.emerald, strokeWidth: 2, fill: '#fff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="passRate"
                      name="Pass Rate (%)"
                      stroke={CHART_COLORS.teal}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: CHART_COLORS.teal, strokeWidth: 0 }}
                      activeDot={{ r: 6, stroke: CHART_COLORS.teal, strokeWidth: 2, fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Grade Distribution Pie Chart */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-teal-500" />
              Overall Grade Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of grades across all exams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {overallGradeDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overallGradeDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {overallGradeDist.map((entry, index) => (
                        <Cell key={`grade-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  <div className="text-center space-y-2">
                    <Award className="h-8 w-8 mx-auto opacity-40" />
                    <p>No grade data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Edit Result Dialog ── */}
      <Dialog
        open={editResultDialog.open}
        onOpenChange={(open) => setEditResultDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Result</DialogTitle>
            <DialogDescription>
              Update marks and remarks for this student
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-marks" className="text-xs">Marks Obtained</Label>
              <Input
                id="edit-marks"
                type="number"
                value={editResultDialog.marks}
                onChange={(e) => setEditResultDialog((prev) => ({ ...prev, marks: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-remarks" className="text-xs">Remarks</Label>
              <Textarea
                id="edit-remarks"
                value={editResultDialog.remarks}
                onChange={(e) => setEditResultDialog((prev) => ({ ...prev, remarks: e.target.value }))}
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setEditResultDialog({ open: false, resultId: '', marks: '', remarks: '' })}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              onClick={() => updateResultMutation.mutate({
                resultId: editResultDialog.resultId,
                marksObtained: parseFloat(editResultDialog.marks),
                remarks: editResultDialog.remarks,
              })}
              disabled={updateResultMutation.isPending}
            >
              {updateResultMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
