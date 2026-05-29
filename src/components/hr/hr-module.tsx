'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users, Search, Plus, AlertTriangle, Briefcase, DollarSign, CalendarDays,
  TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Clock,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// ── Color palette ───────────────────────────────────────────────
const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b']

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

// ── Animation variants ──────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

// ── Skeleton ────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Types ───────────────────────────────────────────────────────
interface PayrollRecord {
  id: string
  staffId: string
  month: string
  basicPay: number
  allowances: number
  deductions: number
  netPay: number
  status: string
  paidDate: string | null
  staff: { id: string; name: string; employeeId: string; department: string | null }
}

interface LeaveRecord {
  id: string
  staffId: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason: string | null
  status: string
  staff: { id: string; name: string; employeeId: string; department: string | null }
}

interface StaffMember {
  id: string
  employeeId: string
  name: string
  email: string | null
  phone: string | null
  department: string | null
  designation: string | null
  salary: number | null
  status: string
  payroll: PayrollRecord[]
  leaves: LeaveRecord[]
}

interface HrData {
  staff: StaffMember[]
  payrollRecords: PayrollRecord[]
  leaveRecords: LeaveRecord[]
  stats: { totalStaff: number; activeStaff: number; totalPayroll: number; pendingLeaves: number }
  deptData: { department: string; count: number }[]
  payrollTrend: { month: string; netPay: number }[]
}

