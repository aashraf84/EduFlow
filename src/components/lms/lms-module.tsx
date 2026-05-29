'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  BookOpen, Search, Plus, Users, TrendingUp, TrendingDown, GraduationCap,
  ChevronLeft, ChevronRight, Video, FileText, HelpCircle, ArrowUpDown,
  AlertCircle, Play, CheckCircle2, Clock,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'

// ── Colors ──
const CHART_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444']
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
  published: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  archived: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  active: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  completed: { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400' },
  dropped: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' },
}

// ── Types ──
interface Course {
  id: string; title: string; code: string | null; description: string | null
  instructor: string | null; status: string; duration: number | null; createdAt: string
  _count: { enrollments: number; materials: number }
  enrollments: { progress: number; status: string }[]
}

interface Enrollment {
  id: string; progress: number; enrolledAt: string; status: string
  course: { id: string; title: string; code: string | null; instructor: string | null }
  student: { id: string; firstName: string; lastName: string; admissionNo: string }
}

interface Material {
  id: string; title: string; type: string; order: number; duration: number | null; createdAt: string
  course: { id: string; title: string }
}

interface LmsStats {
  totalCourses: number; activeEnrollments: number; completionRate: number; avgProgress: number
}

// ── Form Schema ──
const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  instructor: z.string().optional(),
  status: z.string().optional(),
})

type CourseFormValues = z.infer<typeof courseSchema>

// ── Animation ──
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }

// ── Skeletons ──
function StatCardSkeleton() {
  return (
    <Card><CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-24" /></div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </CardContent></Card>
  )
}

function TableSkeleton() {
  return (
    <Card><CardContent className="p-0">
      <div className="p-4 border-b flex gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 flex-1" />)}</div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 border-b last:border-0 flex gap-4">{Array.from({ length: 6 }).map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}</div>
      ))}
    </CardContent></Card>
  )
}

