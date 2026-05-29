'use client'

import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Plus,
  Send,
  CheckCircle2,
  Search,
  Filter,
  Receipt,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Users,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

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

const STATUS_COLORS: Record<string, string> = {
  paid: CHART_COLORS.emerald,
  pending: CHART_COLORS.orange,
  overdue: CHART_COLORS.rose,
  partial: CHART_COLORS.sky,
}

const STATUS_BADGE: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  partial: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
}

// ── Types ───────────────────────────────────────────────────────
interface FeePayment {
  id: string
  studentId: string
  amount: number
  paidAmount: number
  feeType: string
  status: string
  dueDate: string
  paidDate: string | null
  paymentMode: string | null
  discount: number
  remarks: string | null
  student: {
    id: string
    firstName: string
    lastName: string
    admissionNo: string
    class: { name: string } | null
  }
}

interface FeeStructure {
  id: string
  name: string
  amount: number
  frequency: string
  classId: string | null
  schoolId: string
  createdAt: string
}

interface FeesData {
  payments: FeePayment[]
  summary: {
    totalAmount: number
    totalPaid: number
    totalPending: number
    outstandingAmount: number
    collectionRate: number
    statusBreakdown: { status: string; count: number; amount: number; paidAmount: number }[]
  }
  pagination: { page: number; limit: number; total: number; totalPages: number }
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

// ── Helper ──────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
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
export function FeesModule() {
  const { user } = useAppStore()
  const queryClient = useQueryClient()
  const schoolId = user?.schoolId || ''

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>('')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [feeStructureDialogOpen, setFeeStructureDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state for record payment
  const [formStudentId, setFormStudentId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formPaidAmount, setFormPaidAmount] = useState('')
  const [formFeeType, setFormFeeType] = useState('')
  const [formStatus, setFormStatus] = useState('pending')
  const [formDueDate, setFormDueDate] = useState('')
  const [formPaymentMode, setFormPaymentMode] = useState('')
  const [formDiscount, setFormDiscount] = useState('')
  const [formRemarks, setFormRemarks] = useState('')

  // Form state for fee structure
  const [fsName, setFsName] = useState('')
  const [fsAmount, setFsAmount] = useState('')
  const [fsFrequency, setFsFrequency] = useState('monthly')

  // Fetch fees data
  const { data, isLoading, isError, error } = useQuery<FeesData>({
    queryKey: ['fees', schoolId, statusFilter, feeTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (schoolId) params.set('schoolId', schoolId)
      if (statusFilter) params.set('status', statusFilter)
      if (feeTypeFilter) params.set('feeType', feeTypeFilter)
      const res = await fetch(`/api/fees?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch fees data')
      const json = await res.json()
      return json.data
    },
    staleTime: 30_000,
  })

  // Fetch fee structures
  const { data: feeStructuresData } = useQuery<{ structures: FeeStructure[] }>({
    queryKey: ['fee-structures', schoolId],
    queryFn: async () => {
      const res = await fetch(`/api/fees/structures${schoolId ? `?schoolId=${schoolId}` : ''}`)
      if (!res.ok) return { structures: [] }
      const json = await res.json()
      return json.data || { structures: [] }
    },
    staleTime: 60_000,
  })

  // Fetch students for select
  const { data: studentsData } = useQuery({
    queryKey: ['students-quick', schoolId],
    queryFn: async () => {
      const res = await fetch(`/api/students?schoolId=${schoolId}&limit=50`)
      if (!res.ok) return { students: [] }
      const json = await res.json()
      return json.data
    },
    staleTime: 60_000,
  })

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to record payment')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully')
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      setPaymentDialogOpen(false)
      resetPaymentForm()
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to record payment')
    },
  })

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async ({ paymentId, paymentMode: pm }: { paymentId: string; paymentMode?: string }) => {
      const res = await fetch('/api/fees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, status: 'paid', paymentMode: pm || 'cash', paidDate: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error('Failed to update payment')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Payment marked as paid')
      queryClient.invalidateQueries({ queryKey: ['fees'] })
    },
    onError: () => {
      toast.error('Failed to update payment')
    },
  })

  function resetPaymentForm() {
    setFormStudentId('')
    setFormAmount('')
    setFormPaidAmount('')
    setFormFeeType('')
    setFormStatus('pending')
    setFormDueDate('')
    setFormPaymentMode('')
    setFormDiscount('')
    setFormRemarks('')
  }

  function handleRecordPayment() {
    if (!formStudentId || !formAmount || !formFeeType || !formDueDate) {
      toast.error('Please fill in all required fields')
      return
    }
    recordPaymentMutation.mutate({
      schoolId,
      studentId: formStudentId,
      amount: parseFloat(formAmount),
      paidAmount: formPaidAmount ? parseFloat(formPaidAmount) : 0,
      feeType: formFeeType,
      status: formStatus,
      dueDate: formDueDate,
      paymentMode: formPaymentMode || null,
      discount: formDiscount ? parseFloat(formDiscount) : 0,
      remarks: formRemarks || null,
    })
  }

  function handleSendReminder(payment: FeePayment) {
    toast.success(`Reminder sent to ${payment.student.firstName} ${payment.student.lastName}'s parent`)
  }

  // Computed stats
  const totalRevenue = data?.summary.totalPaid ?? 0
  const pendingCollections = data?.summary.outstandingAmount ?? 0
  const overdueAmount = data?.summary.statusBreakdown.find(s => s.status === 'overdue')?.amount ?? 0
  const collectionRate = data?.summary.collectionRate ?? 0

  // Filtered payments
  const filteredPayments = (data?.payments || []).filter(p => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      p.student.firstName.toLowerCase().includes(q) ||
      p.student.lastName.toLowerCase().includes(q) ||
      p.student.admissionNo.toLowerCase().includes(q) ||
      p.feeType.toLowerCase().includes(q)
    )
  })

  // Analytics chart data
  const revenueTrendData = (() => {
    if (!data?.payments) return []
    const monthMap = new Map<string, { month: string; revenue: number; pending: number }>()
    data.payments.forEach(p => {
      const d = new Date(p.dueDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const existing = monthMap.get(key) || { month: label, revenue: 0, pending: 0 }
      if (p.status === 'paid') existing.revenue += p.paidAmount
      else existing.pending += (p.amount - p.paidAmount)
      monthMap.set(key, existing)
    })
    return Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)
  })()

  const feeTypeChartData = (() => {
    if (!data?.payments) return []
    const typeMap = new Map<string, { feeType: string; amount: number; collected: number }>()
    data.payments.forEach(p => {
      const existing = typeMap.get(p.feeType) || { feeType: p.feeType, amount: 0, collected: 0 }
      existing.amount += p.amount
      existing.collected += p.paidAmount
      typeMap.set(p.feeType, existing)
    })
    return Array.from(typeMap.values())
  })()

  const paymentModeData = (() => {
    if (!data?.payments) return []
    const modeMap = new Map<string, { mode: string; count: number }>()
    data.payments.filter(p => p.status === 'paid' && p.paymentMode).forEach(p => {
      const existing = modeMap.get(p.paymentMode!) || { mode: p.paymentMode!, count: 0 }
      existing.count += 1
      modeMap.set(p.paymentMode!, existing)
    })
    return Array.from(modeMap.values())
  })()

  const topDefaulters = (() => {
    if (!data?.payments) return []
    const defaulterMap = new Map<string, { name: string; admissionNo: string; class: string; totalPending: number; count: number }>()
    data.payments.filter(p => p.status === 'pending' || p.status === 'overdue').forEach(p => {
      const key = p.studentId
      const existing = defaulterMap.get(key) || {
        name: `${p.student.firstName} ${p.student.lastName}`,
        admissionNo: p.student.admissionNo,
        class: p.student.class?.name || 'N/A',
        totalPending: 0,
        count: 0,
      }
      existing.totalPending += (p.amount - p.paidAmount)
      existing.count += 1
      defaulterMap.set(key, existing)
    })
    return Array.from(defaulterMap.values()).sort((a, b) => b.totalPending - a.totalPending).slice(0, 5)
  })()

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
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
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold">Failed to load fees data</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          {(error as Error)?.message || 'Something went wrong. Please try again later.'}
        </p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['fees'] })}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Fees & Finance Engine
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage fee collections, track payments, and analyze revenue</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs w-48"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-32">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={feeTypeFilter} onValueChange={setFeeTypeFilter}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue placeholder="Fee Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Tuition Fee">Tuition Fee</SelectItem>
              <SelectItem value="Lab Fee">Lab Fee</SelectItem>
              <SelectItem value="Library Fee">Library Fee</SelectItem>
              <SelectItem value="Transport Fee">Transport Fee</SelectItem>
              <SelectItem value="Sports Fee">Sports Fee</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-500" />
                  Record Payment
                </DialogTitle>
                <DialogDescription>Enter payment details to record a new fee payment.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Student *</Label>
                  <Select value={formStudentId} onValueChange={setFormStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {(studentsData?.students || []).map((s: { id: string; firstName: string; lastName: string; admissionNo: string }) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} ({s.admissionNo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Amount *</Label>
                    <Input type="number" placeholder="0" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Paid Amount</Label>
                    <Input type="number" placeholder="0" value={formPaidAmount} onChange={(e) => setFormPaidAmount(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Fee Type *</Label>
                    <Select value={formFeeType} onValueChange={setFormFeeType}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tuition Fee">Tuition Fee</SelectItem>
                        <SelectItem value="Lab Fee">Lab Fee</SelectItem>
                        <SelectItem value="Library Fee">Library Fee</SelectItem>
                        <SelectItem value="Transport Fee">Transport Fee</SelectItem>
                        <SelectItem value="Sports Fee">Sports Fee</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Status</Label>
                    <Select value={formStatus} onValueChange={setFormStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Due Date *</Label>
                    <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Payment Mode</Label>
                    <Select value={formPaymentMode} onValueChange={setFormPaymentMode}>
                      <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Discount</Label>
                    <Input type="number" placeholder="0" value={formDiscount} onChange={(e) => setFormDiscount(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Remarks</Label>
                    <Input placeholder="Optional remarks" value={formRemarks} onChange={(e) => setFormRemarks(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleRecordPayment} disabled={recordPaymentMutation.isPending}>
                    {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={TrendingUp}
          trend="up"
          trendLabel="All collected"
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Pending Collections"
          value={formatCurrency(pendingCollections)}
          icon={CreditCard}
          trend="neutral"
          trendLabel="Outstanding"
          iconBg="bg-amber-50 dark:bg-amber-950/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          title="Overdue Amount"
          value={formatCurrency(overdueAmount)}
          icon={AlertTriangle}
          trend={overdueAmount > 0 ? 'down' : 'neutral'}
          trendLabel={overdueAmount > 0 ? 'Needs attention' : 'All clear'}
          iconBg="bg-red-50 dark:bg-red-950/30"
          iconColor="text-red-600 dark:text-red-400"
        />
        <StatCard
          title="Collection Rate"
          value={`${collectionRate}%`}
          icon={DollarSign}
          trend={collectionRate >= 80 ? 'up' : collectionRate >= 50 ? 'neutral' : 'down'}
          trendLabel={collectionRate >= 80 ? 'On target' : 'Below target'}
          iconBg="bg-teal-50 dark:bg-teal-950/30"
          iconColor="text-teal-600 dark:text-teal-400"
        />
      </div>

      {/* ── Tabs ── */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
            <TabsTrigger value="structures" className="text-xs">Fee Structures</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
          </TabsList>

          {/* ── Payments Tab ── */}
          <TabsContent value="payments">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-emerald-500" />
                  Payment Records
                </CardTitle>
                <CardDescription className="text-xs">
                  {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Student</TableHead>
                        <TableHead className="text-xs">Fee Type</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Paid</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Due Date</TableHead>
                        <TableHead className="text-xs">Paid Date</TableHead>
                        <TableHead className="text-xs">Mode</TableHead>
                        <TableHead className="text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.length > 0 ? (
                        filteredPayments.map((payment) => (
                          <TableRow key={payment.id} className="hover:bg-muted/30">
                            <TableCell className="text-xs font-medium">
                              <div>
                                <div>{payment.student.firstName} {payment.student.lastName}</div>
                                <div className="text-[10px] text-muted-foreground">{payment.student.admissionNo}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{payment.feeType}</TableCell>
                            <TableCell className="text-xs font-medium">{formatCurrency(payment.amount)}</TableCell>
                            <TableCell className="text-xs">{formatCurrency(payment.paidAmount)}</TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] ${STATUS_BADGE[payment.status] || STATUS_BADGE.pending}`}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                            </TableCell>
                            <TableCell className="text-xs capitalize">{payment.paymentMode || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {(payment.status === 'pending' || payment.status === 'overdue') && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                                      onClick={() => handleSendReminder(payment)}
                                      title="Send Reminder"
                                    >
                                      <Send className="h-3.5 w-3.5 text-teal-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                      onClick={() => markAsPaidMutation.mutate({ paymentId: payment.id })}
                                      title="Mark as Paid"
                                      disabled={markAsPaidMutation.isPending}
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-sm">
                            No payments found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Fee Structures Tab ── */}
          <TabsContent value="structures">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Fee Structures</h3>
              <Dialog open={feeStructureDialogOpen} onOpenChange={setFeeStructureDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Add Fee Structure
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Fee Structure</DialogTitle>
                    <DialogDescription>Define a new fee structure for the school.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Fee Name *</Label>
                      <Input placeholder="e.g., Annual Tuition Fee" value={fsName} onChange={(e) => setFsName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Amount *</Label>
                        <Input type="number" placeholder="0" value={fsAmount} onChange={(e) => setFsAmount(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Frequency</Label>
                        <Select value={fsFrequency} onValueChange={setFsFrequency}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="half-yearly">Half-Yearly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                            <SelectItem value="one-time">One-Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => setFeeStructureDialogOpen(false)}>Cancel</Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { toast.success('Fee structure added'); setFeeStructureDialogOpen(false) }}>
                        Add Structure
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(feeStructuresData?.structures || []).length > 0 ? (
                (feeStructuresData?.structures || []).map((fs) => (
                  <Card key={fs.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-foreground">{fs.name}</h4>
                          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(fs.amount)}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize">{fs.frequency}</Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        <span>Applicable: {fs.classId ? 'Specific Class' : 'All Classes'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Receipt className="h-10 w-10 opacity-40 mb-2" />
                  <p className="text-sm">No fee structures defined yet</p>
                  <p className="text-xs">Add fee structures to organize your school fees</p>
                </div>
              )}
              {/* Sample fee structures for visual when no data */}
              {(feeStructuresData?.structures || []).length === 0 && (
                <>
                  {[
                    { name: 'Tuition Fee', amount: 5000, frequency: 'monthly', applicable: 'All Classes' },
                    { name: 'Lab Fee', amount: 500, frequency: 'quarterly', applicable: 'Science Stream' },
                    { name: 'Transport Fee', amount: 1500, frequency: 'monthly', applicable: 'All Classes' },
                    { name: 'Library Fee', amount: 200, frequency: 'annually', applicable: 'All Classes' },
                    { name: 'Sports Fee', amount: 300, frequency: 'half-yearly', applicable: 'All Classes' },
                    { name: 'Exam Fee', amount: 1000, frequency: 'one-time', applicable: 'Class 10 & 12' },
                  ].map((sample, idx) => (
                    <Card key={idx} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-foreground">{sample.name}</h4>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(sample.amount)}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize">{sample.frequency}</Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Applicable: {sample.applicable}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </TabsContent>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics">
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Monthly Revenue Trend */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Monthly Revenue Trend
                    </CardTitle>
                    <CardDescription className="text-xs">Revenue vs pending over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      {revenueTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={revenueTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="revenue" name="Collected" stroke={CHART_COLORS.emerald} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS.emerald, strokeWidth: 0 }} />
                            <Line type="monotone" dataKey="pending" name="Pending" stroke={CHART_COLORS.orange} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS.orange, strokeWidth: 0 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                          <div className="text-center space-y-2">
                            <TrendingUp className="h-10 w-10 mx-auto opacity-40" />
                            <p>No revenue data yet</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Fee Collection by Type */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-teal-500" />
                      Collection by Fee Type
                    </CardTitle>
                    <CardDescription className="text-xs">Amount vs collected by fee category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      {feeTypeChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={feeTypeChartData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                            <XAxis dataKey="feeType" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="amount" name="Total Amount" fill={CHART_COLORS.teal} radius={[3, 3, 0, 0]} maxBarSize={30} />
                            <Bar dataKey="collected" name="Collected" fill={CHART_COLORS.emerald} radius={[3, 3, 0, 0]} maxBarSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                          <div className="text-center space-y-2">
                            <Receipt className="h-10 w-10 mx-auto opacity-40" />
                            <p>No fee type data yet</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Payment Mode Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-amber-500" />
                      Payment Mode Distribution
                    </CardTitle>
                    <CardDescription className="text-xs">How parents are paying</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-52">
                      {paymentModeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={paymentModeData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="count" nameKey="mode" stroke="none">
                              {paymentModeData.map((_, index) => (
                                <Cell key={`pm-${index}`} fill={[CHART_COLORS.emerald, CHART_COLORS.teal, CHART_COLORS.orange, CHART_COLORS.sky, CHART_COLORS.violet][index % 5]} />
                              ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                          <div className="text-center space-y-2">
                            <CreditCard className="h-10 w-10 mx-auto opacity-40" />
                            <p>No payment mode data</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Defaulters */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Top Defaulters
                    </CardTitle>
                    <CardDescription className="text-xs">Students with highest pending amounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5 max-h-52 overflow-y-auto custom-scrollbar">
                      {topDefaulters.length > 0 ? (
                        topDefaulters.map((defaulter, idx) => (
                          <div key={idx} className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{defaulter.name}</p>
                              <p className="text-[11px] text-muted-foreground">{defaulter.admissionNo} · {defaulter.class} · {defaulter.count} pending</p>
                            </div>
                            <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(defaulter.totalPending)}</p>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                          <div className="text-center space-y-2">
                            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400" />
                            <p>No defaulters! All fees collected.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
