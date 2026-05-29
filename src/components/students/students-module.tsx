'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  GraduationCap,
  Search,
  UserPlus,
  Users,
  AlertTriangle,
  UserCheck,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  MapPin,
  Heart,
  Shield,
  BookOpen,
  DollarSign,
  ClipboardCheck,
  Calendar,
  Droplet,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Star,
  Clock,
  CheckCircle2,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'

// ── Color palette ───────────────────────────────────────────────
const RISK_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  low: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  medium: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  high: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  inactive: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
  graduated: { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400' },
  suspended: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' },
  transferred: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400' },
}

// ── Types ───────────────────────────────────────────────────────
interface StudentUser {
  email: string
  phone: string | null
  avatar: string | null
  status: string
}

interface StudentClass {
  id: string
  name: string
  level: string | null
}

interface StudentSection {
  id: string
  name: string
}

interface StudentParent {
  id: string
  name: string
  phone: string | null
  email: string | null
}

interface Student {
  id: string
  schoolId: string
  userId: string
  admissionNo: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
  gender: string | null
  address: string | null
  bloodGroup: string | null
  emergencyContact: string | null
  classId: string | null
  sectionId: string | null
  parentId: string | null
  admissionDate: string
  status: string
  riskLevel: string
  createdAt: string
  updatedAt: string
  user: StudentUser
  class: StudentClass | null
  section: StudentSection | null
  parent: StudentParent | null
}

