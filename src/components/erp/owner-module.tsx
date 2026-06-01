'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Building2,
  FileText,
  CreditCard,
  Key,
  Monitor,
  Plus,
  Search,
  Copy,
  Ban,
  CheckCircle2,
  Send,
  RefreshCw,
  Users,
  DollarSign,
  Activity,
  Shield,
  Loader2,
  AlertTriangle,
  Globe,
  Phone,
  Mail,
  MapPin,
  Hash,
  Calendar,
  Clock,
  Database,
  ServerCog,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  Trash2,
  Eye,
  Unlock,
  X,
  CheckCheck,
} from 'lucide-react'

// ============ TYPES ============

interface Client {
  id: string
  name: string
  slug: string
  email: string
  phone?: string | null
  address?: string | null
  city?: string | null
  country: string
  logo?: string | null
  dbName: string
  dbConnectionString: string
  dbStatus: string
  subscriptionPlan: string
  subscriptionStatus: string
  subscriptionStart?: string | null
  subscriptionEnd?: string | null
  maxStudents: number
  maxStaff: number
  maxCampuses: number
  status: string
  onboardedAt?: string | null
  lastActivityAt?: string | null
  serialKeyId?: string | null
  serialKey?: SerialKey | null
  devices?: Device[]
  invoices?: Invoice[]
  payments?: Payment[]
  activityLogs?: ActivityLog[]
  _count?: {
    devices: number
    invoices: number
    payments: number
  }
  createdAt: string
  updatedAt: string
}

interface SerialKey {
  id: string
  key: string
  type: string
  status: string
  maxDevices: number
  usedDevices: number
  activatedAt?: string | null
  expiresAt?: string | null
  subscriptionPlan?: string | null
  maxStudents?: number | null
  maxStaff?: number | null
  maxCampuses?: number | null
  client?: {
    id: string
    name: string
    slug: string
    email: string
  } | null
  _count?: { devices: number }
  createdAt: string
  updatedAt: string
}

interface Device {
  id: string
  fingerprint: string
  deviceName?: string | null
  deviceType?: string | null
  os?: string | null
  browser?: string | null
  ipAddress?: string | null
  clientId?: string | null
  serialKeyId: string
  status: string
  isBlocked?: boolean
  blockedReason?: string | null
  blockedAt?: string | null
  lastSeenAt?: string | null
  registeredAt: string
  client?: {
    id: string
    name: string
    slug: string
    email: string
  } | null
  serialKey?: {
    id: string
    key: string
    type: string
    status: string
  }
  createdAt: string
  updatedAt: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  amount: number
  tax: number
  discount: number
  totalAmount: number
  items: string
  issueDate: string
  dueDate: string
  paidDate?: string | null
  status: string
  notes?: string | null
  client?: {
    id: string
    name: string
    slug: string
    email: string
    phone?: string | null
    address?: string | null
    city?: string | null
    country?: string | null
  }
  payments?: Payment[]
  _count?: { payments: number }
  createdAt: string
  updatedAt: string
}

interface Payment {
  id: string
  clientId: string
  invoiceId?: string | null
  amount: number
  paymentMethod?: string | null
  transactionRef?: string | null
  status: string
  paidAt?: string | null
  createdAt: string
}

interface ActivityLog {
  id: string
  userId?: string | null
  clientId?: string | null
  action: string
  entity?: string | null
  entityId?: string | null
  details?: string | null
  ipAddress?: string | null
  createdAt: string
  user?: { id: string; name: string; email: string; role: string } | null
  client?: { id: string; name: string; slug: string } | null
}

interface DashboardData {
  clients: {
    total: number
    active: number
    suspended: number
    terminated: number
    planDistribution: Array<{ plan: string; count: number }>
  }
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    changePercent: string
    outstanding: number
    monthlyTrend: Array<{ month: string; revenue: number }>
  }
  serialKeys: {
    total: number
    active: number
    byType: Array<{ type: string; count: number; usedDevices: number; maxDevices: number }>
    byStatus: Array<{ status: string; count: number }>
  }
  devices: {
    total: number
    active: number
    byType: Array<{ type: string; count: number }>
  }
  invoices: {
    total: number
    paid: number
    overdue: number
  }
  payments: { total: number }
  clientsTrend: Array<{ month: string; newClients: number }>
  recentActivity: ActivityLog[]
}

// ============ HELPERS ============

const PKR = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})
const fmt = (n: number) => PKR.format(n)

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function fmtDateTime(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtRelative(d: string | null | undefined) {
  if (!d) return '—'
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return fmtDate(d)
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const statusColors: Record<string, string> = {
  active: 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
  inactive: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  suspended: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  terminated: 'bg-red-500/15 text-red-700 dark:text-red-400',
  draft: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  sent: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  paid: 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
  overdue: 'bg-red-500/15 text-red-700 dark:text-red-400',
  cancelled: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  expired: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  trial: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  blocked: 'bg-red-500/15 text-red-700 dark:text-red-400',
  revoked: 'bg-red-500/15 text-red-700 dark:text-red-400',
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  completed: 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
  past_due: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium',
        statusColors[status] || statusColors.inactive
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  )
}

const chartColors = ['#14b8a6', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316']

// ============ ANIMATION VARIANTS ============

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

// ============ EMPTY STATE ============

function EmptyState({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType
  title: string
  desc: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">{desc}</p>
    </div>
  )
}

// ============ LOADING SKELETON ============

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border/50 rounded-xl p-5 h-28" />
        ))}
      </div>
      <div className="bg-card border border-border/50 rounded-xl p-5 h-64" />
      <div className="bg-card border border-border/50 rounded-xl p-5 h-48" />
    </div>
  )
}

