'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
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
import {
  Package, Search, Plus, AlertTriangle, DollarSign, Wrench,
  TrendingUp, ArrowUpRight, ArrowDownRight, Filter, MapPin,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// ── Color palette ───────────────────────────────────────────────
const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b']

const CONDITION_BADGE: Record<string, string> = {
  excellent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  good: 'bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400',
  fair: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  poor: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  needs_repair: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  disposed: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  maintenance: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
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
interface Asset {
  id: string
  name: string
  assetCode: string
  category: string
  purchaseDate: string
  purchaseCost: number
  condition: string
  location: string | null
  assignedTo: string | null
  vendor: string | null
  warrantyEnd: string | null
  depreciation: number
  status: string
}

interface InventoryData {
  assets: Asset[]
  stats: { totalAssets: number; activeAssets: number; totalValue: number; maintenanceDue: number }
  byCategoryData: { category: string; count: number; value: number }[]
  byConditionData: { condition: string; count: number }[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
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
export function InventoryModule() {
  const { user } = useAppStore()
  const queryClient = useQueryClient()
  const schoolId = user?.schoolId || ''

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formAssetCode, setFormAssetCode] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formPurchaseDate, setFormPurchaseDate] = useState('')
  const [formPurchaseCost, setFormPurchaseCost] = useState('')
  const [formCondition, setFormCondition] = useState('good')
  const [formLocation, setFormLocation] = useState('')
  const [formAssignedTo, setFormAssignedTo] = useState('')
  const [formVendor, setFormVendor] = useState('')
  const [formWarrantyEnd, setFormWarrantyEnd] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery<InventoryData>({
    queryKey: ['inventory', schoolId, search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (schoolId) params.set('schoolId', schoolId)
      if (search) params.set('search', search)
      if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter)
      const res = await fetch(`/api/inventory?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch inventory data')
      const json = await res.json()
      return json.data
    },
    staleTime: 30_000,
  })

  const addAssetMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Asset added successfully')
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setAddDialogOpen(false)
      resetForm()
    },
    onError: (err: Error) => { toast.error(err.message) },
  })

  function resetForm() {
    setFormName(''); setFormAssetCode(''); setFormCategory(''); setFormPurchaseDate('')
    setFormPurchaseCost(''); setFormCondition('good'); setFormLocation(''); setFormAssignedTo('')
    setFormVendor(''); setFormWarrantyEnd('')
  }

  function handleAddAsset() {
    if (!formName || !formAssetCode || !formCategory) { toast.error('Name, asset code, and category are required'); return }
    addAssetMutation.mutate({
      schoolId, name: formName, assetCode: formAssetCode, category: formCategory,
      purchaseDate: formPurchaseDate, purchaseCost: formPurchaseCost, condition: formCondition,
      location: formLocation, assignedTo: formAssignedTo, vendor: formVendor, warrantyEnd: formWarrantyEnd,
    })
  }

  const stats = data?.stats || { totalAssets: 0, activeAssets: 0, totalValue: 0, maintenanceDue: 0 }
  const byCategoryData = data?.byCategoryData || []
  const byConditionData = data?.byConditionData || []

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
        <h3 className="text-lg font-semibold">Failed to load inventory data</h3>
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
            <Package className="h-5 w-5 text-emerald-500" />
            Inventory & Assets
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track assets, manage inventory, and monitor maintenance</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Add Asset
        </Button>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Assets" value={stats.totalAssets} icon={Package} trend="up" trendLabel="Registered" iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Active Assets" value={stats.activeAssets} icon={TrendingUp} trend="neutral" trendLabel="In service" iconBg="bg-teal-50 dark:bg-teal-950/30" iconColor="text-teal-600 dark:text-teal-400" />
        <StatCard title="Total Value" value={formatCurrency(stats.totalValue)} icon={DollarSign} trend="up" trendLabel="Portfolio" iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" />
        <StatCard title="Needs Maintenance" value={stats.maintenanceDue} icon={Wrench} trend={stats.maintenanceDue > 0 ? 'down' : 'neutral'} trendLabel={stats.maintenanceDue > 0 ? 'Action needed' : 'All clear'} iconBg="bg-red-50 dark:bg-red-950/30" iconColor="text-red-600 dark:text-red-400" />
      </div>

      {/* ── Search & Filters ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search assets, locations, assignees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-44 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="IT Equipment">IT Equipment</SelectItem>
            <SelectItem value="Furniture">Furniture</SelectItem>
            <SelectItem value="Lab Equipment">Lab Equipment</SelectItem>
            <SelectItem value="Sports">Sports</SelectItem>
            <SelectItem value="Library">Library</SelectItem>
            <SelectItem value="Office">Office</SelectItem>
            <SelectItem value="Vehicle">Vehicle</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* ── Asset Table ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-500" /> Asset Registry
            </CardTitle>
            <CardDescription className="text-xs">{data?.assets.length || 0} assets found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Asset Code</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Purchase Date</TableHead>
                    <TableHead className="text-xs">Cost</TableHead>
                    <TableHead className="text-xs">Condition</TableHead>
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-xs">Assigned To</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.assets || []).length > 0 ? (data?.assets || []).map((asset) => (
                    <TableRow key={asset.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-medium max-w-[120px] truncate">{asset.name}</TableCell>
                      <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{asset.assetCode}</Badge></TableCell>
                      <TableCell className="text-xs">{asset.category}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(asset.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                      <TableCell className="text-xs font-medium">{formatCurrency(asset.purchaseCost)}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${CONDITION_BADGE[asset.condition] || CONDITION_BADGE.good}`}>
                          {asset.condition.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                          {asset.location || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{asset.assignedTo || '-'}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${STATUS_BADGE[asset.status] || STATUS_BADGE.active}`}>{asset.status}</Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-sm">No assets found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Analytics ── */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Assets by category - Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> Assets by Category</CardTitle>
              <CardDescription className="text-xs">Distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                {byCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byCategoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="count" label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}>
                        {byCategoryData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data</div>}
              </div>
            </CardContent>
          </Card>

          {/* Value by category - Bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-teal-500" /> Value by Category</CardTitle>
              <CardDescription className="text-xs">Purchase cost breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                {byCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byCategoryData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="category" className="text-xs" tick={{ fontSize: 10 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Value (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data</div>}
              </div>
            </CardContent>
          </Card>

          {/* Condition distribution - Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Wrench className="h-4 w-4 text-amber-500" /> Condition Distribution</CardTitle>
              <CardDescription className="text-xs">Asset health overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                {byConditionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byConditionData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="count" label={({ condition, percent }) => `${condition.replace('_', ' ')} (${(percent * 100).toFixed(0)}%)`}>
                        {byConditionData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ── Add Asset Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-emerald-500" /> Add New Asset</DialogTitle>
            <DialogDescription>Register a new asset in the inventory system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-xs font-medium">Asset Name *</Label><Input placeholder="e.g. Dell Monitor" value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Asset Code *</Label><Input placeholder="e.g. AST-001" value={formAssetCode} onChange={(e) => setFormAssetCode(e.target.value)} /></div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Category *</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT Equipment">IT Equipment</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Lab Equipment">Lab Equipment</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Library">Library</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Vehicle">Vehicle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-xs font-medium">Purchase Date</Label><Input type="date" value={formPurchaseDate} onChange={(e) => setFormPurchaseDate(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Purchase Cost (₹)</Label><Input type="number" placeholder="0" value={formPurchaseCost} onChange={(e) => setFormPurchaseCost(e.target.value)} /></div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Condition</Label>
                <Select value={formCondition} onValueChange={setFormCondition}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="needs_repair">Needs Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-xs font-medium">Location</Label><Input placeholder="e.g. Room 201" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Assigned To</Label><Input placeholder="Person or dept" value={formAssignedTo} onChange={(e) => setFormAssignedTo(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Vendor</Label><Input placeholder="Vendor name" value={formVendor} onChange={(e) => setFormVendor(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Warranty End</Label><Input type="date" value={formWarrantyEnd} onChange={(e) => setFormWarrantyEnd(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="h-9">Cancel</Button>
            <Button onClick={handleAddAsset} disabled={addAssetMutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              {addAssetMutation.isPending ? 'Adding...' : 'Add Asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
