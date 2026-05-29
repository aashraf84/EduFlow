'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ClipboardList, Search, Plus, Users, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, XCircle, Clock, Eye,
  UserPlus, Mail, Phone, School,
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
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
const CHART_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  applied: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' },
  'under review': { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  accepted: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  rejected: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' },
  waitlisted: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400' },
}

// ── Types ──
interface Admission {
  id: string; applicantName: string; email: string; phone: string | null
  appliedClass: string | null; previousSchool: string | null; gpa: number | null
  status: string; applicationDate: string; reviewedBy: string | null; reviewDate: string | null
  remarks: string | null; createdAt: string
}

interface AdmissionStats {
  totalApplications: number; pendingReview: number; accepted: number; rejected: number
}

// ── Form Schema ──
const admissionSchema = z.object({
  applicantName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  appliedClass: z.string().optional(),
  previousSchool: z.string().optional(),
  gpa: z.string().optional(),
})

type AdmissionFormValues = z.infer<typeof admissionSchema>

// ── Animation ──
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }

function StatCardSkeleton() {
  return (<Card><CardContent className="p-5"><div className="flex items-start justify-between"><div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-8 w-16" /></div><Skeleton className="h-10 w-10 rounded-xl" /></div></CardContent></Card>)
}

function TableSkeleton() {
  return (<Card><CardContent className="p-0"><div className="p-4 border-b flex gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-4 flex-1" />)}</div>{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="p-4 border-b last:border-0 flex gap-4">{Array.from({ length: 8 }).map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}</div>))}</CardContent></Card>)
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

// ── New Application Dialog ──
function NewApplicationDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const { user, tenantCode } = useAppStore()
  const form = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: { applicantName: '', email: '', phone: '', appliedClass: '', previousSchool: '', gpa: '' },
  })

  const mutation = useMutation({
    mutationFn: async (data: AdmissionFormValues) => {
      const res = await fetch('/api/admission', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, schoolId: user?.schoolId, schoolCode: tenantCode }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to submit application')
      return json
    },
    onSuccess: () => { toast.success('Application submitted successfully'); queryClient.invalidateQueries({ queryKey: ['admissions'] }); form.reset(); onOpenChange(false); onSuccess() },
    onError: (err: Error) => { toast.error('Failed to submit application', { description: err.message }) },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-emerald-500" />New Application</DialogTitle>
          <DialogDescription>Submit a new admission application.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="applicantName" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Applicant Name *</FormLabel><FormControl><Input placeholder="Full name" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Email *</FormLabel><FormControl><Input type="email" placeholder="email@example.com" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Phone</FormLabel><FormControl><Input placeholder="+91 9876543210" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="appliedClass" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Applied Class</FormLabel><FormControl><Input placeholder="e.g. Grade 10" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="previousSchool" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Previous School</FormLabel><FormControl><Input placeholder="School name" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="gpa" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">GPA</FormLabel><FormControl><Input type="number" step="0.1" min="0" max="4" placeholder="3.5" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                {mutation.isPending ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-1.5" />Submitting...</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Submit Application</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── Status Action Button ──
function StatusActionButton({ id, newStatus, label, icon: Icon, className, onSuccess }: {
  id: string; newStatus: string; label: string; icon: React.ElementType; className: string; onSuccess: () => void
}) {
  const queryClient = useQueryClient()
  const { tenantCode } = useAppStore()
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admission', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: newStatus, schoolCode: tenantCode }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update')
      return json
    },
    onSuccess: () => { toast.success(`Application ${newStatus}`); queryClient.invalidateQueries({ queryKey: ['admissions'] }); onSuccess() },
    onError: (err: Error) => { toast.error(`Failed to ${newStatus} application`, { description: err.message }) },
  })

  return (
    <Button variant="ghost" size="sm" className={`h-7 text-[11px] ${className}`} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      <Icon className="h-3 w-3 mr-1" />{label}
    </Button>
  )
}

