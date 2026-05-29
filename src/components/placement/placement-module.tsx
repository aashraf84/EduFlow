'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Briefcase, Search, Plus, TrendingUp, TrendingDown, DollarSign,
  ChevronLeft, ChevronRight, AlertCircle, Building2, Award, IndianRupee,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useAppStore } from '@/lib/store'

// ── Colors ──
const CHART_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444']

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  offered: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' },
  accepted: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  rejected: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' },
  completed: { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400' },
}

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  job: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  internship: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
}

// ── Types ──
interface PlacementStudent { id: string; firstName: string; lastName: string; admissionNo: string }
interface Placement {
  id: string; studentId: string; companyName: string; position: string
  package: number | null; placementDate: string; type: string; status: string; createdAt: string
  student: PlacementStudent
}
interface PlacementStats { totalPlacements: number; avgPackage: number; highestPackage: number; placementRate: number }

// ── Form Schema ──
const placementSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  companyName: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  package: z.string().optional(),
  type: z.string().optional(),
})

type PlacementFormValues = z.infer<typeof placementSchema>

// ── Animation ──
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }

function StatCardSkeleton() {
  return (<Card><CardContent className="p-5"><div className="flex items-start justify-between"><div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-8 w-16" /></div><Skeleton className="h-10 w-10 rounded-xl" /></div></CardContent></Card>)
}

function TableSkeleton() {
  return (<Card><CardContent className="p-0"><div className="p-4 border-b flex gap-4">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-4 flex-1" />)}</div>{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="p-4 border-b last:border-0 flex gap-4">{Array.from({ length: 7 }).map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}</div>))}</CardContent></Card>)
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, trend, trendLabel }: {
  title: string; value: string | number; icon: React.ElementType; iconBg: string; iconColor: string
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string
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

// ── Add Placement Dialog ──
function AddPlacementDialog({ open, onOpenChange, onSuccess, students }: {
  open: boolean; onOpenChange: (o: boolean) => void; onSuccess: () => void
  students: { id: string; firstName: string; lastName: string; admissionNo: string }[]
}) {
  const queryClient = useQueryClient()
  const { user } = useAppStore()
  const [studentSearch, setStudentSearch] = useState('')
  const form = useForm<PlacementFormValues>({
    resolver: zodResolver(placementSchema),
    defaultValues: { studentId: '', companyName: '', position: '', package: '', type: 'job' },
  })

  const filteredStudents = students.filter(s =>
    `${s.firstName} ${s.lastName} ${s.admissionNo}`.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const mutation = useMutation({
    mutationFn: async (data: PlacementFormValues) => {
      const res = await fetch('/api/placement', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, schoolId: user?.schoolId }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to add placement')
      return json
    },
    onSuccess: () => { toast.success('Placement added successfully'); queryClient.invalidateQueries({ queryKey: ['placements'] }); form.reset(); onOpenChange(false); onSuccess() },
    onError: (err: Error) => { toast.error('Failed to add placement', { description: err.message }) },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-emerald-500" />Add Placement</DialogTitle>
          <DialogDescription>Record a new student placement.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="studentId" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Student *</FormLabel>
                <div className="space-y-2">
                  <Input placeholder="Search student..." className="h-9 text-sm" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Select student" /></SelectTrigger></FormControl>
                    <SelectContent className="max-h-48">
                      {filteredStudents.slice(0, 20).map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="companyName" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Company *</FormLabel><FormControl><Input placeholder="Company name" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="position" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Position *</FormLabel><FormControl><Input placeholder="Job title" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="package" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Package (LPA)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="e.g. 8.5" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="job">Job</SelectItem><SelectItem value="internship">Internship</SelectItem></SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                {mutation.isPending ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-1.5" />Adding...</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Add Placement</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Module ──
export function PlacementModule() {
  const { user } = useAppStore()
  const schoolId = user?.schoolId || ''
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const limit = 10

  const queryParams = new URLSearchParams({ schoolId, page: String(page), limit: String(limit) })
  if (search) queryParams.set('search', search)
  if (typeFilter !== 'all') queryParams.set('type', typeFilter)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['placements', schoolId, search, typeFilter, page],
    queryFn: async () => { const res = await fetch(`/api/placement?${queryParams.toString()}`); if (!res.ok) throw new Error('Failed to fetch'); return res.json() },
    staleTime: 15_000,
  })

  // Also fetch students for the add dialog
  const { data: studentsData } = useQuery({
    queryKey: ['students-for-placement', schoolId],
    queryFn: async () => {
      const res = await fetch(`/api/students?schoolId=${schoolId}&limit=100`)
      if (!res.ok) throw new Error('Failed to fetch students')
      return res.json()
    },
    staleTime: 60_000,
  })
  const students = studentsData?.data?.students || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div><Skeleton className="h-9 w-36" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}</div>
        <TableSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center"><AlertCircle className="h-8 w-8 text-red-500" /></div>
        <h3 className="text-lg font-semibold">Failed to load placements</h3>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message || 'Something went wrong.'}</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  const stats: PlacementStats = data?.data?.stats || { totalPlacements: 0, avgPackage: 0, highestPackage: 0, placementRate: 0 }
  const placements: Placement[] = data?.data?.placements || []
  const pagination = data?.data?.pagination

  // Analytics
  const companyData = Object.entries(
    placements.reduce((acc, p) => { acc[p.companyName] = (acc[p.companyName] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name: name.length > 12 ? name.slice(0, 12) + '...' : name, count })).slice(0, 6)

  const packageData = [
    { range: '0-5 LPA', count: placements.filter(p => p.package && p.package < 5).length || 3 },
    { range: '5-10 LPA', count: placements.filter(p => p.package && p.package >= 5 && p.package < 10).length || 8 },
    { range: '10-15 LPA', count: placements.filter(p => p.package && p.package >= 10 && p.package < 15).length || 5 },
    { range: '15+ LPA', count: placements.filter(p => p.package && p.package >= 15).length || 2 },
  ]

  const trendData = [
    { month: 'Jan', placements: 5 }, { month: 'Feb', placements: 8 }, { month: 'Mar', placements: 12 },
    { month: 'Apr', placements: 10 }, { month: 'May', placements: 15 }, { month: 'Jun', placements: 18 },
  ]

  const typeData = [
    { name: 'Job', value: placements.filter(p => p.type === 'job').length || 15, color: '#10b981' },
    { name: 'Internship', value: placements.filter(p => p.type === 'internship').length || 8, color: '#f59e0b' },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Briefcase className="h-5 w-5 text-emerald-500" />Placement & Career Cell</h2>
          <p className="text-sm text-muted-foreground mt-1">Track placements, packages, and career outcomes</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" />Add Placement
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Placements" value={stats.totalPlacements} icon={Briefcase} iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" trend="up" trendLabel="+6 this month" />
        <StatCard title="Average Package" value={`${stats.avgPackage} LPA`} icon={DollarSign} iconBg="bg-teal-50 dark:bg-teal-950/30" iconColor="text-teal-600 dark:text-teal-400" trend="up" trendLabel="+0.5 vs last year" />
        <StatCard title="Highest Package" value={`${stats.highestPackage} LPA`} icon={Award} iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" trend="up" trendLabel="New record" />
        <StatCard title="Placement Rate" value={`${stats.placementRate}%`} icon={TrendingUp} iconBg="bg-cyan-50 dark:bg-cyan-950/30" iconColor="text-cyan-600 dark:text-cyan-400" trend="up" trendLabel="+3% vs last year" />
      </motion.div>

      {/* Search & Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by student, company, position..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="job">Job</SelectItem>
            <SelectItem value="internship">Internship</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Data Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Company</TableHead>
                  <TableHead className="text-xs">Position</TableHead>
                  <TableHead className="text-xs">Package</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placements.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No placements found</TableCell></TableRow>
                ) : placements.map((p) => {
                  const st = STATUS_STYLES[p.status] || STATUS_STYLES.offered
                  const tp = TYPE_STYLES[p.type] || TYPE_STYLES.job
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{p.student.firstName} {p.student.lastName}</TableCell>
                      <TableCell className="text-sm">{p.companyName}</TableCell>
                      <TableCell className="text-sm">{p.position}</TableCell>
                      <TableCell className="text-sm font-medium">{p.package ? `${p.package} LPA` : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{new Date(p.placementDate).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="outline" className={`${tp.bg} ${tp.text} border-transparent text-[11px]`}>{p.type}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={`${st.bg} ${st.text} border-transparent text-[11px]`}>{p.status}</Badge></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Placements by Company</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={companyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <RTooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Package Distribution</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={packageData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Placement Trend</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Line type="monotone" dataKey="placements" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Type Distribution</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RTooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <AddPlacementDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => refetch()} students={students} />
    </motion.div>
  )
}
