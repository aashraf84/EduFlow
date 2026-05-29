'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Key,
  Monitor,
  FileText,
  Receipt,
  Plus,
  Shield,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  ArrowRightLeft,
  TrendingUp,
  Copy,
  Eye,
  MoreHorizontal,
  Loader2,
  GraduationCap,
  Hash,
  CreditCard,
  HandCoins,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'

// ── Types ───────────────────────────────────────────────────────
interface DashboardStats {
  totalClients: number
  activeKeys: number
  totalDevices: number
  revenue: number
  outstanding: number
  pendingApprovals: number
}

interface Client {
  id: string
  company: string
  contactPerson: string
  email: string
  phone: string
  status: string
  schoolsCount: number
  keysCount: number
}

interface SerialKey {
  id: string
  key: string
  client: string
  clientId: string
  plan: string
  maxDevices: number
  maxStudents: number
  status: string
  school: string
  expiry: string
}

interface Device {
  id: string
  deviceName: string
  fingerprint: string
  browser: string
  os: string
  client: string
  serialKey: string
  status: string
  approved: boolean
  lastAccessed: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  client: string
  clientId: string
  issueDate: string
  dueDate: string
  total: number
  subtotal: number
  tax: number
  discount: number
  status: string
  items: InvoiceItem[]
  terms?: string
  notes?: string
}

interface Quotation {
  id: string
  quotationNumber: string
  client: string
  clientId: string
  issueDate: string
  validUntil: string
  total: number
  subtotal: number
  tax: number
  discount: number
  status: string
  items: InvoiceItem[]
  terms?: string
  notes?: string
}

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

// ── Color maps ──────────────────────────────────────────────────
const keyStatusColors: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  activated: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
}

const deviceStatusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  revoked: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
}

const invoiceStatusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  sent: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
}

const quotationStatusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  sent: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  declined: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
}

// ── Helpers ─────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Dashboard Tab ───────────────────────────────────────────────
function DashboardTab() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['owner-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/owner/dashboard')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      return json.data
    },
    staleTime: 30_000,
  })

  const stats = [
    { title: 'Total Clients', value: data?.totalClients ?? 0, icon: Building2, iconBg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'Active Keys', value: data?.activeKeys ?? 0, icon: Key, iconBg: 'bg-teal-50 dark:bg-teal-950/30', iconColor: 'text-teal-600 dark:text-teal-400' },
    { title: 'Total Devices', value: data?.totalDevices ?? 0, icon: Monitor, iconBg: 'bg-sky-50 dark:bg-sky-950/30', iconColor: 'text-sky-600 dark:text-sky-400' },
    { title: 'Revenue', value: formatCurrency(data?.revenue ?? 0), icon: DollarSign, iconBg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'Outstanding', value: formatCurrency(data?.outstanding ?? 0), icon: HandCoins, iconBg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600 dark:text-amber-400' },
    { title: 'Pending Approvals', value: data?.pendingApprovals ?? 0, icon: AlertCircle, iconBg: 'bg-rose-50 dark:bg-rose-950/30', iconColor: 'text-rose-600 dark:text-rose-400' },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Owner Dashboard</h2>
        <p className="text-sm text-muted-foreground">Overview of your EduFlow OS business</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}

// ── Clients Tab ─────────────────────────────────────────────────
function ClientsTab() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState({ company: '', contactPerson: '', email: '', phone: '', status: 'active' })

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['owner-clients'],
    queryFn: async () => {
      const res = await fetch('/api/owner/clients')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      return json.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/owner/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-clients'] })
      setDialogOpen(false)
      setForm({ company: '', contactPerson: '', email: '', phone: '', status: 'active' })
      setEditingClient(null)
    },
  })

  const openEdit = (client: Client) => {
    setEditingClient(client)
    setForm({ company: client.company, contactPerson: client.contactPerson, email: client.email, phone: client.phone, status: client.status })
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingClient(null)
    setForm({ company: '', contactPerson: '', email: '', phone: '', status: 'active' })
    setDialogOpen(true)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Clients</h2>
          <p className="text-sm text-muted-foreground">Manage your business clients</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
              <Plus className="h-4 w-4 mr-2" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Contact person" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91-XXXXX" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingClient ? 'Update Client' : 'Create Client'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Schools</TableHead>
                    <TableHead className="hidden sm:table-cell">Keys</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.company}</TableCell>
                      <TableCell>{client.contactPerson}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{client.email}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{client.phone}</TableCell>
                      <TableCell>
                        <Badge className={client.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : client.status === 'suspended' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{client.schoolsCount}</TableCell>
                      <TableCell className="hidden sm:table-cell">{client.keysCount}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(client)} className="h-8 text-xs">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!clients || clients.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No clients found. Add your first client.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Serial Keys Tab ─────────────────────────────────────────────