// ── Main Module ──
export function AdmissionModule() {
  const { user, tenantCode } = useAppStore()
  const schoolId = user?.schoolId || ''
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const limit = 10

  const queryParams = new URLSearchParams({ schoolId, schoolCode: tenantCode, page: String(page), limit: String(limit) })
  if (search) queryParams.set('search', search)
  if (statusFilter !== 'all') queryParams.set('status', statusFilter)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admissions', schoolId, search, statusFilter, page],
    queryFn: async () => { const res = await fetch(`/api/admission?${queryParams.toString()}`); if (!res.ok) throw new Error('Failed to fetch'); return res.json() },
    staleTime: 15_000,
  })

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
        <h3 className="text-lg font-semibold">Failed to load admissions</h3>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message || 'Something went wrong.'}</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  const stats: AdmissionStats = data?.data?.stats || { totalApplications: 0, pendingReview: 0, accepted: 0, rejected: 0 }
  const admissions: Admission[] = data?.data?.admissions || []
  const pagination = data?.data?.pagination

  // Analytics
  const statusData = [
    { name: 'Applied', value: stats.pendingReview, color: '#3b82f6' },
    { name: 'Accepted', value: stats.accepted, color: '#10b981' },
    { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
    { name: 'Waitlisted', value: Math.max(0, stats.totalApplications - stats.pendingReview - stats.accepted - stats.rejected), color: '#8b5cf6' },
  ].filter(d => d.value > 0)

  const monthlyData = [
    { month: 'Jan', applications: 8 }, { month: 'Feb', applications: 12 }, { month: 'Mar', applications: 15 },
    { month: 'Apr', applications: 20 }, { month: 'May', applications: 18 }, { month: 'Jun', applications: 25 },
  ]

  const gpaDistribution = [
    { range: '0-1.0', count: admissions.filter(a => a.gpa !== null && a.gpa < 1.0).length || 2 },
    { range: '1.0-2.0', count: admissions.filter(a => a.gpa !== null && a.gpa >= 1.0 && a.gpa < 2.0).length || 5 },
    { range: '2.0-3.0', count: admissions.filter(a => a.gpa !== null && a.gpa >= 2.0 && a.gpa < 3.0).length || 12 },
    { range: '3.0-4.0', count: admissions.filter(a => a.gpa !== null && a.gpa >= 3.0).length || 8 },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><ClipboardList className="h-5 w-5 text-emerald-500" />Admission Portal</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage applications, reviews, and admissions</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <UserPlus className="h-4 w-4 mr-1.5" />New Application
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Applications" value={stats.totalApplications} icon={ClipboardList} iconBg="bg-blue-50 dark:bg-blue-950/30" iconColor="text-blue-600 dark:text-blue-400" trend="up" trendLabel="+8 this week" />
        <StatCard title="Pending Review" value={stats.pendingReview} icon={Clock} iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" trend="neutral" trendLabel="Needs attention" />
        <StatCard title="Accepted" value={stats.accepted} icon={CheckCircle2} iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" trend="up" trendLabel="+5 this week" />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} iconBg="bg-red-50 dark:bg-red-950/30" iconColor="text-red-600 dark:text-red-400" trend="down" trendLabel="-2 vs last week" />
      </motion.div>

      {/* Search & Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by name, email, school..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="under review">Under Review</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="waitlisted">Waitlisted</SelectItem>
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
                  <TableHead className="text-xs">Applicant</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Phone</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Applied Class</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Previous School</TableHead>
                  <TableHead className="text-xs">GPA</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admissions.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No applications found</TableCell></TableRow>
                ) : admissions.map((a) => {
                  const st = STATUS_STYLES[a.status] || STATUS_STYLES.applied
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{a.applicantName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{a.phone || '—'}</TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">{a.appliedClass || '—'}</TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">{a.previousSchool || '—'}</TableCell>
                      <TableCell className="text-sm">{a.gpa !== null ? a.gpa.toFixed(1) : '—'}</TableCell>
                      <TableCell><Badge variant="outline" className={`${st.bg} ${st.text} border-transparent text-[11px]`}>{a.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{new Date(a.applicationDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {a.status === 'applied' && <StatusActionButton id={a.id} newStatus="under review" label="Review" icon={Eye} className="text-amber-600 hover:text-amber-700" onSuccess={() => refetch()} />}
                          {(a.status === 'applied' || a.status === 'under review') && (
                            <>
                              <StatusActionButton id={a.id} newStatus="accepted" label="Accept" icon={CheckCircle2} className="text-emerald-600 hover:text-emerald-700" onSuccess={() => refetch()} />
                              <StatusActionButton id={a.id} newStatus="rejected" label="Reject" icon={XCircle} className="text-red-600 hover:text-red-700" onSuccess={() => refetch()} />
                            </>
                          )}
                          {a.status === 'under review' && <StatusActionButton id={a.id} newStatus="waitlisted" label="Waitlist" icon={Clock} className="text-purple-600 hover:text-purple-700" onSuccess={() => refetch()} />}
                        </div>
                      </TableCell>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Applications by Status</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RTooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Monthly Applications</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="applications" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">GPA Distribution</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={gpaDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <NewApplicationDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => refetch()} />
    </motion.div>
  )
}
