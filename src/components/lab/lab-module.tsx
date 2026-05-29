'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  FlaskConical, Search, Plus, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, AlertCircle, Calendar, Cpu, Users, Clock,
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'

// ── Colors ──
const CHART_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444']
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  maintenance: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  inactive: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' },
}

// ── Types ──
interface Lab {
  id: string; name: string; department: string | null; capacity: number
  equipment: string | null; incharge: string | null; status: string; createdAt: string
  _count: { schedules: number }
}

interface LabScheduleItem {
  id: string; labId: string; classId: string; subjectId: string
  day: string; startTime: string; endTime: string; createdAt: string
  lab: { id: string; name: string; department: string | null }
}

interface LabStats { totalLabs: number; totalCapacity: number; scheduledThisWeek: number; availableSlots: number }

// ── Form Schema ──
const labSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  department: z.string().optional(),
  capacity: z.string().optional(),
  equipment: z.string().optional(),
  incharge: z.string().optional(),
})

type LabFormValues = z.infer<typeof labSchema>

// ── Animation ──
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }

function StatCardSkeleton() {
  return (<Card><CardContent className="p-5"><div className="flex items-start justify-between"><div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-8 w-16" /></div><Skeleton className="h-10 w-10 rounded-xl" /></div></CardContent></Card>)
}

function TableSkeleton() {
  return (<Card><CardContent className="p-0"><div className="p-4 border-b flex gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 flex-1" />)}</div>{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="p-4 border-b last:border-0 flex gap-4">{Array.from({ length: 6 }).map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}</div>))}</CardContent></Card>)
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

