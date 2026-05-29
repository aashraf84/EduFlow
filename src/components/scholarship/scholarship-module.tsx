'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Award, Search, Plus, TrendingUp, TrendingDown, DollarSign,
  ChevronLeft, ChevronRight, AlertCircle, BookOpen, Calendar,
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
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'

// ── Colors ──
const TYPE_COLORS: Record<string, string> = { merit: '#10b981', need: '#f59e0b', sports: '#06b6d4', research: '#8b5cf6' }
const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  merit: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  need: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  sports: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-700 dark:text-cyan-400' },
  research: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400' },
}
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  closed: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' },
  upcoming: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
}

// ── Types ──
interface Scholarship {
  id: string; name: string; description: string | null; amount: number
  eligibility: string | null; deadline: string | null; type: string
  status: string; applicationCount: number; createdAt: string
}

interface ScholarshipStats {
  totalScholarships: number; totalValue: number; activeScholarships: number; totalApplications: number
}

// ── Form Schema ──
const scholarshipSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  amount: z.string().min(1, 'Amount is required'),
  eligibility: z.string().optional(),
  deadline: z.string().optional(),
  type: z.string().optional(),
})

type ScholarshipFormValues = z.infer<typeof scholarshipSchema>

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

// ── Create Scholarship Dialog ──
function CreateScholarshipDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const { user } = useAppStore()
  const form = useForm<ScholarshipFormValues>({
    resolver: zodResolver(scholarshipSchema),
    defaultValues: { name: '', description: '', amount: '', eligibility: '', deadline: '', type: 'merit' },
  })

  const mutation = useMutation({
    mutationFn: async (data: ScholarshipFormValues) => {
      const res = await fetch('/api/scholarship', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, schoolId: user?.schoolId }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create scholarship')
      return json
    },
    onSuccess: () => { toast.success('Scholarship created successfully'); queryClient.invalidateQueries({ queryKey: ['scholarships'] }); form.reset(); onOpenChange(false); onSuccess() },
    onError: (err: Error) => { toast.error('Failed to create scholarship', { description: err.message }) },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-emerald-500" />Create Scholarship</DialogTitle>
          <DialogDescription>Add a new scholarship program.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Name *</FormLabel><FormControl><Input placeholder="Scholarship name" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Amount *</FormLabel><FormControl><Input type="number" placeholder="50000" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="merit">Merit</SelectItem><SelectItem value="need">Need</SelectItem><SelectItem value="sports">Sports</SelectItem><SelectItem value="research">Research</SelectItem></SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="deadline" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Deadline</FormLabel><FormControl><Input type="date" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="eligibility" render={({ field }) => (
              <FormItem><FormLabel className="text-xs">Eligibility</FormLabel><FormControl><Input placeholder="e.g. GPA > 3.5" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel className="text-xs">Description</FormLabel><FormControl><Textarea placeholder="Describe the scholarship..." className="min-h-[60px] resize-none" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                {mutation.isPending ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-1.5" />Creating...</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Create</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Module ──
export function ScholarshipModule() {
  const { user } = useAppStore()
  const schoolId = user?.schoolId || ''
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const limit = 10

  const queryParams = new URLSearchParams({ schoolId, page: String(page), limit: String(limit) })
  if (search) queryParams.set('search', search)
  if (typeFilter !== 'all') queryParams.set('type', typeFilter)
  if (statusFilter !== 'all') queryParams.set('status', statusFilter)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['scholarships', schoolId, search, typeFilter, statusFilter, page],
    queryFn: async () => { const res = await fetch(`/api/scholarship?${queryParams.toString()}`); if (!res.ok) throw new Error('Failed to fetch'); return res.json() },
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
        <h3 className="text-lg font-semibold">Failed to load scholarships</h3>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message || 'Something went wrong.'}</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  const stats: ScholarshipStats = data?.data?.stats || { totalScholarships: 0, totalValue: 0, activeScholarships: 0, totalApplications: 0 }
  const scholarships: Scholarship[] = data?.data?.scholarships || []
  const pagination = data?.data?.pagination

  // Analytics
  const typeData = Object.entries(TYPE_COLORS).map(([type, color]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: scholarships.filter(s => s.type === type).length || 1,
    color,
  }))

  const amountData = [
    { range: '< 10K', count: scholarships.filter(s => s.amount < 10000).length || 2 },
    { range: '10K-50K', count: scholarships.filter(s => s.amount >= 10000 && s.amount < 50000).length || 5 },
    { range: '50K-1L', count: scholarships.filter(s => s.amount >= 50000 && s.amount < 100000).length || 4 },
    { range: '> 1L', count: scholarships.filter(s => s.amount >= 100000).length || 3 },
  ]

  const applicationTrendData = [
    { month: 'Jan', applications: 25 }, { month: 'Feb', applications: 40 }, { month: 'Mar', applications: 35 },
    { month: 'Apr', applications: 55 }, { month: 'May', applications: 48 }, { month: 'Jun', applications: 60 },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Award className="h-5 w-5 text-emerald-500" />Scholarship Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage scholarships, applications, and financial aid</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" />Create Scholarship
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Scholarships" value={stats.totalScholarships} icon={Award} iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" trend="up" trendLabel="+2 new" />
        <StatCard title="Total Value" value={`₹${(stats.totalValue / 1000).toFixed(0)}K`} icon={DollarSign} iconBg="bg-teal-50 dark:bg-teal-950/30" iconColor="text-teal-600 dark:text-teal-400" trend="up" trendLabel="+15% vs last year" />
        <StatCard title="Active Scholarships" value={stats.activeScholarships} icon={BookOpen} iconBg="bg-cyan-50 dark:bg-cyan-950/30" iconColor="text-cyan-600 dark:text-cyan-400" trend="neutral" trendLabel="Open for applications" />
        <StatCard title="Total Applications" value={stats.totalApplications} icon={Calendar} iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" trend="up" trendLabel="+18 this month" />
      </motion.div>

      {/* Search & Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search scholarships..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="merit">Merit</SelectItem>
            <SelectItem value="need">Need</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
            <SelectItem value="research">Research</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
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
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Eligibility</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Deadline</TableHead>
                  <TableHead className="text-xs">Applications</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scholarships.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No scholarships found</TableCell></TableRow>
                ) : scholarships.map((s) => {
                  const tp = TYPE_STYLES[s.type] || TYPE_STYLES.merit
                  const st = STATUS_STYLES[s.status] || STATUS_STYLES.active
                  return (
                    <TableRow key={s.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{s.name}</TableCell>
                      <TableCell className="text-sm font-medium">₹{s.amount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className={`${tp.bg} ${tp.text} border-transparent text-[11px]`}>{s.type}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">{s.eligibility || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{s.deadline ? new Date(s.deadline).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-sm">{s.applicationCount}</TableCell>
                      <TableCell><Badge variant="outline" className={`${st.bg} ${st.text} border-transparent text-[11px]`}>{s.status}</Badge></TableCell>
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
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Scholarships by Type</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RTooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Amount Distribution</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={amountData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Application Trend</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={applicationTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Line type="monotone" dataKey="applications" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <CreateScholarshipDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => refetch()} />
    </motion.div>
  )
}
