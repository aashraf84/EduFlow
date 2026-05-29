'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Bus, Search, Plus, AlertTriangle, Route, Users, MapPin, Phone, TrendingUp,
  ArrowUpRight, ArrowDownRight, Filter,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// ── Color palette ───────────────────────────────────────────────
const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6']

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  maintenance: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
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
interface TransportAssignment {
  id: string
  studentId: string
  pickupPoint: string | null
  dropPoint: string | null
  status: string
}

interface TransportRoute {
  id: string
  routeName: string
  routeNumber: string
  driverName: string
  driverPhone: string
  vehicleNo: string
  capacity: number
  stops: string | null
  morningTime: string | null
  eveningTime: string | null
  status: string
  assignments: TransportAssignment[]
}

interface TransportData {
  routes: TransportRoute[]
  stats: { totalRoutes: number; totalVehicles: number; studentsUsing: number; activeRoutes: number }
  routeUtilization: { name: string; capacity: number; assigned: number }[]
}

// ── Stat Card ───────────────────────────────────────────────────
function StatCard({
  title, value, icon: Icon, trend, trendLabel, iconBg, iconColor,
}: {
  title: string; value: string | number; icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string
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
export function TransportModule() {
  const { user } = useAppStore()
  const queryClient = useQueryClient()
  const schoolId = user?.schoolId || ''

  const [search, setSearch] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Form state
  const [formRouteName, setFormRouteName] = useState('')
  const [formRouteNumber, setFormRouteNumber] = useState('')
  const [formDriverName, setFormDriverName] = useState('')
  const [formDriverPhone, setFormDriverPhone] = useState('')
  const [formVehicleNo, setFormVehicleNo] = useState('')
  const [formCapacity, setFormCapacity] = useState('40')
  const [formStops, setFormStops] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery<TransportData>({
    queryKey: ['transport', schoolId, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (schoolId) params.set('schoolId', schoolId)
      if (search) params.set('search', search)
      const res = await fetch(`/api/transport?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch transport data')
      const json = await res.json()
      return json.data
    },
    staleTime: 30_000,
  })

  const addRouteMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Route added successfully')
      queryClient.invalidateQueries({ queryKey: ['transport'] })
      setAddDialogOpen(false)
      resetForm()
    },
    onError: (err: Error) => { toast.error(err.message) },
  })

  function resetForm() {
    setFormRouteName(''); setFormRouteNumber(''); setFormDriverName('')
    setFormDriverPhone(''); setFormVehicleNo(''); setFormCapacity('40'); setFormStops('')
  }

  function handleAddRoute() {
    if (!formRouteName || !formRouteNumber) { toast.error('Route name and number are required'); return }
    addRouteMutation.mutate({
      schoolId, routeName: formRouteName, routeNumber: formRouteNumber,
      driverName: formDriverName, driverPhone: formDriverPhone,
      vehicleNo: formVehicleNo, capacity: formCapacity, stops: formStops,
    })
  }

  const stats = data?.stats || { totalRoutes: 0, totalVehicles: 0, studentsUsing: 0, activeRoutes: 0 }
  const utilizationData = data?.routeUtilization || []

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
        <h3 className="text-lg font-semibold">Failed to load transport data</h3>
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
            <Bus className="h-5 w-5 text-emerald-500" />
            Transport Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage routes, vehicles, and student transport assignments</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Add Route
        </Button>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Routes" value={stats.totalRoutes} icon={Route} trend="up" trendLabel="Configured" iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Total Vehicles" value={stats.totalVehicles} icon={Bus} trend="neutral" trendLabel="In fleet" iconBg="bg-teal-50 dark:bg-teal-950/30" iconColor="text-teal-600 dark:text-teal-400" />
        <StatCard title="Students Using" value={stats.studentsUsing} icon={Users} trend="up" trendLabel="Active users" iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" />
        <StatCard title="Active Routes" value={stats.activeRoutes} icon={MapPin} trend="neutral" trendLabel="Running" iconBg="bg-sky-50 dark:bg-sky-950/30" iconColor="text-sky-600 dark:text-sky-400" />
      </div>

      {/* ── Search ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search routes, drivers, vehicles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
        </div>
      </motion.div>

      {/* ── Route Table ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Route className="h-4 w-4 text-emerald-500" /> Transport Routes
            </CardTitle>
            <CardDescription className="text-xs">{data?.routes.length || 0} routes found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Route Name</TableHead>
                    <TableHead className="text-xs">Route No</TableHead>
                    <TableHead className="text-xs">Driver</TableHead>
                    <TableHead className="text-xs">Vehicle No</TableHead>
                    <TableHead className="text-xs">Capacity</TableHead>
                    <TableHead className="text-xs">Assignments</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.routes || []).length > 0 ? (data?.routes || []).map((route) => (
                    <TableRow key={route.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-medium">{route.routeName}</TableCell>
                      <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{route.routeNumber}</Badge></TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <div className="font-medium">{route.driverName || 'N/A'}</div>
                          {route.driverPhone && <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{route.driverPhone}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{route.vehicleNo || '-'}</TableCell>
                      <TableCell className="text-xs text-center">{route.capacity}</TableCell>
                      <TableCell className="text-xs text-center font-medium">
                        {route.assignments.filter(a => a.status === 'active').length}/{route.capacity}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${STATUS_BADGE[route.status] || STATUS_BADGE.active}`}>{route.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                          <Filter className="h-3.5 w-3.5 text-emerald-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No routes found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Analytics ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Route Utilization
            </CardTitle>
            <CardDescription className="text-xs">Capacity vs current occupancy per route</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {utilizationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilizationData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="capacity" fill="#10b981" radius={[4, 4, 0, 0]} name="Capacity" />
                    <Bar dataKey="assigned" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Assigned" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No utilization data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Add Route Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bus className="h-5 w-5 text-emerald-500" /> Add New Route</DialogTitle>
            <DialogDescription>Create a new transport route for students.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Route Name *</Label>
                <Input placeholder="e.g. North Zone Route" value={formRouteName} onChange={(e) => setFormRouteName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Route Number *</Label>
                <Input placeholder="e.g. R-001" value={formRouteNumber} onChange={(e) => setFormRouteNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Driver Name</Label>
                <Input placeholder="Driver name" value={formDriverName} onChange={(e) => setFormDriverName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Driver Phone</Label>
                <Input placeholder="+91 9876543210" value={formDriverPhone} onChange={(e) => setFormDriverPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Vehicle No</Label>
                <Input placeholder="e.g. KA-01-1234" value={formVehicleNo} onChange={(e) => setFormVehicleNo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Capacity</Label>
                <Input type="number" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Stops (comma-separated)</Label>
              <Input placeholder="Stop 1, Stop 2, Stop 3" value={formStops} onChange={(e) => setFormStops(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="h-9">Cancel</Button>
            <Button onClick={handleAddRoute} disabled={addRouteMutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              {addRouteMutation.isPending ? 'Adding...' : 'Add Route'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