interface StudentsResponse {
  success: boolean
  data: {
    students: Student[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

// ── Form Schema ─────────────────────────────────────────────────
const addStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  admissionNo: z.string().min(1, 'Admission number is required'),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  parentId: z.string().optional(),
  phone: z.string().optional(),
})

type AddStudentFormValues = z.infer<typeof addStudentSchema>

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
      <CardContent className="p-0">
        <div className="space-y-0">
          <div className="flex items-center gap-4 p-4 border-b">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
              {Array.from({ length: 8 }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
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

// ── Risk Badge ──────────────────────────────────────────────────
function RiskBadge({ level }: { level: string }) {
  const style = RISK_STYLES[level] || RISK_STYLES.low
  return (
    <Badge variant="outline" className={`${style.bg} ${style.text} border-transparent gap-1.5 text-[11px]`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  )
}

// ── Status Badge ────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.active
  return (
    <Badge variant="outline" className={`${style.bg} ${style.text} border-transparent text-[11px]`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

// ── Student Detail View ─────────────────────────────────────────
function StudentDetailSheet({
  student,
  open,
  onOpenChange,
}: {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!student) return null

  const initials = `${student.firstName[0]}${student.lastName[0]}`
  const fullName = `${student.firstName} ${student.lastName}`

  // Simulated detail data (would come from API in production)
  const attendanceRate = student.riskLevel === 'high' ? 62 : student.riskLevel === 'medium' ? 78 : 94
  const avgMarks = student.riskLevel === 'high' ? 42 : student.riskLevel === 'medium' ? 61 : 79
  const feePaid = student.riskLevel === 'high' ? 40 : student.riskLevel === 'medium' ? 75 : 100

  const riskConfig = RISK_STYLES[student.riskLevel] || RISK_STYLES.low

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="sr-only">Student Details</SheetTitle>
          <SheetDescription className="sr-only">View detailed student information</SheetDescription>
        </SheetHeader>

        {/* Profile Card */}
        <div className="space-y-6 pb-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 text-emerald-700 dark:text-emerald-300 text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground">{fullName}</h3>
              <p className="text-sm text-muted-foreground">Admission No: {student.admissionNo}</p>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={student.status} />
                <RiskBadge level={student.riskLevel} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-500" />
              Contact Information
            </h4>
            <div className="grid gap-2.5">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{student.user.email}</span>
              </div>
              {student.user.phone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{student.user.phone}</span>
                </div>
              )}
              {student.address && (
                <div className="flex items-center gap-2.5 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{student.address}</span>
                </div>
              )}
              {student.bloodGroup && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Droplet className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{student.bloodGroup}</span>
                </div>
              )}
              {student.emergencyContact && (
                <div className="flex items-center gap-2.5 text-sm">
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Emergency: {student.emergencyContact}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Academic Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-teal-500" />
              Academic Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Class</p>
                <p className="text-sm font-medium text-foreground">{student.class?.name || 'Not Assigned'}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Section</p>
                <p className="text-sm font-medium text-foreground">{student.section?.name || 'Not Assigned'}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Gender</p>
                <p className="text-sm font-medium text-foreground">{student.gender || 'Not Specified'}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">DOB</p>
                <p className="text-sm font-medium text-foreground">
                  {student.dateOfBirth
                    ? new Date(student.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Not Set'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tabs: Attendance, Performance, Behavior, Fees */}
          <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-9">
              <TabsTrigger value="attendance" className="text-[11px]">Attendance</TabsTrigger>
              <TabsTrigger value="performance" className="text-[11px]">Academic</TabsTrigger>
              <TabsTrigger value="behavior" className="text-[11px]">Behavior</TabsTrigger>
              <TabsTrigger value="fees" className="text-[11px]">Fees</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Attendance Rate</span>
                <span className={`text-lg font-bold ${attendanceRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : attendanceRate >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {attendanceRate}%
                </span>
              </div>
              <Progress value={attendanceRate} className="h-2" />
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{Math.round(attendanceRate * 1.2)}</p>
                  <p className="text-[10px] text-muted-foreground">Present</p>
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{Math.round((100 - attendanceRate) * 1.2)}</p>
                  <p className="text-[10px] text-muted-foreground">Absent</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{Math.round(attendanceRate * 0.08)}</p>
                  <p className="text-[10px] text-muted-foreground">Late</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Marks</span>
                <span className={`text-lg font-bold ${avgMarks >= 75 ? 'text-emerald-600 dark:text-emerald-400' : avgMarks >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {avgMarks}%
                </span>
              </div>
              <Progress value={avgMarks} className="h-2" />
              <div className="space-y-2 mt-3">
                {['Mathematics', 'English', 'Science'].map((subject) => {
                  const mark = avgMarks + Math.round((Math.random() - 0.5) * 20)
                  const clamped = Math.max(0, Math.min(100, mark))
                  return (
                    <div key={subject} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{subject}</span>
                      <span className="font-medium">{clamped}%</span>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="mt-4 space-y-2.5">
              {student.riskLevel === 'high' ? (
                <>
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">Disruptive behavior in class</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Reported 3 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Late submission of assignments</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Reported 1 week ago</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <div className="text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400" />
                    <p className="text-sm">No behavior issues recorded</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="fees" className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Status</span>
                <span className={`text-sm font-semibold ${feePaid === 100 ? 'text-emerald-600 dark:text-emerald-400' : feePaid >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {feePaid === 100 ? 'Fully Paid' : feePaid >= 50 ? 'Partial' : 'Overdue'}
                </span>
              </div>
              <Progress value={feePaid} className="h-2" />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2.5 text-center">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{Math.round(feePaid * 150).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Paid</p>
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2.5 text-center">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">
                    ₹{Math.round((100 - feePaid) * 150).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Risk Assessment */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              Risk Assessment
            </h4>
            <div className={`rounded-lg border p-4 ${riskConfig.bg} border-current/10`}>
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${riskConfig.dot} animate-pulse`} />
                <div>
                  <p className={`text-sm font-semibold ${riskConfig.text}`}>
                    {student.riskLevel.charAt(0).toUpperCase() + student.riskLevel.slice(1)} Risk
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {student.riskLevel === 'high'
                      ? 'Requires immediate intervention and support'
                      : student.riskLevel === 'medium'
                        ? 'Monitor closely and provide additional support'
                        : 'On track — no concerns identified'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Parent Info */}
          {student.parent && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" />
                  Parent / Guardian
                </h4>
                <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                  <p className="text-sm font-medium text-foreground">{student.parent.name}</p>
                  {student.parent.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> {student.parent.phone}
                    </p>
                  )}
                  {student.parent.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> {student.parent.email}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Add Student Dialog ──────────────────────────────────────────
function AddStudentDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const queryClient = useQueryClient()
  const { user, tenantCode } = useAppStore()

  const form = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      admissionNo: '',
      classId: '',
      sectionId: '',
      gender: '',
      dateOfBirth: '',
      address: '',
      bloodGroup: '',
      emergencyContact: '',
      parentId: '',
      phone: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: AddStudentFormValues) => {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, schoolId: user?.schoolId || '', schoolCode: tenantCode }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create student')
      return json
    },
    onSuccess: () => {
      toast.success('Student created successfully', {
        description: 'The new student has been added to the system.',
      })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      form.reset()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error: Error) => {
      toast.error('Failed to create student', {
        description: error.message,
      })
    },
  })

  const onSubmit = (data: AddStudentFormValues) => {
    createMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-500" />
            Add New Student
          </DialogTitle>
          <DialogDescription>
            Fill in the student details to create a new admission record.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="student@school.com" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="admissionNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Admission No *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. ADM-2024-001" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Blood Group</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Emergency Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter full address" className="min-h-[60px] resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-1.5" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Add Student
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── Sort type ───────────────────────────────────────────────────
type SortField = 'admissionNo' | 'firstName' | 'status' | 'riskLevel'
type SortDir = 'asc' | 'desc'

// ── Main Component ──────────────────────────────────────────────
export function StudentsModule() {
  const { user, tenantCode } = useAppStore()
  const schoolId = user?.schoolId || ''

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('admissionNo')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const limit = 10

  // Build query params
  const queryParams = new URLSearchParams()
  if (schoolId) queryParams.set('schoolId', schoolId)
  if (tenantCode) queryParams.set('schoolCode', tenantCode)
  if (search) queryParams.set('search', search)
  if (classFilter && classFilter !== 'all') queryParams.set('classId', classFilter)
  if (statusFilter && statusFilter !== 'all') queryParams.set('status', statusFilter)
  if (riskFilter && riskFilter !== 'all') queryParams.set('riskLevel', riskFilter)
  queryParams.set('page', String(page))
  queryParams.set('limit', String(limit))

  const { data, isLoading, isError, error, refetch } = useQuery<StudentsResponse>({
    queryKey: ['students', schoolId, search, classFilter, statusFilter, riskFilter, page, limit],
    queryFn: async () => {
      const res = await fetch(`/api/students?${queryParams.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch students')
      return res.json()
    },
    staleTime: 15_000,
  })

  const students = data?.data.students || []
  const pagination = data?.data.pagination

  const handleSort = useCallback((field: SortField) => {
    setSortDir((prev) => (sortField === field && prev === 'asc' ? 'desc' : 'asc'))
    setSortField(field)
  }, [sortField])

  // Client-side sort
  const sortedStudents = [...students].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortField === 'admissionNo') return dir * a.admissionNo.localeCompare(b.admissionNo)
    if (sortField === 'firstName') return dir * a.firstName.localeCompare(b.firstName)
    if (sortField === 'status') return dir * a.status.localeCompare(b.status)
    if (sortField === 'riskLevel') return dir * a.riskLevel.localeCompare(b.riskLevel)
    return 0
  })

  // Stats computation
  const totalStudents = pagination?.total ?? 0
  const activeStudents = students.filter((s) => s.status === 'active').length
  const atRiskStudents = students.filter((s) => s.riskLevel === 'high').length
  const newThisMonth = students.filter((s) => {
    const created = new Date(s.createdAt)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length

  const viewStudent = (student: Student) => {
    setSelectedStudent(student)
    setDetailOpen(true)
  }

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton />
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
        <h3 className="text-lg font-semibold">Failed to load students</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          {(error as Error)?.message || 'Something went wrong. Please try again later.'}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
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
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-500" />
            Student Intelligence
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered student management, analytics, and risk assessment
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Add Student
        </Button>
      </motion.div>

      {/* ── Search & Filters ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, admission no, email..."
            className="pl-8 h-9 text-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-[140px] text-sm">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            <SelectItem value="class-1">Class 1</SelectItem>
            <SelectItem value="class-2">Class 2</SelectItem>
            <SelectItem value="class-3">Class 3</SelectItem>
            <SelectItem value="class-4">Class 4</SelectItem>
            <SelectItem value="class-5">Class 5</SelectItem>
            <SelectItem value="class-6">Class 6</SelectItem>
            <SelectItem value="class-7">Class 7</SelectItem>
            <SelectItem value="class-8">Class 8</SelectItem>
            <SelectItem value="class-9">Class 9</SelectItem>
            <SelectItem value="class-10">Class 10</SelectItem>
            <SelectItem value="class-11">Class 11</SelectItem>
            <SelectItem value="class-12">Class 12</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-[140px] text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="graduated">Graduated</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="transferred">Transferred</SelectItem>
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-[140px] text-sm">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={GraduationCap}
          trend="up"
          trendLabel="+8% from last month"
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Active Students"
          value={activeStudents}
          icon={UserCheck}
          trend="neutral"
          trendLabel="Currently enrolled"
          iconBg="bg-teal-50 dark:bg-teal-950/30"
          iconColor="text-teal-600 dark:text-teal-400"
        />
        <StatCard
          title="At Risk"
          value={atRiskStudents}
          icon={AlertTriangle}
          trend={atRiskStudents > 0 ? 'down' : 'neutral'}
          trendLabel={atRiskStudents > 0 ? 'Need intervention' : 'No risk students'}
          iconBg="bg-red-50 dark:bg-red-950/30"
          iconColor="text-red-600 dark:text-red-400"
        />
        <StatCard
          title="New This Month"
          value={newThisMonth}
          icon={UserPlus}
          trend="up"
          trendLabel="New admissions"
          iconBg="bg-amber-50 dark:bg-amber-950/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* ── Data Table ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => handleSort('admissionNo')}
                      >
                        Admission No
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => handleSort('firstName')}
                      >
                        Name
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Class</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Section</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Gender</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => handleSort('riskLevel')}
                      >
                        Risk Level
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.length > 0 ? (
                    sortedStudents.map((student) => {
                      const initials = `${student.firstName[0]}${student.lastName[0]}`
                      return (
                        <TableRow key={student.id} className="group">
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {student.admissionNo}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-7 w-7 rounded-md border border-border/50">
                                <AvatarFallback className="rounded-md bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {student.firstName} {student.lastName}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {student.user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {student.class?.name || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {student.section?.name || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm capitalize">
                            {student.gender || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={student.status} />
                          </TableCell>
                          <TableCell>
                            <RiskBadge level={student.riskLevel} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => viewStudent(student)}
                              >
                                <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-emerald-600" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-amber-600" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-48">
                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                          <GraduationCap className="h-10 w-10 opacity-40" />
                          <div className="text-center">
                            <p className="text-sm font-medium">No students found</p>
                            <p className="text-xs mt-1">
                              Try adjusting your search or filters, or add a new student.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearch('')
                              setClassFilter('all')
                              setStatusFilter('all')
                              setRiskFilter('all')
                              setPage(1)
                            }}
                            className="h-8 text-xs mt-1"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ── Pagination ── */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)} of{' '}
                  {pagination.total} students
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? 'default' : 'outline'}
                        size="icon"
                        className={`h-8 w-8 text-xs ${
                          pageNum === page
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : ''
                        }`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  {pagination.totalPages > 5 && (
                    <span className="text-xs text-muted-foreground px-1">...</span>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Add Student Dialog ── */}
      <AddStudentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => refetch()}
      />

      {/* ── Student Detail Sheet ── */}
      <StudentDetailSheet
        student={selectedStudent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </motion.div>
  )
}