// ============ KPI STAT CARD ============

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string
  value: string
  icon: React.ElementType
  accent: string
  sub?: string
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'bg-card border border-border/50 rounded-xl p-5 border-l-[3px]',
        accent
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1 truncate">{value}</p>
          {sub && (
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1.5">{sub}</p>
          )}
        </div>
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3',
            accent === 'border-l-teal-500' && 'bg-teal-500/10',
            accent === 'border-l-sky-500' && 'bg-sky-500/10',
            accent === 'border-l-amber-500' && 'bg-amber-500/10',
            accent === 'border-l-violet-500' && 'bg-violet-500/10'
          )}
        >
          <Icon
            className={cn(
              'w-5 h-5',
              accent === 'border-l-teal-500' && 'text-teal-600 dark:text-teal-400',
              accent === 'border-l-sky-500' && 'text-sky-600 dark:text-sky-400',
              accent === 'border-l-amber-500' && 'text-amber-600 dark:text-amber-400',
              accent === 'border-l-violet-500' && 'text-violet-600 dark:text-violet-400'
            )}
          />
        </div>
      </div>
    </motion.div>
  )
}

// ============ TOAST ============

function Toast({
  toast,
}: {
  toast: { message: string; type: 'success' | 'error' }
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border',
        toast.type === 'success'
          ? 'bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20 text-teal-700 dark:text-teal-400'
          : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
      )}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <AlertTriangle className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">{toast.message}</span>
    </motion.div>
  )
}

// ============ MAIN COMPONENT ============

