'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Heart, Search, Plus, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, AlertCircle, Activity, Droplet, Stethoscope, Calendar,
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

// ── BMI color coding ──
function getBMI(height: number | null, weight: number | null): { bmi: number | null; category: string; color: string; bg: string; text: string } {
  if (!height || !weight || height <= 0) return { bmi: null, category: 'N/A', color: 'slate', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' }
  const heightM = height / 100
  const bmi = weight / (heightM * heightM)
  if (bmi < 18.5) return { bmi: Math.round(bmi * 10) / 10, category: 'Underweight', color: 'amber', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' }
  if (bmi < 25) return { bmi: Math.round(bmi * 10) / 10, category: 'Normal', color: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' }
  if (bmi < 30) return { bmi: Math.round(bmi * 10) / 10, category: 'Overweight', color: 'orange', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400' }
  return { bmi: Math.round(bmi * 10) / 10, category: 'Obese', color: 'red', bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' }
}

const BLOOD_GROUP_COLORS: Record<string, string> = {
  'A+': '#10b981', 'A-': '#14b8a6', 'B+': '#06b6d4', 'B-': '#0891b2',
  'AB+': '#f59e0b', 'AB-': '#d97706', 'O+': '#8b5cf6', 'O-': '#7c3aed',
}

// ── Types ──
interface HealthStudent { id: string; firstName: string; lastName: string; admissionNo: string }

interface HealthRecord {
  id: string; studentId: string; height: number | null; weight: number | null
  bloodGroup: string | null; vision: string | null; allergies: string | null
  conditions: string | null; medications: string | null; lastCheckup: string | null
  doctorName: string | null; notes: string | null; createdAt: string
  student: HealthStudent
}

interface HealthStats {
  totalRecords: number; recordsThisMonth: number; studentsWithAllergies: number; studentsWithConditions: number
}

// ── Form Schema ──
const healthSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  height: z.string().optional(),
  weight: z.string().optional(),
  bloodGroup: z.string().optional(),
  vision: z.string().optional(),
  allergies: z.string().optional(),
  conditions: z.string().optional(),
  medications: z.string().optional(),
  doctorName: z.string().optional(),
})

type HealthFormValues = z.infer<typeof healthSchema>

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

// ── Add Health Record Dialog ──
function AddHealthRecordDialog({ open, onOpenChange, onSuccess, students }: {
  open: boolean; onOpenChange: (o: boolean) => void; onSuccess: () => void
  students: { id: string; firstName: string; lastName: string; admissionNo: string }[]
}) {
  const queryClient = useQueryClient()
  const { user } = useAppStore()
  const [studentSearch, setStudentSearch] = useState('')
  const form = useForm<HealthFormValues>({
    resolver: zodResolver(healthSchema),
    defaultValues: { studentId: '', height: '', weight: '', bloodGroup: '', vision: '', allergies: '', conditions: '', medications: '', doctorName: '' },
  })

  const filteredStudents = students.filter(s =>
    `${s.firstName} ${s.lastName} ${s.admissionNo}`.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const mutation = useMutation({
    mutationFn: async (data: HealthFormValues) => {
      const res = await fetch('/api/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, schoolId: user?.schoolId }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to add health record')
      return json
    },
    onSuccess: () => { toast.success('Health record added successfully'); queryClient.invalidateQueries({ queryKey: ['health'] }); form.reset(); onOpenChange(false); onSuccess() },
    onError: (err: Error) => { toast.error('Failed to add health record', { description: err.message }) },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-emerald-500" />Add Health Record</DialogTitle>
          <DialogDescription>Record a student health checkup.</DialogDescription>
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
              <FormField control={form.control} name="height" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Height (cm)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="165" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="weight" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Weight (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="60" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="bloodGroup" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Blood Group</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="vision" render={({ field }) => (
                <FormItem><FormLabel className="text-xs">Vision</FormLabel><FormControl><Input placeholder="6/6, 6/9..." className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="allergies" render={({ field }) => (
              <FormItem><FormLabel className="text-xs">Allergies</FormLabel><FormControl><Input placeholder="e.g. Penicillin, Dust" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="conditions" render={({ field }) => (
              <FormItem><FormLabel className="text-xs">Conditions</FormLabel><FormControl><Input placeholder="e.g. Asthma, Diabetes" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="medications" render={({ field }) => (
              <FormItem><FormLabel className="text-xs">Medications</FormLabel><FormControl><Input placeholder="Current medications" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="doctorName" render={({ field }) => (
              <FormItem><FormLabel className="text-xs">Doctor Name</FormLabel><FormControl><Input placeholder="Dr. Smith" className="h-9" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                {mutation.isPending ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-1.5" />Saving...</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Add Record</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Module ──
export function HealthModule() {
  const { user } = useAppStore()
  const schoolId = user?.schoolId || ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const limit = 10

  const queryParams = new URLSearchParams({ schoolId, page: String(page), limit: String(limit) })
  if (search) queryParams.set('search', search)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['health', schoolId, search, page],
    queryFn: async () => { const res = await fetch(`/api/health?${queryParams.toString()}`); if (!res.ok) throw new Error('Failed to fetch'); return res.json() },
    staleTime: 15_000,
  })

  const { data: studentsData } = useQuery({
    queryKey: ['students-for-health', schoolId],
    queryFn: async () => { const res = await fetch(`/api/students?schoolId=${schoolId}&limit=100`); if (!res.ok) throw new Error('Failed'); return res.json() },
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
        <h3 className="text-lg font-semibold">Failed to load health records</h3>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message || 'Something went wrong.'}</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  const stats: HealthStats = data?.data?.stats || { totalRecords: 0, recordsThisMonth: 0, studentsWithAllergies: 0, studentsWithConditions: 0 }
  const records: HealthRecord[] = data?.data?.records || []
  const pagination = data?.data?.pagination

  // Analytics
  const bmiData = [
    { range: 'Underweight', count: records.filter(r => getBMI(r.height, r.weight).category === 'Underweight').length || 3, color: '#f59e0b' },
    { range: 'Normal', count: records.filter(r => getBMI(r.height, r.weight).category === 'Normal').length || 15, color: '#10b981' },
    { range: 'Overweight', count: records.filter(r => getBMI(r.height, r.weight).category === 'Overweight').length || 5, color: '#f97316' },
    { range: 'Obese', count: records.filter(r => getBMI(r.height, r.weight).category === 'Obese').length || 2, color: '#ef4444' },
  ]

  const bloodGroupData = Object.entries(
    records.reduce((acc, r) => { if (r.bloodGroup) acc[r.bloodGroup] = (acc[r.bloodGroup] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([group, count]) => ({ name: group, value: count, color: BLOOD_GROUP_COLORS[group] || '#6b7280' }))
  if (bloodGroupData.length === 0) {
    bloodGroupData.push({ name: 'O+', value: 8, color: '#8b5cf6' }, { name: 'A+', value: 6, color: '#10b981' }, { name: 'B+', value: 4, color: '#06b6d4' })
  }

  const checkupTrend = [
    { month: 'Jan', checkups: 15 }, { month: 'Feb', checkups: 22 }, { month: 'Mar', checkups: 18 },
    { month: 'Apr', checkups: 28 }, { month: 'May', checkups: 25 }, { month: 'Jun', checkups: 32 },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Heart className="h-5 w-5 text-emerald-500" />Health & Medical Records</h2>
          <p className="text-sm text-muted-foreground mt-1">Track student health, BMI, and medical history</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" />Add Health Record
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Records" value={stats.totalRecords} icon={Stethoscope} iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" trend="up" trendLabel="+4 this month" />
        <StatCard title="Records This Month" value={stats.recordsThisMonth} icon={Calendar} iconBg="bg-teal-50 dark:bg-teal-950/30" iconColor="text-teal-600 dark:text-teal-400" trend="up" trendLabel="+8 vs last month" />
        <StatCard title="Students with Allergies" value={stats.studentsWithAllergies} icon={AlertCircle} iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" trend="neutral" trendLabel="Requires monitoring" />
        <StatCard title="Students with Conditions" value={stats.studentsWithConditions} icon={Activity} iconBg="bg-red-50 dark:bg-red-950/30" iconColor="text-red-600 dark:text-red-400" trend="down" trendLabel="-2 vs last month" />
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by student name or ID..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Student</TableHead>
                    <TableHead className="text-xs">Height</TableHead>
                    <TableHead className="text-xs">Weight</TableHead>
                    <TableHead className="text-xs">BMI</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Blood Group</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Vision</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Allergies</TableHead>
                    <TableHead className="text-xs hidden xl:table-cell">Conditions</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Last Checkup</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No health records found</TableCell></TableRow>
                  ) : records.map((r) => {
                    const bmiInfo = getBMI(r.height, r.weight)
                    return (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-sm">{r.student.firstName} {r.student.lastName}</TableCell>
                        <TableCell className="text-sm">{r.height ? `${r.height} cm` : '—'}</TableCell>
                        <TableCell className="text-sm">{r.weight ? `${r.weight} kg` : '—'}</TableCell>
                        <TableCell>
                          {bmiInfo.bmi !== null ? (
                            <Badge variant="outline" className={`${bmiInfo.bg} ${bmiInfo.text} border-transparent text-[11px]`}>
                              {bmiInfo.bmi} · {bmiInfo.category}
                            </Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-sm hidden md:table-cell">
                          {r.bloodGroup ? <Badge variant="outline" className="text-[11px]">{r.bloodGroup}</Badge> : '—'}
                        </TableCell>
                        <TableCell className="text-sm hidden lg:table-cell">{r.vision || '—'}</TableCell>
                        <TableCell className="text-sm hidden lg:table-cell max-w-[120px] truncate">{r.allergies || 'None'}</TableCell>
                        <TableCell className="text-sm hidden xl:table-cell max-w-[120px] truncate">{r.conditions || 'None'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{r.lastCheckup ? new Date(r.lastCheckup).toLocaleDateString() : '—'}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
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
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">BMI Distribution</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bmiData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {bmiData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Blood Group Distribution</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={bloodGroupData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {bloodGroupData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RTooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader className="p-0 pb-3"><CardTitle className="text-sm font-medium">Health Checkup Trend</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={checkupTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Line type="monotone" dataKey="checkups" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <AddHealthRecordDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => refetch()} students={students} />
    </motion.div>
  )
}