// ── Stat Card ───────────────────────────────────────────────────
function StatCard({
  title, value, icon: Icon, trend, trendLabel, iconBg, iconColor, subtitle,
}: {
  title: string; value: string | number; icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string; subtitle?: string
  iconBg: string; iconColor: string
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
                  {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
                  {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500" />}
                  <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                    {trendLabel}
                  </span>
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

// ── Main Component ──────────────────────────────────────────────
export function HrModule() {
  const { user, tenantCode } = useAppStore()
  const queryClient = useQueryClient()
  const schoolId = user?.schoolId || ''

  const [search, setSearch] = useState('')
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false)
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

  // Staff form
  const [fsName, setFsName] = useState('')
  const [fsEmpId, setFsEmpId] = useState('')
  const [fsEmail, setFsEmail] = useState('')
  const [fsPhone, setFsPhone] = useState('')
  const [fsDept, setFsDept] = useState('')
  const [fsDesignation, setFsDesignation] = useState('')
  const [fsSalary, setFsSalary] = useState('')
  const [fsJoinDate, setFsJoinDate] = useState('')

  // Payroll form
  const [fpStaffId, setFpStaffId] = useState('')
  const [fpMonth, setFpMonth] = useState('')
  const [fpBasicPay, setFpBasicPay] = useState('')
  const [fpAllowances, setFpAllowances] = useState('')
  const [fpDeductions, setFpDeductions] = useState('')

  // Leave form
  const [flStaffId, setFlStaffId] = useState('')
  const [flType, setFlType] = useState('')
  const [flStart, setFlStart] = useState('')
  const [flEnd, setFlEnd] = useState('')
  const [flDays, setFlDays] = useState('')
  const [flReason, setFlReason] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery<HrData>({
    queryKey: ['hr', schoolId, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (schoolId) params.set('schoolId', schoolId)
      if (tenantCode) params.set('schoolCode', tenantCode)
      if (search) params.set('search', search)
      const res = await fetch(`/api/hr?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch HR data')
      const json = await res.json()
      return json.data
    },
    staleTime: 30_000,
  })

  const addStaffMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/hr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, schoolCode: tenantCode }) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => { toast.success('Staff member added'); queryClient.invalidateQueries({ queryKey: ['hr'] }); setAddStaffDialogOpen(false); resetStaffForm() },
    onError: (err: Error) => { toast.error(err.message) },
  })

  const payrollMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/hr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, schoolCode: tenantCode }) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => { toast.success('Payroll processed'); queryClient.invalidateQueries({ queryKey: ['hr'] }); setPayrollDialogOpen(false); resetPayrollForm() },
    onError: (err: Error) => { toast.error(err.message) },
  })

  const leaveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/hr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, schoolCode: tenantCode }) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => { toast.success('Leave application submitted'); queryClient.invalidateQueries({ queryKey: ['hr'] }); setLeaveDialogOpen(false); resetLeaveForm() },
    onError: (err: Error) => { toast.error(err.message) },
  })

  const updateLeaveMutation = useMutation({
    mutationFn: async ({ leaveId, status }: { leaveId: string; status: string }) => {
      const res = await fetch('/api/hr', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateLeave', leaveId, status, schoolCode: tenantCode }) })
      if (!res.ok) throw new Error('Failed to update leave')
      return res.json()
    },
    onSuccess: () => { toast.success('Leave status updated'); queryClient.invalidateQueries({ queryKey: ['hr'] }) },
    onError: () => { toast.error('Failed to update leave') },
  })

  const markPayrollPaidMutation = useMutation({
    mutationFn: async (payrollId: string) => {
      const res = await fetch('/api/hr', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'markPayrollPaid', payrollId, schoolCode: tenantCode }) })
      if (!res.ok) throw new Error('Failed to mark as paid')
      return res.json()
    },
    onSuccess: () => { toast.success('Marked as paid'); queryClient.invalidateQueries({ queryKey: ['hr'] }) },
    onError: () => { toast.error('Failed to update') },
  })

  function resetStaffForm() { setFsName(''); setFsEmpId(''); setFsEmail(''); setFsPhone(''); setFsDept(''); setFsDesignation(''); setFsSalary(''); setFsJoinDate('') }
  function resetPayrollForm() { setFpStaffId(''); setFpMonth(''); setFpBasicPay(''); setFpAllowances(''); setFpDeductions('') }
  function resetLeaveForm() { setFlStaffId(''); setFlType(''); setFlStart(''); setFlEnd(''); setFlDays(''); setFlReason('') }

  function handleAddStaff() {
    if (!fsName || !fsEmpId) { toast.error('Name and Employee ID required'); return }
    addStaffMutation.mutate({ action: 'addStaff', schoolId, name: fsName, employeeId: fsEmpId, email: fsEmail, phone: fsPhone, department: fsDept, designation: fsDesignation, salary: fsSalary, dateOfJoining: fsJoinDate })
  }
  function handleProcessPayroll() {
    if (!fpStaffId || !fpMonth || !fpBasicPay) { toast.error('Staff, month, and basic pay required'); return }
    payrollMutation.mutate({ action: 'processPayroll', schoolId, staffId: fpStaffId, month: fpMonth, basicPay: fpBasicPay, allowances: fpAllowances, deductions: fpDeductions })
  }
  function handleApplyLeave() {
    if (!flStaffId || !flType || !flStart || !flEnd || !flDays) { toast.error('All leave fields required'); return }
    leaveMutation.mutate({ action: 'applyLeave', schoolId, staffId: flStaffId, leaveType: flType, startDate: flStart, endDate: flEnd, days: flDays, reason: flReason })
  }

  const stats = data?.stats || { totalStaff: 0, activeStaff: 0, totalPayroll: 0, pendingLeaves: 0 }
  const deptData = data?.deptData || []
  const payrollTrend = data?.payrollTrend || []

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    )
  }

  // ── Error ──
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold">Failed to load HR data</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">{(error as Error)?.message}</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-500" />
            HR & Payroll
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage staff, process payroll, and track leaves</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddStaffDialogOpen(true)} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" /> Add Staff
          </Button>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Staff" value={stats.totalStaff} icon={Users} trend="up" trendLabel="Registered" iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Active Staff" value={stats.activeStaff} icon={CheckCircle2} trend="up" trendLabel="Working" iconBg="bg-teal-50 dark:bg-teal-950/30" iconColor="text-teal-600 dark:text-teal-400" />
        <StatCard title="Total Payroll" value={formatCurrency(stats.totalPayroll)} icon={DollarSign} trend="neutral" trendLabel="Monthly" iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" />
        <StatCard title="Pending Leaves" value={stats.pendingLeaves} icon={CalendarDays} trend={stats.pendingLeaves > 0 ? 'down' : 'neutral'} trendLabel={stats.pendingLeaves > 0 ? 'Needs review' : 'All clear'} iconBg="bg-sky-50 dark:bg-sky-950/30" iconColor="text-sky-600 dark:text-sky-400" />
      </div>

      {/* ── Search ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="staff" className="text-xs">Staff</TabsTrigger>
          <TabsTrigger value="payroll" className="text-xs">Payroll</TabsTrigger>
          <TabsTrigger value="leaves" className="text-xs">Leaves</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
        </TabsList>

        {/* ── Staff Tab ── */}
        <TabsContent value="staff">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-emerald-500" /> Staff Directory</CardTitle>
              <CardDescription className="text-xs">{data?.staff.length || 0} members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Emp ID</TableHead>
                      <TableHead className="text-xs">Department</TableHead>
                      <TableHead className="text-xs">Designation</TableHead>
                      <TableHead className="text-xs">Salary</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.staff || []).length > 0 ? (data?.staff || []).map((s) => (
                      <TableRow key={s.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">{s.name}</TableCell>
                        <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{s.employeeId}</Badge></TableCell>
                        <TableCell className="text-xs">{s.department || '-'}</TableCell>
                        <TableCell className="text-xs">{s.designation || '-'}</TableCell>
                        <TableCell className="text-xs font-medium">{s.salary ? formatCurrency(s.salary) : '-'}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${STATUS_BADGE[s.status] || STATUS_BADGE.active}`}>{s.status}</Badge></TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No staff found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payroll Tab ── */}
        <TabsContent value="payroll">
          <div className="flex justify-end mb-3">
            <Button onClick={() => setPayrollDialogOpen(true)} size="sm" variant="outline" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Process Payroll
            </Button>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-teal-500" /> Payroll Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Staff</TableHead>
                      <TableHead className="text-xs">Month</TableHead>
                      <TableHead className="text-xs">Basic</TableHead>
                      <TableHead className="text-xs">Allowances</TableHead>
                      <TableHead className="text-xs">Deductions</TableHead>
                      <TableHead className="text-xs">Net Pay</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.payrollRecords || []).length > 0 ? (data?.payrollRecords || []).map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">{p.staff.name}</TableCell>
                        <TableCell className="text-xs">{p.month}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(p.basicPay)}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(p.allowances)}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(p.deductions)}</TableCell>
                        <TableCell className="text-xs font-bold">{formatCurrency(p.netPay)}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${STATUS_BADGE[p.status] || STATUS_BADGE.pending}`}>{p.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          {p.status === 'pending' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => markPayrollPaidMutation.mutate(p.id)} title="Mark as Paid" disabled={markPayrollPaidMutation.isPending}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No payroll records</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Leaves Tab ── */}
        <TabsContent value="leaves">
          <div className="flex justify-end mb-3">
            <Button onClick={() => setLeaveDialogOpen(true)} size="sm" variant="outline" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Apply Leave
            </Button>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4 text-amber-500" /> Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Staff</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Start</TableHead>
                      <TableHead className="text-xs">End</TableHead>
                      <TableHead className="text-xs">Days</TableHead>
                      <TableHead className="text-xs">Reason</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.leaveRecords || []).length > 0 ? (data?.leaveRecords || []).map((l) => (
                      <TableRow key={l.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">{l.staff.name}</TableCell>
                        <TableCell className="text-xs">{l.leaveType}</TableCell>
                        <TableCell className="text-xs">{new Date(l.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</TableCell>
                        <TableCell className="text-xs">{new Date(l.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</TableCell>
                        <TableCell className="text-xs text-center">{l.days}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{l.reason || '-'}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${STATUS_BADGE[l.status] || STATUS_BADGE.pending}`}>{l.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          {l.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => updateLeaveMutation.mutate({ leaveId: l.id, status: 'approved' })} title="Approve" disabled={updateLeaveMutation.isPending}>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => updateLeaveMutation.mutate({ leaveId: l.id, status: 'rejected' })} title="Reject" disabled={updateLeaveMutation.isPending}>
                                <XCircle className="h-3.5 w-3.5 text-red-600" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No leave records</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Analytics Tab ── */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> Department Distribution</CardTitle>
                <CardDescription className="text-xs">Staff by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {deptData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={deptData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" label={({ department, percent }) => `${department} (${(percent * 100).toFixed(0)}%)`}>
                          {deptData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data</div>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-teal-500" /> Monthly Payroll Trend</CardTitle>
                <CardDescription className="text-xs">Net pay disbursed over months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {payrollTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={payrollTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                        <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                        <RechartsTooltip />
                        <Line type="monotone" dataKey="netPay" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Net Pay" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data</div>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Add Staff Dialog ── */}
      <Dialog open={addStaffDialogOpen} onOpenChange={setAddStaffDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-500" /> Add Staff Member</DialogTitle>
            <DialogDescription>Register a new staff member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-xs font-medium">Full Name *</Label><Input value={fsName} onChange={(e) => setFsName(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Employee ID *</Label><Input value={fsEmpId} onChange={(e) => setFsEmpId(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Email</Label><Input type="email" value={fsEmail} onChange={(e) => setFsEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Phone</Label><Input value={fsPhone} onChange={(e) => setFsPhone(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Department</Label><Input value={fsDept} onChange={(e) => setFsDept(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Designation</Label><Input value={fsDesignation} onChange={(e) => setFsDesignation(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Salary (₹)</Label><Input type="number" value={fsSalary} onChange={(e) => setFsSalary(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Date of Joining</Label><Input type="date" value={fsJoinDate} onChange={(e) => setFsJoinDate(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddStaffDialogOpen(false)} className="h-9">Cancel</Button>
            <Button onClick={handleAddStaff} disabled={addStaffMutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">{addStaffMutation.isPending ? 'Adding...' : 'Add Staff'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Process Payroll Dialog ── */}
      <Dialog open={payrollDialogOpen} onOpenChange={setPayrollDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-teal-500" /> Process Payroll</DialogTitle>
            <DialogDescription>Generate payroll for a staff member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Staff Member *</Label>
              <Select value={fpStaffId} onValueChange={setFpStaffId}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent className="max-h-48">
                  {(data?.staff || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.employeeId})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label className="text-xs font-medium">Month *</Label><Input placeholder="e.g. 2025-01" value={fpMonth} onChange={(e) => setFpMonth(e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label className="text-xs font-medium">Basic Pay *</Label><Input type="number" value={fpBasicPay} onChange={(e) => setFpBasicPay(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Allowances</Label><Input type="number" value={fpAllowances} onChange={(e) => setFpAllowances(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Deductions</Label><Input type="number" value={fpDeductions} onChange={(e) => setFpDeductions(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPayrollDialogOpen(false)} className="h-9">Cancel</Button>
            <Button onClick={handleProcessPayroll} disabled={payrollMutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">{payrollMutation.isPending ? 'Processing...' : 'Process'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Apply Leave Dialog ── */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-amber-500" /> Apply Leave</DialogTitle>
            <DialogDescription>Submit a leave application.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Staff Member *</Label>
              <Select value={flStaffId} onValueChange={setFlStaffId}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent className="max-h-48">
                  {(data?.staff || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.employeeId})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Leave Type *</Label>
              <Select value={flType} onValueChange={setFlType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="earned">Earned Leave</SelectItem>
                  <SelectItem value="maternity">Maternity Leave</SelectItem>
                  <SelectItem value="paternity">Paternity Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label className="text-xs font-medium">Start *</Label><Input type="date" value={flStart} onChange={(e) => setFlStart(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">End *</Label><Input type="date" value={flEnd} onChange={(e) => setFlEnd(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Days *</Label><Input type="number" value={flDays} onChange={(e) => setFlDays(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label className="text-xs font-medium">Reason</Label><Input value={flReason} onChange={(e) => setFlReason(e.target.value)} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)} className="h-9">Cancel</Button>
            <Button onClick={handleApplyLeave} disabled={leaveMutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">{leaveMutation.isPending ? 'Submitting...' : 'Submit'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