export default function OwnerModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Data
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [serialKeys, setSerialKeys] = useState<SerialKey[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  // Search & Filters
  const [clientSearch, setClientSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('all')
  const [keySearch, setKeySearch] = useState('')
  const [keyTypeFilter, setKeyTypeFilter] = useState('all')
  const [keyStatusFilter, setKeyStatusFilter] = useState('all')
  const [deviceSearch, setDeviceSearch] = useState('')
  const [deviceStatusFilter, setDeviceStatusFilter] = useState('all')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all')

  // Detail views
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // Dialogs
  const [showAddClient, setShowAddClient] = useState(false)
  const [showGenKey, setShowGenKey] = useState(false)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [showBlockDevice, setShowBlockDevice] = useState(false)
  const [showRevokeKey, setShowRevokeKey] = useState(false)
  const [showSuspendClient, setShowSuspendClient] = useState(false)
  const [showTerminateClient, setShowTerminateClient] = useState(false)

  // Action targets
  const [targetDevice, setTargetDevice] = useState<Device | null>(null)
  const [targetKey, setTargetKey] = useState<SerialKey | null>(null)
  const [targetClient, setTargetClient] = useState<Client | null>(null)
  const [blockReason, setBlockReason] = useState('')

  // Mutation state
  const [mutating, setMutating] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // ============ FORM STATE ============

  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Pakistan',
    subscriptionPlan: 'trial',
    maxStudents: 50,
    maxStaff: 10,
    maxCampuses: 1,
  })

  const [keyForm, setKeyForm] = useState({
    type: 'client' as 'owner' | 'client' | 'trial',
    maxDevices: 1,
    expiresAt: '',
    subscriptionPlan: 'trial',
  })

  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    dueDate: '',
    tax: 0,
    discount: 0,
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }] as Array<{
      description: string
      quantity: number
      unitPrice: number
    }>,
  })

  // ============ TOAST HELPER ============

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // ============ DATA FETCHING ============

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/dashboard')
      if (res.ok) {
        const data = await res.json()
        setDashboard(data)
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    }
  }, [])

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/clients?limit=100')
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (err) {
      console.error('Clients fetch error:', err)
    }
  }, [])

  const fetchSerialKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/serial-keys?limit=100')
      if (res.ok) {
        const data = await res.json()
        setSerialKeys(data.serialKeys || [])
      }
    } catch (err) {
      console.error('Serial keys fetch error:', err)
    }
  }, [])

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/devices?limit=100')
      if (res.ok) {
        const data = await res.json()
        setDevices(data.devices || [])
      }
    } catch (err) {
      console.error('Devices fetch error:', err)
    }
  }, [])

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/invoices?limit=100')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } catch (err) {
      console.error('Invoices fetch error:', err)
    }
  }, [])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fetchDashboard(),
      fetchClients(),
      fetchSerialKeys(),
      fetchDevices(),
      fetchInvoices(),
    ])
    setLoading(false)
  }, [fetchDashboard, fetchClients, fetchSerialKeys, fetchDevices, fetchInvoices])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // ============ REFRESH HELPERS ============

  const refreshAfterMutation = useCallback(
    async (tabs?: string[]) => {
      const promises: Promise<void>[] = []
      if (!tabs || tabs.includes('dashboard')) promises.push(fetchDashboard())
      if (!tabs || tabs.includes('clients')) promises.push(fetchClients())
      if (!tabs || tabs.includes('keys')) promises.push(fetchSerialKeys())
      if (!tabs || tabs.includes('devices')) promises.push(fetchDevices())
      if (!tabs || tabs.includes('invoices')) promises.push(fetchInvoices())
      await Promise.all(promises)
    },
    [fetchDashboard, fetchClients, fetchSerialKeys, fetchDevices, fetchInvoices]
  )

  // ============ MUTATIONS ============

  const handleCreateClient = async () => {
    if (!clientForm.name || !clientForm.email) {
      showToast('Name and email are required', 'error')
      return
    }
    setMutating(true)
    try {
      const res = await fetch('/api/owner/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...clientForm,
          slug: generateSlug(clientForm.name),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create client')
      }
      showToast('Client created successfully')
      setShowAddClient(false)
      setClientForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Pakistan',
        subscriptionPlan: 'trial',
        maxStudents: 50,
        maxStaff: 10,
        maxCampuses: 1,
      })
      await refreshAfterMutation(['dashboard', 'clients'])
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create client', 'error')
    } finally {
      setMutating(false)
    }
  }

  const handleSuspendClient = async () => {
    if (!targetClient) return
    setMutating(true)
    try {
      const res = await fetch(`/api/owner/clients/${targetClient.id}?action=suspend`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to suspend client')
      }
      showToast('Client suspended successfully')
      setShowSuspendClient(false)
      setTargetClient(null)
      setSelectedClient(null)
      await refreshAfterMutation(['dashboard', 'clients'])
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to suspend client', 'error')
    } finally {
      setMutating(false)
    }
  }

  const handleTerminateClient = async () => {
    if (!targetClient) return
    setMutating(true)
    try {
      const res = await fetch(`/api/owner/clients/${targetClient.id}?action=terminate`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to terminate client')
      }
      showToast('Client terminated successfully')
      setShowTerminateClient(false)
      setTargetClient(null)
      setSelectedClient(null)
      await refreshAfterMutation(['dashboard', 'clients'])
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to terminate client', 'error')
    } finally {
      setMutating(false)
    }
  }

  const handleGenerateKey = async () => {
    setMutating(true)
    try {
      const res = await fetch('/api/owner/serial-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: keyForm.type,
          maxDevices: keyForm.maxDevices,
          expiresAt: keyForm.expiresAt || undefined,
          subscriptionPlan: keyForm.subscriptionPlan,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate key')
      }
      showToast('Serial key generated successfully')
      setShowGenKey(false)
      setKeyForm({
        type: 'client',
        maxDevices: 1,
        expiresAt: '',
        subscriptionPlan: 'trial',
      })
      await refreshAfterMutation(['dashboard', 'keys'])
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to generate key', 'error')
    } finally {
      setMutating(false)
    }
  }

  const handleRevokeKey = async () => {
    if (!targetKey) return
    setMutating(true)
    try {
      const res = await fetch(`/api/owner/serial-keys/${targetKey.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'revoked' }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to revoke key')
      }
      showToast('Serial key revoked')
      setShowRevokeKey(false)
      setTargetKey(null)
      await refreshAfterMutation(['dashboard', 'keys'])
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to revoke key', 'error')
    } finally {
      setMutating(false)
    }
  }

  const handleBlockDevice = async () => {
    if (!targetDevice) return
    setMutating(true)
    try {
      const res = await fetch(`/api/owner/devices/${targetDevice.id}/toggle-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBlocked: targetDevice.isBlocked ? false : true,
          reason: blockReason || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update device')
      }
      showToast(
        targetDevice.isBlocked ? 'Device unblocked' : 'Device blocked'
      )
      setShowBlockDevice(false)
      setTargetDevice(null)
      setBlockReason('')
      await refreshAfterMutation(['dashboard', 'devices'])
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update device', 'error')
    } finally {
      setMutating(false)
    }
  }

  const handleCreateInvoice = async () => {
    if (!invoiceForm.clientId) {
      showToast('Please select a client', 'error')
      return
    }
    const validItems = invoiceForm.items.filter(
      (i) => i.description && i.unitPrice > 0
    )
    if (validItems.length === 0) {
      showToast('Add at least one item with description and price', 'error')
      return
    }
    setMutating(true)
    try {
      const res = await fetch('/api/owner/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: invoiceForm.clientId,
          items: validItems.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            amount: i.quantity * i.unitPrice,
          })),
          dueDate: invoiceForm.dueDate || undefined,
          tax: invoiceForm.tax || undefined,
          discount: invoiceForm.discount || undefined,
          notes: invoiceForm.notes || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create invoice')
      }
      showToast('Invoice created successfully')
      setShowCreateInvoice(false)
      setInvoiceForm({
        clientId: '',
        dueDate: '',
        tax: 0,
        discount: 0,
        notes: '',
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
      })
      await refreshAfterMutation(['dashboard', 'invoices'])
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to create invoice',
        'error'
      )
    } finally {
      setMutating(false)
    }
  }

  const handleInvoiceStatusChange = async (id: string, status: string) => {
    setMutating(true)
    try {
      const res = await fetch(`/api/owner/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update invoice')
      }
      showToast(`Invoice marked as ${status}`)
      if (selectedInvoice) {
        const detailRes = await fetch(`/api/owner/invoices/${id}`)
        if (detailRes.ok) {
          const data = await detailRes.json()
          setSelectedInvoice(data.invoice)
        }
      }
      await refreshAfterMutation(['dashboard', 'invoices'])
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to update invoice',
        'error'
      )
    } finally {
      setMutating(false)
    }
  }

  const handleProvisionDB = async (clientId: string) => {
    setMutating(true)
    try {
      const res = await fetch('/api/owner/tenants/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Provisioning failed')
      showToast(`Tenant DB provisioned: ${data.tenantDbName}`)
      await refreshAfterMutation(['dashboard', 'clients'])
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Provisioning failed',
        'error'
      )
    } finally {
      setMutating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('Copied to clipboard')
  }

  // ============ FILTER HELPERS ============

  const filteredClients = clients.filter((c) => {
    const matchSearch =
      !clientSearch ||
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(clientSearch.toLowerCase())
    const matchFilter =
      clientFilter === 'all' || c.status === clientFilter
    return matchSearch && matchFilter
  })

  const filteredKeys = serialKeys.filter((k) => {
    const matchSearch =
      !keySearch ||
      k.key.toLowerCase().includes(keySearch.toLowerCase()) ||
      (k.client?.name || '').toLowerCase().includes(keySearch.toLowerCase())
    const matchType = keyTypeFilter === 'all' || k.type === keyTypeFilter
    const matchStatus =
      keyStatusFilter === 'all' || k.status === keyStatusFilter
    return matchSearch && matchType && matchStatus
  })

  const filteredDevices = devices.filter((d) => {
    const matchSearch =
      !deviceSearch ||
      (d.deviceName || '').toLowerCase().includes(deviceSearch.toLowerCase()) ||
      d.fingerprint.toLowerCase().includes(deviceSearch.toLowerCase()) ||
      (d.client?.name || '').toLowerCase().includes(deviceSearch.toLowerCase())
    const matchStatus =
      deviceStatusFilter === 'all' ||
      (deviceStatusFilter === 'active' && !d.isBlocked) ||
      (deviceStatusFilter === 'blocked' && d.isBlocked)
    return matchSearch && matchStatus
  })

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      !invoiceSearch ||
      inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      (inv.client?.name || '').toLowerCase().includes(invoiceSearch.toLowerCase())
    const matchFilter =
      invoiceStatusFilter === 'all' || inv.status === invoiceStatusFilter
    return matchSearch && matchFilter
  })

  // ============ FETCH CLIENT DETAIL ============

  const openClientDetail = async (clientId: string) => {
    try {
      const res = await fetch(`/api/owner/clients/${clientId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedClient(data.client)
      }
    } catch (err) {
      console.error('Client detail fetch error:', err)
    }
  }

  // ============ FETCH INVOICE DETAIL ============

  const openInvoiceDetail = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/owner/invoices/${invoiceId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedInvoice(data.invoice)
      }
    } catch (err) {
      console.error('Invoice detail fetch error:', err)
    }
  }

  // ============ RENDER ============

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-0">
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast toast={toast} />}
      </AnimatePresence>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clients</span>
          </TabsTrigger>
          <TabsTrigger value="keys" className="gap-1.5">
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Serial Keys</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-1.5">
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Devices</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invoices</span>
          </TabsTrigger>
        </TabsList>

        {/* ============ TAB 1: OVERVIEW DASHBOARD ============ */}
        <TabsContent value="overview">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-5"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total Clients"
                value={String(dashboard?.clients.total || 0)}
                icon={Users}
                accent="border-l-teal-500"
                sub={`${dashboard?.clients.active || 0} active`}
              />
              <KpiCard
                label="Active Keys"
                value={String(dashboard?.serialKeys.active || 0)}
                icon={Key}
                accent="border-l-sky-500"
                sub={`${dashboard?.serialKeys.total || 0} total`}
              />
              <KpiCard
                label="Revenue (This Month)"
                value={fmt(dashboard?.revenue.thisMonth || 0)}
                icon={DollarSign}
                accent="border-l-amber-500"
                sub={`${dashboard?.revenue.changePercent || '0'}% from last month`}
              />
              <KpiCard
                label="Active Devices"
                value={String(dashboard?.devices.active || 0)}
                icon={Monitor}
                accent="border-l-violet-500"
                sub={`${dashboard?.devices.total || 0} total`}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Revenue Trend
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboard?.revenue.monthlyTrend || []}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border/30"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border)/0.5)',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [fmt(value), 'Revenue']}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#14b8a6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Client Distribution Pie */}
              <div className="bg-card border border-border/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Client Status
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: 'Active',
                            value: dashboard?.clients.active || 0,
                          },
                          {
                            name: 'Suspended',
                            value: dashboard?.clients.suspended || 0,
                          },
                          {
                            name: 'Terminated',
                            value: dashboard?.clients.terminated || 0,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        <Cell fill="#14b8a6" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border)/0.5)',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 mt-2">
                  {[
                    { label: 'Active', color: 'bg-teal-500' },
                    { label: 'Suspended', color: 'bg-amber-500' },
                    { label: 'Terminated', color: 'bg-red-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div className={cn('w-2.5 h-2.5 rounded-full', item.color)} />
                      <span className="text-[11px] text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Quick Actions */}
              <div className="bg-card border border-border/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    className="justify-start h-10 rounded-lg"
                    onClick={() => setShowAddClient(true)}
                  >
                    <Plus className="w-4 h-4 mr-2 text-teal-600 dark:text-teal-400" />
                    Add Client
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-10 rounded-lg"
                    onClick={() => setShowGenKey(true)}
                  >
                    <Key className="w-4 h-4 mr-2 text-sky-600 dark:text-sky-400" />
                    Generate Key
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-10 rounded-lg"
                    onClick={() => {
                      setShowCreateInvoice(true)
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2 text-amber-600 dark:text-amber-400" />
                    Create Invoice
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-10 rounded-lg"
                    onClick={() => fetchAllData()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2 text-muted-foreground" />
                    Refresh Data
                  </Button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Recent Activity
                </h3>
                <ScrollArea className="h-72">
                  <div className="space-y-1">
                    {(dashboard?.recentActivity || []).slice(0, 15).map(
                      (log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-foreground leading-relaxed">
                              {log.details || log.action}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">
                                {fmtRelative(log.createdAt)}
                              </span>
                              {log.client && (
                                <span className="text-[10px] text-teal-600 dark:text-teal-400">
                                  {log.client.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                    {(!dashboard?.recentActivity ||
                      dashboard.recentActivity.length === 0) && (
                      <EmptyState
                        icon={Activity}
                        title="No recent activity"
                        desc="Activity will appear here as actions are performed"
                      />
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ============ TAB 2: CLIENT MANAGEMENT ============ */}
        <TabsContent value="clients">
          {selectedClient ? (
            <ClientDetailView
              client={selectedClient}
              onBack={() => setSelectedClient(null)}
              onProvision={handleProvisionDB}
              onSuspend={(c) => {
                setTargetClient(c)
                setShowSuspendClient(true)
              }}
              onTerminate={(c) => {
                setTargetClient(c)
                setShowTerminateClient(true)
              }}
              onGenKey={() => {
                setShowGenKey(true)
              }}
              onCreateInvoice={(clientId) => {
                setInvoiceForm((prev) => ({ ...prev, clientId }))
                setShowCreateInvoice(true)
              }}
              showToast={showToast}
              refreshData={() => refreshAfterMutation(['clients'])}
            />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-9 h-9 rounded-lg"
                  />
                </div>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 rounded-lg">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="h-9 rounded-lg"
                  onClick={() => setShowAddClient(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Client
                </Button>
              </div>

              {/* Data Table */}
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">Company</TableHead>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs">Plan</TableHead>
                        <TableHead className="text-xs">DB Status</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Created</TableHead>
                        <TableHead className="text-xs w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <EmptyState
                              icon={Building2}
                              title="No clients found"
                              desc="Add a new client to get started"
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredClients.map((client) => (
                          <TableRow
                            key={client.id}
                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => openClientDetail(client.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                                  <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {client.name}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {client.slug}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {client.email}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={client.subscriptionPlan} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={client.dbStatus} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={client.status} />
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {fmtDate(client.createdAt)}
                            </TableCell>
                            <TableCell>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </motion.div>
          )}
        </TabsContent>

        {/* ============ TAB 3: SERIAL KEYS ============ */}
        <TabsContent value="keys">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search keys..."
                  value={keySearch}
                  onChange={(e) => setKeySearch(e.target.value)}
                  className="pl-9 h-9 rounded-lg"
                />
              </div>
              <Select value={keyTypeFilter} onValueChange={setKeyTypeFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-9 rounded-lg">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={keyStatusFilter}
                onValueChange={setKeyStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-[140px] h-9 rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="h-9 rounded-lg"
                onClick={() => setShowGenKey(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Generate Key
              </Button>
            </div>

            {/* Data Table */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Key</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Client</TableHead>
                      <TableHead className="text-xs">Devices</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Expires</TableHead>
                      <TableHead className="text-xs w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKeys.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <EmptyState
                            icon={Key}
                            title="No serial keys found"
                            desc="Generate a new key to get started"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredKeys.map((sk) => (
                        <TableRow
                          key={sk.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <code className="text-xs font-mono text-foreground bg-muted/40 px-2 py-0.5 rounded">
                                {sk.key}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(sk.key)
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium',
                                sk.type === 'owner'
                                  ? 'bg-violet-500/15 text-violet-700 dark:text-violet-400'
                                  : sk.type === 'trial'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                  : 'bg-teal-500/15 text-teal-700 dark:text-teal-400'
                              )}
                            >
                              {sk.type.charAt(0).toUpperCase() + sk.type.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {sk.client?.name || '—'}
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="text-foreground">
                              {sk.usedDevices}
                            </span>
                            <span className="text-muted-foreground">
                              /{sk.maxDevices}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={sk.status} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {fmtDate(sk.expiresAt)}
                          </TableCell>
                          <TableCell>
                            {sk.status !== 'revoked' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setTargetKey(sk)
                                  setShowRevokeKey(true)
                                }}
                              >
                                <Ban className="w-3 h-3 mr-1" />
                                Revoke
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ============ TAB 4: DEVICE MANAGEMENT ============ */}
        <TabsContent value="devices">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  className="pl-9 h-9 rounded-lg"
                />
              </div>
              <Select
                value={deviceStatusFilter}
                onValueChange={setDeviceStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-[140px] h-9 rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Table */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Device Name</TableHead>
                      <TableHead className="text-xs">OS / Browser</TableHead>
                      <TableHead className="text-xs">Fingerprint</TableHead>
                      <TableHead className="text-xs">Client</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Last Seen</TableHead>
                      <TableHead className="text-xs w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDevices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <EmptyState
                            icon={Monitor}
                            title="No devices found"
                            desc="Devices will appear here when clients register them"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDevices.map((device) => (
                        <TableRow
                          key={device.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                                  device.isBlocked
                                    ? 'bg-red-500/10'
                                    : 'bg-teal-500/10'
                                )}
                              >
                                <Monitor
                                  className={cn(
                                    'w-3.5 h-3.5',
                                    device.isBlocked
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-teal-600 dark:text-teal-400'
                                  )}
                                />
                              </div>
                              <span className="text-sm text-foreground truncate max-w-[160px]">
                                {device.deviceName || 'Unknown Device'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <div>
                              {device.os || 'Unknown OS'}
                            </div>
                            <div className="text-[10px]">
                              {device.browser || ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-[11px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                              {device.fingerprint.slice(0, 12)}...
                            </code>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {device.client?.name || '—'}
                          </TableCell>
                          <TableCell>
                            {device.isBlocked ? (
                              <StatusBadge status="blocked" />
                            ) : (
                              <StatusBadge status="active" />
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {fmtRelative(device.lastSeenAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                'h-7 text-xs',
                                device.isBlocked
                                  ? 'text-teal-600 hover:text-teal-700 hover:bg-teal-500/10'
                                  : 'text-red-600 hover:text-red-700 hover:bg-red-500/10'
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                setTargetDevice(device)
                                setBlockReason('')
                                setShowBlockDevice(true)
                              }}
                            >
                              {device.isBlocked ? (
                                <>
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Unblock
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3 h-3 mr-1" />
                                  Block
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ============ TAB 5: INVOICES ============ */}
        <TabsContent value="invoices">
          {selectedInvoice ? (
            <InvoicePreview
              invoice={selectedInvoice}
              onClose={() => setSelectedInvoice(null)}
              onStatusChange={handleInvoiceStatusChange}
              mutating={mutating}
            />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="pl-9 h-9 rounded-lg"
                  />
                </div>
                <Select
                  value={invoiceStatusFilter}
                  onValueChange={setInvoiceStatusFilter}
                >
                  <SelectTrigger className="w-full sm:w-[160px] h-9 rounded-lg">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="h-9 rounded-lg"
                  onClick={() => setShowCreateInvoice(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Invoice
                </Button>
              </div>

              {/* Data Table */}
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">Invoice #</TableHead>
                        <TableHead className="text-xs">Client</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Issue Date</TableHead>
                        <TableHead className="text-xs">Due Date</TableHead>
                        <TableHead className="text-xs w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <EmptyState
                              icon={FileText}
                              title="No invoices found"
                              desc="Create a new invoice to get started"
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInvoices.map((inv) => (
                          <TableRow
                            key={inv.id}
                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => openInvoiceDetail(inv.id)}
                          >
                            <TableCell>
                              <span className="text-sm font-mono font-medium text-foreground">
                                {inv.invoiceNumber}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {inv.client?.name || '—'}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-foreground">
                              {fmt(inv.totalAmount)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={inv.status} />
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {fmtDate(inv.issueDate)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {fmtDate(inv.dueDate)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {inv.status === 'draft' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-500/10"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleInvoiceStatusChange(inv.id, 'sent')
                                    }}
                                  >
                                    <Send className="w-3 h-3 mr-1" />
                                    Send
                                  </Button>
                                )}
                                {inv.status === 'sent' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-500/10"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleInvoiceStatusChange(inv.id, 'paid')
                                    }}
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Paid
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openInvoiceDetail(inv.id)
                                  }}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============ DIALOGS ============ */}

      {/* Add Client Dialog */}
      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Add New Client
            </DialogTitle>
            <DialogDescription>
              Register a new client on the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Company Name *</Label>
                <Input
                  placeholder="Company name"
                  value={clientForm.name}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email *</Label>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  value={clientForm.email}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input
                  placeholder="+92 300 1234567"
                  value={clientForm.phone}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">City</Label>
                <Input
                  placeholder="Karachi"
                  value={clientForm.city}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, city: e.target.value }))
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Address</Label>
                <Input
                  placeholder="Full address"
                  value={clientForm.address}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, address: e.target.value }))
                  }
                  className="h-9 rounded-lg"
                />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Subscription Plan</Label>
                <Select
                  value={clientForm.subscriptionPlan}
                  onValueChange={(v) =>
                    setClientForm((p) => ({ ...p, subscriptionPlan: v }))
                  }
                >
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Country</Label>
                <Input
                  value={clientForm.country}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, country: e.target.value }))
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Students</Label>
                <Input
                  type="number"
                  value={clientForm.maxStudents}
                  onChange={(e) =>
                    setClientForm((p) => ({
                      ...p,
                      maxStudents: parseInt(e.target.value) || 50,
                    }))
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Staff</Label>
                <Input
                  type="number"
                  value={clientForm.maxStaff}
                  onChange={(e) =>
                    setClientForm((p) => ({
                      ...p,
                      maxStaff: parseInt(e.target.value) || 10,
                    }))
                  }
                  className="h-9 rounded-lg"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddClient(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateClient}
              disabled={mutating}
              className="rounded-lg"
            >
              {mutating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Create Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Key Dialog */}
      <Dialog open={showGenKey} onOpenChange={setShowGenKey}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Generate Serial Key
            </DialogTitle>
            <DialogDescription>
              Create a new serial key for license activation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Key Type</Label>
              <Select
                value={keyForm.type}
                onValueChange={(v) =>
                  setKeyForm((p) => ({
                    ...p,
                    type: v as 'owner' | 'client' | 'trial',
                  }))
                }
              >
                <SelectTrigger className="h-9 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Max Devices</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={keyForm.maxDevices}
                  onChange={(e) =>
                    setKeyForm((p) => ({
                      ...p,
                      maxDevices: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subscription Plan</Label>
                <Select
                  value={keyForm.subscriptionPlan}
                  onValueChange={(v) =>
                    setKeyForm((p) => ({ ...p, subscriptionPlan: v }))
                  }
                >
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Expires At (optional)</Label>
              <Input
                type="date"
                value={keyForm.expiresAt}
                onChange={(e) =>
                  setKeyForm((p) => ({ ...p, expiresAt: e.target.value }))
                }
                className="h-9 rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenKey(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateKey}
              disabled={mutating}
              className="rounded-lg"
            >
              {mutating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Generate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Create Invoice
            </DialogTitle>
            <DialogDescription>
              Create a new invoice for a client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Client *</Label>
                <Select
                  value={invoiceForm.clientId}
                  onValueChange={(v) =>
                    setInvoiceForm((p) => ({ ...p, clientId: v }))
                  }
                >
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients
                      .filter((c) => c.status === 'active')
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Due Date</Label>
                <Input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) =>
                    setInvoiceForm((p) => ({ ...p, dueDate: e.target.value }))
                  }
                  className="h-9 rounded-lg"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Line Items</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    setInvoiceForm((p) => ({
                      ...p,
                      items: [
                        ...p.items,
                        { description: '', quantity: 1, unitPrice: 0 },
                      ],
                    }))
                  }
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Item
                </Button>
              </div>
              {invoiceForm.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2.5 rounded-lg border border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...invoiceForm.items]
                        newItems[idx] = {
                          ...newItems[idx],
                          description: e.target.value,
                        }
                        setInvoiceForm((p) => ({ ...p, items: newItems }))
                      }}
                      className="h-8 text-xs rounded-lg mb-1.5"
                    />
                    <div className="flex gap-1.5">
                      <Input
                        type="number"
                        placeholder="Qty"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...invoiceForm.items]
                          newItems[idx] = {
                            ...newItems[idx],
                            quantity: parseInt(e.target.value) || 1,
                          }
                          setInvoiceForm((p) => ({ ...p, items: newItems }))
                        }}
                        className="h-8 text-xs rounded-lg w-20"
                      />
                      <Input
                        type="number"
                        placeholder="Unit Price"
                        min={0}
                        value={item.unitPrice || ''}
                        onChange={(e) => {
                          const newItems = [...invoiceForm.items]
                          newItems[idx] = {
                            ...newItems[idx],
                            unitPrice: parseFloat(e.target.value) || 0,
                          }
                          setInvoiceForm((p) => ({ ...p, items: newItems }))
                        }}
                        className="h-8 text-xs rounded-lg flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {invoiceForm.items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() =>
                          setInvoiceForm((p) => ({
                            ...p,
                            items: p.items.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <span className="text-xs font-medium text-foreground mt-1">
                      {fmt(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tax (PKR)</Label>
                <Input
                  type="number"
                  min={0}
                  value={invoiceForm.tax || ''}
                  onChange={(e) =>
                    setInvoiceForm((p) => ({
                      ...p,
                      tax: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Discount (PKR)</Label>
                <Input
                  type="number"
                  min={0}
                  value={invoiceForm.discount || ''}
                  onChange={(e) =>
                    setInvoiceForm((p) => ({
                      ...p,
                      discount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1 col-span-2">
                <Label className="text-xs">Total</Label>
                <div className="h-9 px-3 flex items-center rounded-lg border bg-muted/30 text-sm font-semibold text-foreground">
                  {fmt(
                    invoiceForm.items.reduce(
                      (s, i) => s + i.quantity * i.unitPrice,
                      0
                    ) +
                      invoiceForm.tax -
                      invoiceForm.discount
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                placeholder="Invoice notes..."
                value={invoiceForm.notes}
                onChange={(e) =>
                  setInvoiceForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="rounded-lg text-xs min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateInvoice(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={mutating}
              className="rounded-lg"
            >
              {mutating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block/Unblock Device Dialog */}
      <Dialog open={showBlockDevice} onOpenChange={setShowBlockDevice}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {targetDevice?.isBlocked ? (
                <Unlock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              ) : (
                <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              {targetDevice?.isBlocked ? 'Unblock Device' : 'Block Device'}
            </DialogTitle>
            <DialogDescription>
              {targetDevice?.isBlocked
                ? 'This device will be able to access the platform again'
                : 'This device will be prevented from accessing the platform'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            {targetDevice && (
              <div className="p-3 rounded-lg border border-border/50 bg-muted/30 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {targetDevice.deviceName || 'Unknown Device'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {targetDevice.os} · {targetDevice.browser}
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  {targetDevice.fingerprint.slice(0, 20)}...
                </p>
              </div>
            )}
            {!targetDevice?.isBlocked && (
              <div className="space-y-1.5">
                <Label className="text-xs">Reason for blocking</Label>
                <Textarea
                  placeholder="Enter reason..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="rounded-lg text-xs min-h-[60px]"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBlockDevice(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBlockDevice}
              disabled={mutating}
              className={cn(
                'rounded-lg',
                targetDevice?.isBlocked
                  ? ''
                  : 'bg-red-600 hover:bg-red-700 text-white'
              )}
            >
              {mutating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {targetDevice?.isBlocked ? 'Unblock' : 'Block Device'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Key AlertDialog */}
      <AlertDialog open={showRevokeKey} onOpenChange={setShowRevokeKey}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Serial Key</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke the serial key{' '}
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                {targetKey?.key}
              </code>
              . This action will deactivate the key and prevent any new device
              activations. This cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeKey}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {mutating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Client AlertDialog */}
      <AlertDialog
        open={showSuspendClient}
        onOpenChange={setShowSuspendClient}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Client</AlertDialogTitle>
            <AlertDialogDescription>
              This will suspend{' '}
              <strong>{targetClient?.name}</strong> and their tenant database.
              The client will lose access to the platform. You can reactivate
              them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendClient}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {mutating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Suspend Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terminate Client AlertDialog */}
      <AlertDialog
        open={showTerminateClient}
        onOpenChange={setShowTerminateClient}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Client</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently terminate{' '}
              <strong>{targetClient?.name}</strong>. Their serial key will be
              revoked and database marked as terminated. This is a destructive
              action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminateClient}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {mutating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Terminate Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ============ CLIENT DETAIL VIEW ============

function ClientDetailView({
  client,
  onBack,
  onProvision,
  onSuspend,
  onTerminate,
  onGenKey,
  onCreateInvoice,
  showToast,
  refreshData,
}: {
  client: Client
  onBack: () => void
  onProvision: (id: string) => void
  onSuspend: (c: Client) => void
  onTerminate: (c: Client) => void
  onGenKey: () => void
  onCreateInvoice: (clientId: string) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
  refreshData: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-muted"
          onClick={onBack}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {client.name}
          </h2>
          <p className="text-xs text-muted-foreground">{client.email}</p>
        </div>
        <StatusBadge status={client.status} />
      </div>

      {/* Company Info Card */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          Company Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: Mail, label: 'Email', value: client.email },
            { icon: Phone, label: 'Phone', value: client.phone },
            { icon: MapPin, label: 'City', value: client.city },
            { icon: Globe, label: 'Country', value: client.country },
            { icon: Hash, label: 'Slug', value: client.slug },
            {
              icon: Calendar,
              label: 'Created',
              value: fmtDate(client.createdAt),
            },
          ]
            .filter((f) => f.value)
            .map((f) => (
              <div
                key={f.label}
                className="p-3 rounded-lg border border-border/50"
              >
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <f.icon className="w-3 h-3" />
                  {f.label}
                </p>
                <p className="text-sm text-foreground mt-0.5 truncate">
                  {f.value}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Subscription & DB Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subscription */}
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Subscription
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Plan</span>
              <StatusBadge status={client.subscriptionPlan} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <StatusBadge status={client.subscriptionStatus} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Max Students</span>
              <span className="text-sm text-foreground">{client.maxStudents}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Max Staff</span>
              <span className="text-sm text-foreground">{client.maxStaff}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Max Campuses</span>
              <span className="text-sm text-foreground">
                {client.maxCampuses}
              </span>
            </div>
            {client.subscriptionEnd && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Expires</span>
                <span className="text-sm text-foreground">
                  {fmtDate(client.subscriptionEnd)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tenant DB */}
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Tenant Database
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">DB Name</span>
              <code className="text-xs font-mono text-foreground bg-muted/40 px-2 py-0.5 rounded">
                {client.dbName}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">DB Status</span>
              <StatusBadge status={client.dbStatus} />
            </div>
            {client.serialKey && (
              <>
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Serial Key
                  </span>
                  <div className="flex items-center gap-1.5">
                    <code className="text-xs font-mono text-foreground bg-muted/40 px-2 py-0.5 rounded">
                      {client.serialKey.key}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        navigator.clipboard.writeText(client.serialKey!.key)
                        showToast('Copied to clipboard')
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Key Type</span>
                  <StatusBadge status={client.serialKey.type} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Devices</span>
                  <span className="text-sm text-foreground">
                    {client.serialKey.usedDevices}/{client.serialKey.maxDevices}
                  </span>
                </div>
              </>
            )}
            {client.dbStatus === 'pending' && (
              <Button
                className="w-full mt-2 h-9 rounded-lg bg-amber-600 hover:bg-amber-700"
                onClick={() => onProvision(client.id)}
              >
                <ServerCog className="w-4 h-4 mr-1.5" />
                Provision Tenant DB
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {client.status === 'active' && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={onGenKey}
            >
              <Key className="w-3.5 h-3.5 mr-1" /> Generate Key
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => onCreateInvoice(client.id)}
            >
              <FileText className="w-3.5 h-3.5 mr-1" /> Create Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs text-amber-600 border-amber-200 hover:bg-amber-500/10"
              onClick={() => onSuspend(client)}
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Suspend
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs text-red-600 border-red-200 hover:bg-red-500/10"
              onClick={() => onTerminate(client)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Terminate
            </Button>
          </>
        )}
        {client.status === 'suspended' && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs text-teal-600 border-teal-200 hover:bg-teal-500/10"
            onClick={async () => {
              try {
                const res = await fetch(`/api/owner/clients/${client.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'active' }),
                })
                if (!res.ok) throw new Error('Failed to reactivate')
                showToast('Client reactivated')
                refreshData()
              } catch {
                showToast('Failed to reactivate', 'error')
              }
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Reactivate
          </Button>
        )}
      </div>

      {/* Devices & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Devices */}
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Devices ({client.devices?.length || 0})
          </h3>
          {client.devices && client.devices.length > 0 ? (
            <ScrollArea className="max-h-48">
              <div className="space-y-1.5">
                {client.devices.map((dev) => (
                  <div
                    key={dev.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {dev.deviceName || dev.fingerprint.slice(0, 16)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {dev.os || 'Unknown OS'}
                      </p>
                    </div>
                    <StatusBadge status={dev.isBlocked ? 'blocked' : 'active'} />
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-xs text-muted-foreground">No devices registered</p>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Recent Invoices ({client.invoices?.length || 0})
          </h3>
          {client.invoices && client.invoices.length > 0 ? (
            <ScrollArea className="max-h-48">
              <div className="space-y-1.5">
                {client.invoices.slice(0, 5).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {fmtDate(inv.issueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">
                        {fmt(inv.totalAmount)}
                      </span>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-xs text-muted-foreground">No invoices yet</p>
          )}
        </div>
      </div>

      {/* Activity Log */}
      {client.activityLogs && client.activityLogs.length > 0 && (
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Activity Log
          </h3>
          <ScrollArea className="max-h-48">
            <div className="space-y-1">
              {client.activityLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="w-5 h-5 rounded bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-foreground">{log.details || log.action}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {fmtRelative(log.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </motion.div>
  )
}

// ============ INVOICE PREVIEW ============

function InvoicePreview({
  invoice,
  onClose,
  onStatusChange,
  mutating,
}: {
  invoice: Invoice
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
  mutating: boolean
}) {
  const parsedItems = (() => {
    try {
      return typeof invoice.items === 'string'
        ? JSON.parse(invoice.items)
        : invoice.items
    } catch {
      return []
    }
  })()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={onClose}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={invoice.status} />
          {invoice.status === 'draft' && (
            <Button
              size="sm"
              className="h-8 rounded-lg"
              onClick={() => onStatusChange(invoice.id, 'sent')}
              disabled={mutating}
            >
              {mutating ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Send className="w-3 h-3 mr-1" />
              )}
              Mark Sent
            </Button>
          )}
          {invoice.status === 'sent' && (
            <Button
              size="sm"
              className="h-8 rounded-lg"
              onClick={() => onStatusChange(invoice.id, 'paid')}
              disabled={mutating}
            >
              {mutating ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              )}
              Mark Paid
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Document */}
      <div className="bg-card border border-border/50 rounded-xl p-6 sm:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  EduFlow
                </h1>
                <p className="text-[11px] text-teal-600 dark:text-teal-400">
                  Intelligent Education Platform
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              contact@eduflow.io
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-foreground">INVOICE</h2>
            <p className="text-sm font-mono text-foreground mt-0.5">
              {invoice.invoiceNumber}
            </p>
            <div className="mt-1.5 space-y-0.5">
              <p className="text-xs text-muted-foreground">
                Issue: {fmtDate(invoice.issueDate)}
              </p>
              <p className="text-xs text-muted-foreground">
                Due: {fmtDate(invoice.dueDate)}
              </p>
            </div>
          </div>
        </div>

        <Separator className="mb-5" />

        {/* Bill To */}
        <div className="mb-5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">
            Bill To
          </p>
          <p className="text-sm font-semibold text-foreground">
            {invoice.client?.name}
          </p>
          {invoice.client?.email && (
            <p className="text-xs text-muted-foreground">
              {invoice.client.email}
            </p>
          )}
          {(invoice.client?.city || invoice.client?.country) && (
            <p className="text-xs text-muted-foreground">
              {[invoice.client?.city, invoice.client?.country]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
        </div>

        {/* Items Table */}
        {parsedItems.length > 0 && (
          <div className="rounded-lg border border-border/50 overflow-hidden mb-5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left p-2.5 text-[11px] text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-center p-2.5 text-[11px] text-muted-foreground uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="text-right p-2.5 text-[11px] text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.map(
                  (item: { description?: string; quantity?: number; amount?: number }, i: number) => (
                    <tr
                      key={i}
                      className={cn(
                        i < parsedItems.length - 1 && 'border-b border-border/50'
                      )}
                    >
                      <td className="p-2.5 text-foreground">
                        {item.description || '—'}
                      </td>
                      <td className="p-2.5 text-center text-foreground">
                        {item.quantity || 1}
                      </td>
                      <td className="p-2.5 text-right text-foreground font-medium">
                        {fmt(item.amount || 0)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{fmt(invoice.amount)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-red-600 dark:text-red-400">
                  -{fmt(invoice.discount)}
                </span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground">{fmt(invoice.tax)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-foreground font-bold">Total</span>
              <span className="text-teal-600 dark:text-teal-400 font-bold">
                {fmt(invoice.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-5 p-3 rounded-lg border border-border/50">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
              Notes
            </p>
            <p className="text-xs text-foreground">{invoice.notes}</p>
          </div>
        )}

        {/* Paid stamp */}
        {invoice.status === 'paid' && invoice.paidDate && (
          <div className="mt-4 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
            <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">
              Paid on {fmtDate(invoice.paidDate)}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