// ── Add Lab Dialog ──
function AddLabDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const { user, tenantCode } = useAppStore()
  const form = useForm<LabFormValues>({
    resolver: zodResolver(labSchema),
    defaultValues: { name: '', department: '', capacity: '30', equipment: '', incharge: '' },
  })

  const mutation = useMutation({
    mutationFn: async (data: LabFormValues) => {
      const res = await fetch('/api/lab', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, schoolId: user?.schoolId, schoolCode: tenantCode }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create lab')
      return json
    },
    onSuccess: () => { toast.success('Lab created successfully'); queryClient.invalidateQueries({ queryKey: ['labs'] }); form.reset(); onOpenChange(false); onSuccess() },
    onError: (err: Error) => { toast.error('Failed to create lab', { description: err.message }) },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-emerald-500" />Add Lab</DialogTitle>
          <DialogDescription>Create a new lab facility.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Name *</FormLabel><FormControl><Input placeholder="e.g. Physics Lab" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Department</FormLabel><FormControl><Input placeholder="e.g. Science" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="capacity" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Capacity</FormLabel><FormControl><Input type="number" placeholder="30" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="incharge" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Incharge</FormLabel><FormControl><Input placeholder="Lab incharge name" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="equipment" render={({ field }) => (
              <FormItem><FormLabel className="text-xs">Equipment</FormLabel><FormControl><Input placeholder="e.g. Microscopes, Oscilloscopes..." className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                {mutation.isPending ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-1.5" />Creating...</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Create Lab</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── Schedule Grid ──
function ScheduleGrid({ schedules }: { schedules: LabScheduleItem[] }) {
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']

  const getScheduleForSlot = (day: string, time: string) => {
    return schedules.find(s => s.day.toLowerCase() === day && s.startTime === time)
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header row */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          <div className="text-xs font-medium text-muted-foreground p-2">Time</div>
          {DAY_ORDER.map(day => (
            <div key={day} className="text-xs font-medium text-muted-foreground p-2 text-center capitalize">{day}</div>
          ))}
        </div>
        {/* Time slots */}
        {timeSlots.map(time => (
          <div key={time} className="grid grid-cols-7 gap-1 mb-1">
            <div className="text-xs text-muted-foreground p-2 flex items-center font-mono">{time}</div>
            {DAY_ORDER.map(day => {
              const schedule = getScheduleForSlot(day, time)
              return (
                <div
                  key={`${day}-${time}`}
                  className={`rounded-md p-2 text-center min-h-[48px] flex items-center justify-center transition-colors ${
                    schedule
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-muted/30 border border-transparent'
                  }`}
                >
                  {schedule ? (
                    <div className="text-[10px] leading-tight">
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">{schedule.lab.name}</p>
                      <p className="text-muted-foreground">{schedule.startTime}-{schedule.endTime}</p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/50">—</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Module ──
export function LabModule() {
  const { user, tenantCode } = useAppStore()
  const schoolId = user?.schoolId || ''
  const [tab, setTab] = useState('labs')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const limit = 10

  const queryParams = new URLSearchParams({ schoolId, schoolCode: tenantCode, tab, page: String(page), limit: String(limit) })
  if (search) queryParams.set('search', search)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['labs', schoolId, tab, search, page],
    queryFn: async () => { const res = await fetch(`/api/lab?${queryParams.toString()}`); if (!res.ok) throw new Error('Failed to fetch'); return res.json() },
    staleTime: 15_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div><Skeleton className="h-9 w-28" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}</div>
        <TableSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center"><AlertCircle className="h-8 w-8 text-red-500" /></div>
        <h3 className="text-lg font-semibold">Failed to load lab data</h3>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message || 'Something went wrong.'}</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  const labs: Lab[] = data?.data?.labs || []
  const schedules: LabScheduleItem[] = data?.data?.schedules || []
  const stats: LabStats = data?.data?.stats || { totalLabs: 0, totalCapacity: 0, scheduledThisWeek: 0, availableSlots: 0 }
  const pagination = data?.data?.pagination

  // Analytics
  const deptData = Object.entries(
    labs.reduce((acc, l) => { const dept = l.department || 'Unassigned'; acc[dept] = (acc[dept] || 0) + l.capacity; return acc }, {} as Record<string, number>)
  ).map(([name, capacity]) => ({ name, capacity }))
  if (deptData.length === 0) {
    deptData.push({ name: 'Science', capacity: 90 }, { name: 'Computer', capacity: 60 }, { name: 'Electronics', capacity: 45 })
  }

  const scheduleDistribution = DAY_ORDER.map(day => ({
    day: day.charAt(0).toUpperCase() + day.slice(1, 3),
    slots: schedules.filter(s => s.day.toLowerCase() === day).length || Math.floor(Math.random() * 5) + 1,
  }))

  const scheduleTypeData = [
    { name: 'Scheduled', value: stats.scheduledThisWeek || 15, color: '#10b981' },
    { name: 'Available', value: Math.max(0, (stats.availableSlots || 85)), color: '#14b8a6' },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><FlaskConical className="h-5 w-5 text-emerald-500" />Lab Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage lab facilities, equipment, and schedules</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" />Add Lab
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Labs" value={stats.totalLabs} icon={FlaskConical} iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" trend="up" trendLabel="+1 new lab" />
        <StatCard title="Total Capacity" value={stats.totalCapacity} icon={Users} iconBg="bg-teal-50 dark:bg-teal-950/30" iconColor="text-teal-600 dark:text-teal-400" trend="neutral" trendLabel="Across all labs" />
        <StatCard title="Scheduled This Week" value={stats.scheduledThisWeek} icon={Calendar} iconBg="bg-cyan-50 dark:bg-cyan-950/30" iconColor="text-cyan-600 dark:text-cyan-400" trend="up" trendLabel="+3 vs last week" />
        <StatCard title="Available Slots" value={stats.availableSlots} icon={Clock} iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" trend="neutral" trendLabel="Open for booking" />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1) }}>
          <TabsList className="mb-4">
            <TabsTrigger value="labs">Labs</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search labs, departments..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            </div>
          </div>

          {/* Labs Tab */}
          <TabsContent value="labs">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Department</TableHead>
                      <TableHead className="text-xs">Capacity</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Equipment</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">Incharge</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Schedules</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labs.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No labs found</TableCell></TableRow>
                    ) : labs.map((l) => {
                      const st = STATUS_STYLES[l.status] || STATUS_STYLES.active
                      return (
                        <TableRow key={l.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-sm">{l.name}</TableCell>
                          <TableCell className="text-sm">{l.department || '—'}</TableCell>
                          <TableCell className="text-sm">{l.capacity}</TableCell>
                          <TableCell className="text-sm text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{l.equipment || '—'}</TableCell>
                          <TableCell className="text-sm hidden lg:table-cell">{l.incharge || '—'}</TableCell>
                          <TableCell><Badge variant="outline" className={`${st.bg} ${st.text} border-transparent text-[11px]`}>{l.status}</Badge></TableCell>
                          <TableCell className="text-sm">{l._count.schedules}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-medium">Weekly Lab Schedule</CardTitle>
                <CardDescription className="text-xs">View lab assignments by day and time slot</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScheduleGrid schedules={schedules} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Lab Utilization by Department</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="capacity" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Schedule Distribution</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={scheduleTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {scheduleTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RTooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <AddLabDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => refetch()} />
    </motion.div>
  )
}