function SerialKeysTab() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ clientId: '', plan: 'starter', maxDevices: 3, maxStudents: 500, notes: '' })

  const { data: keys, isLoading } = useQuery<SerialKey[]>({
    queryKey: ['owner-serial-keys'],
    queryFn: async () => {
      const res = await fetch('/api/owner/serial-keys')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      return json.data
    },
  })

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['owner-clients'],
    queryFn: async () => {
      const res = await fetch('/api/owner/clients')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      return json.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/owner/serial-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to generate')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-serial-keys'] })
      setDialogOpen(false)
      setForm({ clientId: '', plan: 'starter', maxDevices: 3, maxStudents: 500, notes: '' })
    },
  })

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Serial Keys</h2>
          <p className="text-sm text-muted-foreground">Generate and manage license keys</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
              <Plus className="h-4 w-4 mr-2" /> Generate Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Serial Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={form.plan} onValueChange={(v) => {
                  const defaults: Record<string, { maxDevices: number; maxStudents: number }> = {
                    starter: { maxDevices: 3, maxStudents: 500 },
                    professional: { maxDevices: 10, maxStudents: 2000 },
                    enterprise: { maxDevices: 50, maxStudents: 10000 },
                  }
                  const d = defaults[v] || defaults.starter
                  setForm({ ...form, plan: v, maxDevices: d.maxDevices, maxStudents: d.maxStudents })
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Max Devices</Label>
                  <Input type="number" value={form.maxDevices} onChange={(e) => setForm({ ...form, maxDevices: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Students</Label>
                  <Input type="number" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" rows={2} />
              </div>
              <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Plan</TableHead>
                    <TableHead className="hidden lg:table-cell">Max Devices</TableHead>
                    <TableHead className="hidden lg:table-cell">Max Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">School</TableHead>
                    <TableHead className="hidden md:table-cell">Expiry</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys?.map((sk) => (
                    <TableRow key={sk.id}>
                      <TableCell>
                        <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{sk.key}</code>
                      </TableCell>
                      <TableCell className="font-medium">{sk.client}</TableCell>
                      <TableCell className="hidden md:table-cell capitalize">{sk.plan}</TableCell>
                      <TableCell className="hidden lg:table-cell">{sk.maxDevices}</TableCell>
                      <TableCell className="hidden lg:table-cell">{sk.maxStudents}</TableCell>
                      <TableCell>
                        <Badge className={keyStatusColors[sk.status] || keyStatusColors.available}>{sk.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{sk.school || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{sk.expiry ? new Date(sk.expiry).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => copyKey(sk.key)} className="h-8 text-xs">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!keys || keys.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No serial keys found. Generate your first key.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Devices Tab ─────────────────────────────────────────────────
function DevicesTab() {
  const queryClient = useQueryClient()
  const [filterClient, setFilterClient] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const { data: devices, isLoading } = useQuery<Device[]>({
    queryKey: ['owner-devices'],
    queryFn: async () => {
      const res = await fetch('/api/owner/devices')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      return json.data
    },
  })

  const approveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'revoke' }) => {
      const res = await fetch('/api/owner/devices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-devices'] })
    },
  })

  const filteredDevices = devices?.filter((d) => {
    if (filterClient !== 'all' && d.client !== filterClient) return false
    if (filterStatus !== 'all' && d.status !== filterStatus) return false
    return true
  })

  const uniqueClients = [...new Set(devices?.map((d) => d.client) || [])]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Devices</h2>
          <p className="text-sm text-muted-foreground">Monitor and manage connected devices</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="All Clients" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {uniqueClients.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device Name</TableHead>
                    <TableHead className="hidden lg:table-cell">Fingerprint</TableHead>
                    <TableHead className="hidden md:table-cell">Browser</TableHead>
                    <TableHead className="hidden md:table-cell">OS</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden lg:table-cell">Serial Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Approved</TableHead>
                    <TableHead className="hidden md:table-cell">Last Accessed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices?.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{device.deviceName}</TableCell>
                      <TableCell className="hidden lg:table-cell"><code className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">{device.fingerprint.slice(0, 16)}...</code></TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{device.browser}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{device.os}</TableCell>
                      <TableCell>{device.client}</TableCell>
                      <TableCell className="hidden lg:table-cell"><code className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">{device.serialKey}</code></TableCell>
                      <TableCell>
                        <Badge className={deviceStatusColors[device.status] || deviceStatusColors.pending}>{device.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {device.approved ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{new Date(device.lastAccessed).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!device.approved && (
                            <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate({ id: device.id, action: 'approve' })} className="h-7 text-xs text-emerald-600 hover:text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                          )}
                          {device.approved && device.status !== 'revoked' && (
                            <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate({ id: device.id, action: 'revoke' })} className="h-7 text-xs text-red-600 hover:text-red-700">
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Revoke
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredDevices || filteredDevices.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No devices found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Invoice Print View ──────────────────────────────────────────
function PrintView({ data, type }: { data: Invoice | Quotation; type: 'invoice' | 'quotation' }) {
  const isInvoice = type === 'invoice'
  const inv = data as Invoice
  const quot = data as Quotation

  return (
    <div className="print-view" id="print-area" style={{
      width: '8.5in',
      minHeight: '11in',
      padding: '0.5in',
      margin: '0 auto',
      background: 'white',
      color: '#1a1a1a',
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      fontSize: '11px',
      lineHeight: '1.5',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: 'bold' }}>E</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>EduFlow OS</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>Education Management Platform</div>
            </div>
          </div>
          <div style={{ marginTop: '8px', color: '#6b7280', fontSize: '10px' }}>
            <div>123 Education Lane, Tech Park</div>
            <div>Bangalore, Karnataka 560001</div>
            <div>contact@eduflow.io | +91-800-123-4567</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: isInvoice ? '#10b981' : '#14b8a6' }}>
            {isInvoice ? 'INVOICE' : 'QUOTATION'}
          </div>
          <div style={{ marginTop: '8px', color: '#6b7280' }}>
            <div><strong>{isInvoice ? 'Invoice' : 'Quotation'} #:</strong> {isInvoice ? inv.invoiceNumber : quot.quotationNumber}</div>
            <div><strong>Issue Date:</strong> {new Date(data.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div><strong>{isInvoice ? 'Due Date' : 'Valid Until'}:</strong> {new Date(isInvoice ? inv.dueDate : quot.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div style={{ marginBottom: '30px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '4px' }}>Bill To</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{data.client}</div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>#</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Description</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Qty</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Unit Price</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 12px', color: '#64748b' }}>{idx + 1}</td>
              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{item.description}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{item.quantity}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>₹{item.unitPrice.toLocaleString('en-IN')}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>₹{item.total.toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
        <div style={{ width: '250px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#64748b' }}>
            <span>Subtotal</span>
            <span>₹{data.subtotal.toLocaleString('en-IN')}</span>
          </div>
          {data.tax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#64748b' }}>
              <span>Tax</span>
              <span>₹{data.tax.toLocaleString('en-IN')}</span>
            </div>
          )}
          {data.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#10b981' }}>
              <span>Discount</span>
              <span>-₹{data.discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div style={{ borderTop: '2px solid #e2e8f0', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700 }}>
            <span>Grand Total</span>
            <span style={{ color: '#10b981' }}>₹{data.total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      {data.terms && (
        <div style={{ marginBottom: '20px', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '4px' }}>Terms & Conditions</div>
          <div style={{ color: '#64748b', whiteSpace: 'pre-wrap' }}>{data.terms}</div>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '4px' }}>Notes</div>
          <div style={{ color: '#64748b', whiteSpace: 'pre-wrap' }}>{data.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a' }}>Thank you for your business</div>
        <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px' }}>EduFlow OS — Powering Education Worldwide</div>
      </div>
    </div>
  )
}

// ── Invoices & Quotations Tab ───────────────────────────────────
function InvoicesQuotationsTab() {
  const queryClient = useQueryClient()
  const [subTab, setSubTab] = useState('invoices')
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [quotationDialogOpen, setQuotationDialogOpen] = useState(false)
  const [printData, setPrintData] = useState<{ data: Invoice | Quotation; type: 'invoice' | 'quotation' } | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  // Invoice form
  const [invForm, setInvForm] = useState({
    clientId: '', dueDate: '', taxRate: 18, discount: 0, terms: '', notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] as InvoiceItem[],
  })

  // Quotation form
  const [quotForm, setQuotForm] = useState({
    clientId: '', validUntil: '', taxRate: 18, discount: 0, terms: '', notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] as InvoiceItem[],
  })

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['owner-clients'],
    queryFn: async () => {
      const res = await fetch('/api/owner/clients')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      return json.data
    },
  })

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['owner-invoices'],
    queryFn: async () => {
      const res = await fetch('/api/owner/invoices')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      return json.data
    },
  })

  const { data: quotations, isLoading: quotationsLoading } = useQuery<Quotation[]>({
    queryKey: ['owner-quotations'],
    queryFn: async () => {
      const res = await fetch('/api/owner/quotations')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      return json.data
    },
  })

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: typeof invForm) => {
      const res = await fetch('/api/owner/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-invoices'] })
      setInvoiceDialogOpen(false)
      resetInvForm()
    },
  })

  const createQuotationMutation = useMutation({
    mutationFn: async (data: typeof quotForm) => {
      const res = await fetch('/api/owner/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-quotations'] })
      setQuotationDialogOpen(false)
      resetQuotForm()
    },
  })

  const resetInvForm = () => {
    setInvForm({ clientId: '', dueDate: '', taxRate: 18, discount: 0, terms: '', notes: '', items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] })
  }

  const resetQuotForm = () => {
    setQuotForm({ clientId: '', validUntil: '', taxRate: 18, discount: 0, terms: '', notes: '', items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] })
  }

  const addItem = (type: 'invoice' | 'quotation') => {
    if (type === 'invoice') {
      setInvForm({ ...invForm, items: [...invForm.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }] })
    } else {
      setQuotForm({ ...quotForm, items: [...quotForm.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }] })
    }
  }

  const updateItem = (type: 'invoice' | 'quotation', idx: number, field: keyof InvoiceItem, value: string | number) => {
    const form = type === 'invoice' ? invForm : quotForm
    const setForm = type === 'invoice' ? setInvForm : setQuotForm
    const items = [...form.items]
    items[idx] = { ...items[idx], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      items[idx].total = items[idx].quantity * items[idx].unitPrice
    }
    setForm({ ...form, items })
  }

  const removeItem = (type: 'invoice' | 'quotation', idx: number) => {
    const form = type === 'invoice' ? invForm : quotForm
    const setForm = type === 'invoice' ? setInvForm : setQuotForm
    const items = form.items.filter((_, i) => i !== idx)
    setForm({ ...form, items })
  }

  const calcTotals = (form: typeof invForm) => {
    const subtotal = form.items.reduce((s, i) => s + i.total, 0)
    const tax = Math.round(subtotal * form.taxRate / 100)
    const total = subtotal + tax - form.discount
    return { subtotal, tax, total }
  }

  const handlePrint = (data: Invoice | Quotation, type: 'invoice' | 'quotation') => {
    setPrintData({ data, type })
    setTimeout(() => {
      const printContent = document.getElementById('print-area')
      if (printContent) {
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>${type === 'invoice' ? 'Invoice' : 'Quotation'} - ${(data as Invoice).invoiceNumber || (data as Quotation).quotationNumber}</title>
                <style>
                  @page { size: letter; margin: 0; }
                  body { margin: 0; font-family: "Inter", "Segoe UI", system-ui, sans-serif; }
                </style>
              </head>
              <body>${printContent.innerHTML}</body>
            </html>
          `)
          printWindow.document.close()
          printWindow.print()
        }
      }
    }, 300)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Hidden print area */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {printData && <PrintView data={printData.data} type={printData.type} />}
      </div>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Invoices & Quotations</h2>
            <p className="text-sm text-muted-foreground">Manage billing documents</p>
          </div>
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
          </TabsList>
        </div>

        {/* Invoices Sub-tab */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setInvoiceDialogOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <Plus className="h-4 w-4 mr-2" /> Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Invoice</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Client</Label>
                      <Select value={invForm.clientId} onValueChange={(v) => setInvForm({ ...invForm, clientId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                        <SelectContent>
                          {clients?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input type="date" value={invForm.dueDate} onChange={(e) => setInvForm({ ...invForm, dueDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input type="number" value={invForm.taxRate} onChange={(e) => setInvForm({ ...invForm, taxRate: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Discount (₹)</Label>
                      <Input type="number" value={invForm.discount} onChange={(e) => setInvForm({ ...invForm, discount: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Line Items</Label>
                    <div className="space-y-2">
                      {invForm.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5">
                            {idx === 0 && <Label className="text-[10px] text-muted-foreground">Description</Label>}
                            <Input value={item.description} onChange={(e) => updateItem('invoice', idx, 'description', e.target.value)} placeholder="Item description" className="h-9 text-xs" />
                          </div>
                          <div className="col-span-2">
                            {idx === 0 && <Label className="text-[10px] text-muted-foreground">Qty</Label>}
                            <Input type="number" value={item.quantity} onChange={(e) => updateItem('invoice', idx, 'quantity', parseInt(e.target.value) || 0)} className="h-9 text-xs" />
                          </div>
                          <div className="col-span-2">
                            {idx === 0 && <Label className="text-[10px] text-muted-foreground">Unit Price</Label>}
                            <Input type="number" value={item.unitPrice} onChange={(e) => updateItem('invoice', idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="h-9 text-xs" />
                          </div>
                          <div className="col-span-2">
                            {idx === 0 && <Label className="text-[10px] text-muted-foreground">Total</Label>}
                            <div className="h-9 flex items-center text-xs font-medium px-3 bg-muted rounded-md">₹{item.total.toLocaleString('en-IN')}</div>
                          </div>
                          <div className="col-span-1">
                            {idx > 0 && (
                              <Button variant="ghost" size="sm" onClick={() => removeItem('invoice', idx)} className="h-9 w-9 p-0 text-red-500">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addItem('invoice')} className="mt-2 h-8 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add Item
                    </Button>
                  </div>

                  {/* Totals */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{calcTotals(invForm).subtotal.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tax ({invForm.taxRate}%)</span><span>₹{calcTotals(invForm).tax.toLocaleString('en-IN')}</span></div>
                    {invForm.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{invForm.discount.toLocaleString('en-IN')}</span></div>}
                    <Separator />
                    <div className="flex justify-between font-bold text-base"><span>Grand Total</span><span className="text-emerald-600">₹{calcTotals(invForm).total.toLocaleString('en-IN')}</span></div>
                  </div>

                  <div className="space-y-2">
                    <Label>Terms & Conditions</Label>
                    <Textarea value={invForm.terms} onChange={(e) => setInvForm({ ...invForm, terms: e.target.value })} placeholder="Payment terms, conditions..." rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={invForm.notes} onChange={(e) => setInvForm({ ...invForm, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
                  </div>

                  <Button onClick={() => createInvoiceMutation.mutate(invForm)} disabled={createInvoiceMutation.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    {createInvoiceMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Invoice
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {invoicesLoading ? (
                <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="hidden md:table-cell">Issue Date</TableHead>
                        <TableHead className="hidden md:table-cell">Due Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices?.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium font-mono text-xs">{inv.invoiceNumber}</TableCell>
                          <TableCell>{inv.client}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell className="font-semibold">₹{inv.total.toLocaleString('en-IN')}</TableCell>
                          <TableCell><Badge className={invoiceStatusColors[inv.status] || invoiceStatusColors.draft}>{inv.status}</Badge></TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handlePrint(inv, 'invoice')} className="h-8 text-xs">
                              <Printer className="h-3.5 w-3.5 mr-1" /> Print
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!invoices || invoices.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No invoices found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotations Sub-tab */}
        <TabsContent value="quotations" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={quotationDialogOpen} onOpenChange={setQuotationDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setQuotationDialogOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <Plus className="h-4 w-4 mr-2" /> Create Quotation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Quotation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Client</Label>
                      <Select value={quotForm.clientId} onValueChange={(v) => setQuotForm({ ...quotForm, clientId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                        <SelectContent>
                          {clients?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valid Until</Label>
                      <Input type="date" value={quotForm.validUntil} onChange={(e) => setQuotForm({ ...quotForm, validUntil: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input type="number" value={quotForm.taxRate} onChange={(e) => setQuotForm({ ...quotForm, taxRate: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Discount (₹)</Label>
                      <Input type="number" value={quotForm.discount} onChange={(e) => setQuotForm({ ...quotForm, discount: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Line Items</Label>
                    <div className="space-y-2">
                      {quotForm.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5">
                            {idx === 0 && <Label className="text-[10px] text-muted-foreground">Description</Label>}
                            <Input value={item.description} onChange={(e) => updateItem('quotation', idx, 'description', e.target.value)} placeholder="Item description" className="h-9 text-xs" />
                          </div>
                          <div className="col-span-2">
                            {idx === 0 && <Label className="text-[10px] text-muted-foreground">Qty</Label>}
                            <Input type="number" value={item.quantity} onChange={(e) => updateItem('quotation', idx, 'quantity', parseInt(e.target.value) || 0)} className="h-9 text-xs" />
                          </div>
                          <div className="col-span-2">
                            {idx === 0 && <Label className="text-[10px] text-muted-foreground">Unit Price</Label>}
                            <Input type="number" value={item.unitPrice} onChange={(e) => updateItem('quotation', idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="h-9 text-xs" />
                          </div>
                          <div className="col-span-2">
                            {idx === 0 && <Label className="text-[10px] text-muted-foreground">Total</Label>}
                            <div className="h-9 flex items-center text-xs font-medium px-3 bg-muted rounded-md">₹{item.total.toLocaleString('en-IN')}</div>
                          </div>
                          <div className="col-span-1">
                            {idx > 0 && (
                              <Button variant="ghost" size="sm" onClick={() => removeItem('quotation', idx)} className="h-9 w-9 p-0 text-red-500">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addItem('quotation')} className="mt-2 h-8 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add Item
                    </Button>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{calcTotals(quotForm).subtotal.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tax ({quotForm.taxRate}%)</span><span>₹{calcTotals(quotForm).tax.toLocaleString('en-IN')}</span></div>
                    {quotForm.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{quotForm.discount.toLocaleString('en-IN')}</span></div>}
                    <Separator />
                    <div className="flex justify-between font-bold text-base"><span>Grand Total</span><span className="text-emerald-600">₹{calcTotals(quotForm).total.toLocaleString('en-IN')}</span></div>
                  </div>

                  <div className="space-y-2">
                    <Label>Terms & Conditions</Label>
                    <Textarea value={quotForm.terms} onChange={(e) => setQuotForm({ ...quotForm, terms: e.target.value })} placeholder="Terms..." rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={quotForm.notes} onChange={(e) => setQuotForm({ ...quotForm, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
                  </div>

                  <Button onClick={() => createQuotationMutation.mutate(quotForm)} disabled={createQuotationMutation.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    {createQuotationMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Quotation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {quotationsLoading ? (
                <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quote #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="hidden md:table-cell">Issue Date</TableHead>
                        <TableHead className="hidden md:table-cell">Valid Until</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotations?.map((quot) => (
                        <TableRow key={quot.id}>
                          <TableCell className="font-medium font-mono text-xs">{quot.quotationNumber}</TableCell>
                          <TableCell>{quot.client}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{new Date(quot.issueDate).toLocaleDateString()}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{new Date(quot.validUntil).toLocaleDateString()}</TableCell>
                          <TableCell className="font-semibold">₹{quot.total.toLocaleString('en-IN')}</TableCell>
                          <TableCell><Badge className={quotationStatusColors[quot.status] || quotationStatusColors.draft}>{quot.status}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handlePrint(quot, 'quotation')} className="h-8 text-xs">
                                <Printer className="h-3.5 w-3.5 mr-1" /> Print
                              </Button>
                              {quot.status === 'accepted' && (
                                <Button variant="ghost" size="sm" className="h-8 text-xs text-emerald-600">
                                  <ArrowRightLeft className="h-3.5 w-3.5 mr-1" /> Convert
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!quotations || quotations.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No quotations found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

// ── Main Owner Module ───────────────────────────────────────────
export function OwnerModule() {
  const { isViewOnly } = useAppStore()

  return (
    <div className="space-y-4">
      {isViewOnly && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-300">View-only mode — You cannot make changes in demo mode</span>
        </div>
      )}

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 hidden sm:block" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="clients" className="text-xs sm:text-sm gap-1.5">
            <Building2 className="h-3.5 w-3.5 hidden sm:block" /> Clients
          </TabsTrigger>
          <TabsTrigger value="serial-keys" className="text-xs sm:text-sm gap-1.5">
            <Key className="h-3.5 w-3.5 hidden sm:block" /> Serial Keys
          </TabsTrigger>
          <TabsTrigger value="devices" className="text-xs sm:text-sm gap-1.5">
            <Monitor className="h-3.5 w-3.5 hidden sm:block" /> Devices
          </TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs sm:text-sm gap-1.5">
            <Receipt className="h-3.5 w-3.5 hidden sm:block" /> Invoicing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="clients"><ClientsTab /></TabsContent>
        <TabsContent value="serial-keys"><SerialKeysTab /></TabsContent>
        <TabsContent value="devices"><DevicesTab /></TabsContent>
        <TabsContent value="invoices"><InvoicesQuotationsTab /></TabsContent>
      </Tabs>
    </div>
  )
}
