'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Users,
  Search,
  UserPlus,
  UserCheck,
  Clock,
  Star,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  X,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  GraduationCap,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ClipboardCheck,
  Briefcase,
  Award,
  BarChart3,
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
import { useAppStore } from '@/lib/store'

// ── Color palette ───────────────────────────────────────────────
const TEACHER_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  inactive: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
  on_leave: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  resigned: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' },
}

// ── Types ───────────────────────────────────────────────────────
interface TeacherUser {
  email: string
  phone: string | null
  avatar: string | null
  status: string
}

interface TeacherSubject {
  id: string
  subject: {
    id: string
    name: string
    code: string | null
  }
  class: {
    id: string
    name: string
  } | null
}

interface ClassTeacherOf {
  id: string
  name: string
}

interface Teacher {
  id: string
  schoolId: string
  userId: string
  employeeId: string
  firstName: string
  lastName: string
  qualification: string | null
  specialization: string | null
  dateOfJoining: string
  salary: number | null
  phone: string | null
  address: string | null
  status: string
  performanceRating: number | null
  createdAt: string
  updatedAt: string
  user: TeacherUser
  subjects: TeacherSubject[]
  classTeacherOf: ClassTeacherOf | null
}

interface TeachersResponse {
  success: boolean
  data: {
    teachers: Teacher[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

// ── Form Schema ─────────────────────────────────────────────────
const addTeacherSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  salary: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

type AddTeacherFormValues = z.infer<typeof addTeacherSchema>

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

// ── Star Rating ─────────────────────────────────────────────────
function StarRating({ rating }: { rating: number | null }) {
  if (rating === null || rating === undefined) {
    return <span className="text-xs text-muted-foreground">Not rated</span>
  }
  const clamped = Math.max(0, Math.min(5, rating))
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.round(clamped)
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-200 dark:text-slate-700'
          }`}
        />
      ))}
      <span className="text-[11px] text-muted-foreground ml-1">{clamped.toFixed(1)}</span>
    </div>
  )
}

// ── Status Badge ────────────────────────────────────────────────
function TeacherStatusBadge({ status }: { status: string }) {
  const style = TEACHER_STATUS_STYLES[status] || TEACHER_STATUS_STYLES.active
  const label = status === 'on_leave' ? 'On Leave' : status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <Badge variant="outline" className={`${style.bg} ${style.text} border-transparent text-[11px]`}>
      {label}
    </Badge>
  )
}

// ── Teacher Detail View ─────────────────────────────────────────
function TeacherDetailSheet({
  teacher,
  open,
  onOpenChange,
}: {
  teacher: Teacher | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!teacher) return null

  const initials = `${teacher.firstName[0]}${teacher.lastName[0]}`
  const fullName = `${teacher.firstName} ${teacher.lastName}`

  // Simulated detail data
  const attendanceRate = 92
  const daysPresent = Math.round(attendanceRate * 2.2)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="sr-only">Teacher Details</SheetTitle>
          <SheetDescription className="sr-only">View detailed teacher information</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Profile Card */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900 dark:to-emerald-900 text-teal-700 dark:text-teal-300 text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground">{fullName}</h3>
              <p className="text-sm text-muted-foreground">Employee ID: {teacher.employeeId}</p>
              <div className="flex items-center gap-2 mt-2">
                <TeacherStatusBadge status={teacher.status} />
                {teacher.specialization && (
                  <Badge variant="outline" className="bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-transparent text-[11px]">
                    {teacher.specialization}
                  </Badge>
                )}
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
                <span className="text-muted-foreground">{teacher.user.email}</span>
              </div>
              {(teacher.phone || teacher.user.phone) && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{teacher.phone || teacher.user.phone}</span>
                </div>
              )}
              {teacher.address && (
                <div className="flex items-center gap-2.5 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{teacher.address}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Professional Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-teal-500" />
              Professional Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Qualification</p>
                <p className="text-sm font-medium text-foreground">{teacher.qualification || 'Not Set'}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Specialization</p>
                <p className="text-sm font-medium text-foreground">{teacher.specialization || 'Not Set'}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Date of Joining</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(teacher.dateOfJoining).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Salary</p>
                <p className="text-sm font-medium text-foreground">
                  {teacher.salary
                    ? new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0,
                      }).format(teacher.salary)
                    : 'Not Set'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Class Teacher */}
          {teacher.classTeacherOf && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-amber-500" />
                  Class Teacher Of
                </h4>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {teacher.classTeacherOf.name}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Tabs: Subjects, Attendance, Timetable, Performance */}
          <Tabs defaultValue="subjects" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-9">
              <TabsTrigger value="subjects" className="text-[11px]">Subjects</TabsTrigger>
              <TabsTrigger value="attendance" className="text-[11px]">Attendance</TabsTrigger>
              <TabsTrigger value="timetable" className="text-[11px]">Timetable</TabsTrigger>
              <TabsTrigger value="performance" className="text-[11px]">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="subjects" className="mt-4 space-y-2.5">
              {teacher.subjects && teacher.subjects.length > 0 ? (
                teacher.subjects.map((ts) => (
                  <div
                    key={ts.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{ts.subject.name}</p>
                        {ts.subject.code && (
                          <p className="text-[11px] text-muted-foreground">{ts.subject.code}</p>
                        )}
                      </div>
                    </div>
                    {ts.class && (
                      <Badge variant="outline" className="text-[10px]">
                        {ts.class.name}
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <div className="text-center space-y-2">
                    <BookOpen className="h-8 w-8 mx-auto opacity-40" />
                    <p className="text-sm">No subjects assigned yet</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="attendance" className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Attendance Rate</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {attendanceRate}%
                </span>
              </div>
              <Progress value={attendanceRate} className="h-2" />
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{daysPresent}</p>
                  <p className="text-[10px] text-muted-foreground">Present</p>
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{220 - daysPresent}</p>
                  <p className="text-[10px] text-muted-foreground">Absent</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2.5 text-center">
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{Math.round(attendanceRate * 0.05)}</p>
                  <p className="text-[10px] text-muted-foreground">Late</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timetable" className="mt-4 space-y-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                const periods = [
                  { time: '8:00 - 8:45', subject: 'Mathematics', class: 'Class 10A' },
                  { time: '9:00 - 9:45', subject: 'Mathematics', class: 'Class 9B' },
                  { time: '10:00 - 10:45', subject: 'Free Period', class: '' },
                ]
                return (
                  <div key={day} className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs font-semibold text-foreground mb-2">{day}</p>
                    <div className="space-y-1.5">
                      {periods.map((period, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground w-20">{period.time}</span>
                          <span className="font-medium text-foreground">{period.subject}</span>
                          {period.class && (
                            <Badge variant="outline" className="text-[9px] h-4 ml-auto">
                              {period.class}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </TabsContent>

            <TabsContent value="performance" className="mt-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overall Rating</span>
                  <StarRating rating={teacher.performanceRating} />
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: 'Teaching Quality', value: teacher.performanceRating ? Math.min(100, teacher.performanceRating * 20 + 5) : 70 },
                    { label: 'Student Engagement', value: teacher.performanceRating ? Math.min(100, teacher.performanceRating * 18 + 10) : 65 },
                    { label: 'Punctuality', value: 92 },
                    { label: 'Communication', value: teacher.performanceRating ? Math.min(100, teacher.performanceRating * 19) : 75 },
                  ].map((metric) => (
                    <div key={metric.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{metric.label}</span>
                        <span className="font-medium">{Math.round(metric.value)}%</span>
                      </div>
                      <Progress value={metric.value} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Add Teacher Dialog ──────────────────────────────────────────
function AddTeacherDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const queryClient = useQueryClient()
  const { user } = useAppStore()

  const form = useForm<AddTeacherFormValues>({
    resolver: zodResolver(addTeacherSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      employeeId: '',
      qualification: '',
      specialization: '',
      salary: '',
      phone: '',
      address: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: AddTeacherFormValues) => {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, schoolId: user?.schoolId || '' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create teacher')
      return json
    },
    onSuccess: () => {
      toast.success('Teacher created successfully', {
        description: 'The new teacher has been added to the system.',
      })
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      form.reset()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error: Error) => {
      toast.error('Failed to create teacher', {
        description: error.message,
      })
    },
  })

  const onSubmit = (data: AddTeacherFormValues) => {
    createMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal-500" />
            Add New Teacher
          </DialogTitle>
          <DialogDescription>
            Fill in the teacher details to create a new staff record.
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
                      <Input type="email" placeholder="teacher@school.com" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Employee ID *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. EMP-2024-001" className="h-9" {...field} />
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
                name="qualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Qualification</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select qualification" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="B.Ed">B.Ed</SelectItem>
                        <SelectItem value="M.Ed">M.Ed</SelectItem>
                        <SelectItem value="B.Sc">B.Sc</SelectItem>
                        <SelectItem value="M.Sc">M.Sc</SelectItem>
                        <SelectItem value="B.A">B.A</SelectItem>
                        <SelectItem value="M.A">M.A</SelectItem>
                        <SelectItem value="Ph.D">Ph.D</SelectItem>
                        <SelectItem value="B.Tech">B.Tech</SelectItem>
                        <SelectItem value="M.Tech">M.Tech</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Specialization</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Social Studies">Social Studies</SelectItem>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Physical Education">Physical Education</SelectItem>
                        <SelectItem value="Arts">Arts</SelectItem>
                        <SelectItem value="Music">Music</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Monthly Salary (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 50000" className="h-9" {...field} />
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
                className="h-9 bg-teal-600 hover:bg-teal-700 text-white"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-1.5" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Add Teacher
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
type SortField = 'employeeId' | 'firstName' | 'salary' | 'status' | 'performanceRating'
type SortDir = 'asc' | 'desc'

// ── Main Component ──────────────────────────────────────────────
export function TeachersModule() {
  const { user } = useAppStore()
  const schoolId = user?.schoolId || ''

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [specializationFilter, setSpecializationFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('employeeId')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const limit = 10

  // Build query params
  const queryParams = new URLSearchParams()
  if (schoolId) queryParams.set('schoolId', schoolId)
  if (search) queryParams.set('search', search)
  if (statusFilter && statusFilter !== 'all') queryParams.set('status', statusFilter)
  if (specializationFilter && specializationFilter !== 'all') queryParams.set('specialization', specializationFilter)
  queryParams.set('page', String(page))
  queryParams.set('limit', String(limit))

  const { data, isLoading, isError, error, refetch } = useQuery<TeachersResponse>({
    queryKey: ['teachers', schoolId, search, statusFilter, specializationFilter, page, limit],
    queryFn: async () => {
      const res = await fetch(`/api/teachers?${queryParams.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch teachers')
      return res.json()
    },
    staleTime: 15_000,
  })