// ── Stat Card ──
function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, iconBg, iconColor }: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string; iconBg: string; iconColor: string
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
              <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
              {trendLabel && (
                <div className="flex items-center gap-1">
                  {trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                  {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                  <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>{trendLabel}</span>
                </div>
              )}
              {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} transition-transform group-hover:scale-110`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Add Course Dialog ──
function AddCourseDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const { user } = useAppStore()
  const form = useForm<CourseFormValues>({ resolver: zodResolver(courseSchema), defaultValues: { title: '', code: '', description: '', instructor: '', status: 'draft' } })

  const mutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      const res = await fetch('/api/lms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, schoolId: user?.schoolId }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create course')
      return json
    },
    onSuccess: () => { toast.success('Course created successfully'); queryClient.invalidateQueries({ queryKey: ['lms'] }); form.reset(); onOpenChange(false); onSuccess() },
    onError: (err: Error) => { toast.error('Failed to create course', { description: err.message }) },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-500" />Create Course</DialogTitle>
          <DialogDescription>Add a new course to the learning management system.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Title *</FormLabel><FormControl><Input placeholder="Course title" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Code</FormLabel><FormControl><Input placeholder="e.g. CS101" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="instructor" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Instructor</FormLabel><FormControl><Input placeholder="Instructor name" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel className="text-xs">Description</FormLabel><FormControl><Textarea placeholder="Course description..." className="min-h-[60px] resize-none" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                {mutation.isPending ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-1.5" />Creating...</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Create Course</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Module ──
export function LmsModule() {
  const { user } = useAppStore()
  const schoolId = user?.schoolId || ''
  const [tab, setTab] = useState('courses')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const limit = 10

  const queryParams = new URLSearchParams({ schoolId, tab, page: String(page), limit: String(limit) })
  if (search) queryParams.set('search', search)
  if (statusFilter !== 'all') queryParams.set('status', statusFilter)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['lms', schoolId, tab, search, statusFilter, page],
    queryFn: async () => { const res = await fetch(`/api/lms?${queryParams.toString()}`); if (!res.ok) throw new Error('Failed to fetch'); return res.json() },
    staleTime: 15_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}</div>
        <TableSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center"><AlertCircle className="h-8 w-8 text-red-500" /></div>
        <h3 className="text-lg font-semibold">Failed to load LMS data</h3>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message || 'Something went wrong.'}</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  const stats: LmsStats = data?.data?.stats || { totalCourses: 0, activeEnrollments: 0, completionRate: 0, avgProgress: 0 }
  const courses: Course[] = data?.data?.courses || []
  const enrollments: Enrollment[] = data?.data?.enrollments || []
  const materials: Material[] = data?.data?.materials || []
  const pagination = data?.data?.pagination

  // Analytics data
  const enrollmentTrendData = [
    { month: 'Jan', enrollments: 12 }, { month: 'Feb', enrollments: 19 }, { month: 'Mar', enrollments: 15 },
    { month: 'Apr', enrollments: 25 }, { month: 'May', enrollments: 22 }, { month: 'Jun', enrollments: 30 },
  ]
  const popularityData = courses.slice(0, 6).map(c => ({ name: c.title.length > 15 ? c.title.slice(0, 15) + '...' : c.title, enrollments: c._count.enrollments }))
  const completionData = [
    { name: 'Completed', value: stats.completionRate, color: '#10b981' },
    { name: 'In Progress', value: 100 - stats.completionRate, color: '#14b8a6' },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><BookOpen className="h-5 w-5 text-emerald-500" />LMS / Online Learning</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage courses, enrollments, and learning materials</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" />Create Course
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Courses" value={stats.totalCourses} icon={BookOpen} iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" trend="up" trendLabel="+3 this month" />
        <StatCard title="Active Enrollments" value={stats.activeEnrollments} icon={Users} iconBg="bg-teal-50 dark:bg-teal-950/30" iconColor="text-teal-600 dark:text-teal-400" trend="up" trendLabel="+12 this week" />
        <StatCard title="Completion Rate" value={`${stats.completionRate}%`} icon={CheckCircle2} iconBg="bg-cyan-50 dark:bg-cyan-950/30" iconColor="text-cyan-600 dark:text-cyan-400" trend="up" trendLabel="+5% vs last month" />
        <StatCard title="Avg. Progress" value={`${stats.avgProgress}%`} icon={TrendingUp} iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" trend="neutral" trendLabel="Steady" />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1) }}>
          <TabsList className="mb-4">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Course</TableHead>
                      <TableHead className="text-xs">Code</TableHead>
                      <TableHead className="text-xs">Instructor</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Enrollments</TableHead>
                      <TableHead className="text-xs">Materials</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No courses found</TableCell></TableRow>
                    ) : courses.map((c) => {
                      const st = STATUS_STYLES[c.status] || STATUS_STYLES.draft
                      return (
                        <TableRow key={c.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-sm">{c.title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.code || '—'}</TableCell>
                          <TableCell className="text-sm">{c.instructor || '—'}</TableCell>
                          <TableCell><Badge variant="outline" className={`${st.bg} ${st.text} border-transparent text-[11px]`}>{c.status}</Badge></TableCell>
                          <TableCell className="text-sm">{c._count.enrollments}</TableCell>
                          <TableCell className="text-sm">{c._count.materials}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enrollments Tab */}
          <TabsContent value="enrollments">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Course</TableHead>
                      <TableHead className="text-xs">Progress</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No enrollments found</TableCell></TableRow>
                    ) : enrollments.map((e) => {
                      const st = STATUS_STYLES[e.status] || STATUS_STYLES.active
                      return (
                        <TableRow key={e.id} className="hover:bg-muted/30">
                          <TableCell className="text-sm font-medium">{e.student.firstName} {e.student.lastName}</TableCell>
                          <TableCell className="text-sm">{e.course.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={e.progress} className="h-2 flex-1" />
                              <span className="text-xs font-medium text-muted-foreground w-8">{Math.round(e.progress)}%</span>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className={`${st.bg} ${st.text} border-transparent text-[11px]`}>{e.status}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(e.enrolledAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Course</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No materials found</TableCell></TableRow>
                    ) : materials.map((m) => (
                      <TableRow key={m.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm font-medium">{m.title}</TableCell>
                        <TableCell className="text-sm">{m.course.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px] gap-1">
                            {m.type === 'video' && <Video className="h-3 w-3" />}
                            {m.type === 'document' && <FileText className="h-3 w-3" />}
                            {m.type === 'quiz' && <HelpCircle className="h-3 w-3" />}
                            {m.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.order}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {pagination.page} of {pagination.totalPages} · {pagination.total} results</p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Analytics */}
      <motion.div variants={itemVariants}>
        <h3 className="text-base font-semibold text-foreground mb-4">Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Enrollment Trend</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={enrollmentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Line type="monotone" dataKey="enrollments" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Course Popularity</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={popularityData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="enrollments" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Completion Rate</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={completionData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                    {completionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <AddCourseDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => refetch()} />
    </motion.div>
  )
}