  const teachers = data?.data.teachers || []
  const pagination = data?.data.pagination

  const handleSort = useCallback((field: SortField) => {
    setSortDir((prev) => (sortField === field && prev === 'asc' ? 'desc' : 'asc'))
    setSortField(field)
  }, [sortField])

  // Client-side sort
  const sortedTeachers = [...teachers].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortField === 'employeeId') return dir * a.employeeId.localeCompare(b.employeeId)
    if (sortField === 'firstName') return dir * a.firstName.localeCompare(b.firstName)
    if (sortField === 'salary') return dir * ((a.salary || 0) - (b.salary || 0))
    if (sortField === 'status') return dir * a.status.localeCompare(b.status)
    if (sortField === 'performanceRating') return dir * ((a.performanceRating || 0) - (b.performanceRating || 0))
    return 0
  })

  // Stats computation
  const totalTeachers = pagination?.total ?? 0
  const activeTeachers = teachers.filter((t) => t.status === 'active').length
  const onLeave = teachers.filter((t) => t.status === 'on_leave').length
  const avgRating = teachers.length > 0
    ? (teachers.reduce((sum, t) => sum + (t.performanceRating || 0), 0) / teachers.filter((t) => t.performanceRating).length || 0)
    : 0

  const viewTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setDetailOpen(true)
  }

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <Skeleton className="h-9 w-36" />
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
        <h3 className="text-lg font-semibold">Failed to load teachers</h3>
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
            <Users className="h-5 w-5 text-teal-500" />
            Teacher Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage faculty, track performance, and coordinate teaching assignments
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="h-9 bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Add Teacher
        </Button>
      </motion.div>

      {/* ── Search & Filters ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, employee ID, email..."
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
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-[150px] text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="resigned">Resigned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={specializationFilter} onValueChange={(v) => { setSpecializationFilter(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-[170px] text-sm">
            <SelectValue placeholder="Specialization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specializations</SelectItem>
            <SelectItem value="Mathematics">Mathematics</SelectItem>
            <SelectItem value="Science">Science</SelectItem>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="Hindi">Hindi</SelectItem>
            <SelectItem value="Social Studies">Social Studies</SelectItem>
            <SelectItem value="Computer Science">Computer Science</SelectItem>
            <SelectItem value="Physical Education">Physical Education</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Teachers"
          value={totalTeachers}
          icon={Users}
          trend="up"
          trendLabel="+3% from last month"
          iconBg="bg-teal-50 dark:bg-teal-950/30"
          iconColor="text-teal-600 dark:text-teal-400"
        />
        <StatCard
          title="Active Teachers"
          value={activeTeachers}
          icon={UserCheck}
          trend="neutral"
          trendLabel="Currently teaching"
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="On Leave"
          value={onLeave}
          icon={Clock}
          trend="neutral"
          trendLabel={onLeave > 0 ? 'Currently on leave' : 'No one on leave'}
          iconBg="bg-amber-50 dark:bg-amber-950/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          title="Avg. Rating"
          value={avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}
          icon={Star}
          trend={avgRating >= 4 ? 'up' : avgRating >= 3 ? 'neutral' : 'down'}
          trendLabel={avgRating > 0 ? `Out of 5.0` : 'No ratings yet'}
          iconBg="bg-violet-50 dark:bg-violet-950/30"
          iconColor="text-violet-600 dark:text-violet-400"
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
                        onClick={() => handleSort('employeeId')}
                      >
                        Employee ID
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
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Qualification</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Specialization</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => handleSort('salary')}
                      >
                        Salary
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
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
                        onClick={() => handleSort('performanceRating')}
                      >
                        Rating
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTeachers.length > 0 ? (
                    sortedTeachers.map((teacher) => {
                      const initials = `${teacher.firstName[0]}${teacher.lastName[0]}`
                      return (
                        <TableRow key={teacher.id} className="group">
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {teacher.employeeId}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-7 w-7 rounded-md border border-border/50">
                                <AvatarFallback className="rounded-md bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950 dark:to-emerald-950 text-teal-700 dark:text-teal-400 text-[10px] font-semibold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {teacher.firstName} {teacher.lastName}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {teacher.user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {teacher.qualification || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {teacher.specialization ? (
                              <Badge variant="outline" className="text-[10px] bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-transparent">
                                {teacher.specialization}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {teacher.salary ? formatCurrency(teacher.salary) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <TeacherStatusBadge status={teacher.status} />
                          </TableCell>
                          <TableCell>
                            <StarRating rating={teacher.performanceRating} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => viewTeacher(teacher)}
                              >
                                <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-teal-600" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-amber-600" />
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
                          <Users className="h-10 w-10 opacity-40" />
                          <div className="text-center">
                            <p className="text-sm font-medium">No teachers found</p>
                            <p className="text-xs mt-1">
                              Try adjusting your search or filters, or add a new teacher.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearch('')
                              setStatusFilter('all')
                              setSpecializationFilter('all')
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
                  {pagination.total} teachers
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
                            ? 'bg-teal-600 hover:bg-teal-700 text-white'
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

      {/* ── Add Teacher Dialog ── */}
      <AddTeacherDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => refetch()}
      />

      {/* ── Teacher Detail Sheet ── */}
      <TeacherDetailSheet
        teacher={selectedTeacher}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </motion.div>
  )
}
