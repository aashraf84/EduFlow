'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
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
  Building2, BedDouble, Users, AlertTriangle, Plus, Search, TrendingUp,
  ArrowUpRight, ArrowDownRight, Phone, User,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// ── Color palette ───────────────────────────────────────────────
const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b']

const STATUS_BADGE: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  occupied: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  full: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
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
interface HostelAllocation {
  id: string
  studentId: string
  checkIn: string
  checkOut: string | null
  status: string
  student: { id: string; firstName: string; lastName: string; admissionNo: string }
}

interface HostelRoom {
  id: string
  hostelId: string
  roomNumber: string
  floor: number
  capacity: number
  occupants: number
  roomType: string
  status: string
  allocations: HostelAllocation[]
}

interface Hostel {
  id: string
  name: string
  type: string
  capacity: number
  wardenName: string | null
  wardenPhone: string | null
  floors: number
  status: string
  rooms: HostelRoom[]
}

interface HostelData {
  hostels: Hostel[]
  allocations: {
    id: string; studentId: string; checkIn: string; checkOut: string | null; status: string
    room: { roomNumber: string; hostel: { name: string } }
    student: { id: string; firstName: string; lastName: string; admissionNo: string }
  }[]
  stats: { totalHostels: number; totalRooms: number; totalOccupants: number; occupancyRate: number }
  occupancyByHostel: { name: string; capacity: number; occupants: number }[]
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
export function HostelModule() {
  const { user } = useAppStore()
  const queryClient = useQueryClient()
  const schoolId = user?.schoolId || ''

  const [addHostelDialogOpen, setAddHostelDialogOpen] = useState(false)
  const [addRoomDialogOpen, setAddRoomDialogOpen] = useState(false)

  // Hostel form state
  const [fhName, setFhName] = useState('')
  const [fhType, setFhType] = useState('boys')
  const [fhCapacity, setFhCapacity] = useState('100')
  const [fhWardenName, setFhWardenName] = useState('')
  const [fhWardenPhone, setFhWardenPhone] = useState('')
  const [fhFloors, setFhFloors] = useState('3')

  // Room form state
  const [frHostelId, setFrHostelId] = useState('')
  const [frRoomNumber, setFrRoomNumber] = useState('')
  const [frFloor, setFrFloor] = useState('1')
  const [frCapacity, setFrCapacity] = useState('2')
  const [frRoomType, setFrRoomType] = useState('shared')

  const { data, isLoading, isError, error, refetch } = useQuery<HostelData>({
    queryKey: ['hostel', schoolId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (schoolId) params.set('schoolId', schoolId)
      const res = await fetch(`/api/hostel?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch hostel data')
      const json = await res.json()
      return json.data
    },
    staleTime: 30_000,
  })

  const addHostelMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/hostel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Hostel added successfully')
      queryClient.invalidateQueries({ queryKey: ['hostel'] })
      setAddHostelDialogOpen(false)
      resetHostelForm()
    },
    onError: (err: Error) => { toast.error(err.message) },
  })

  const addRoomMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/hostel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Room added successfully')
      queryClient.invalidateQueries({ queryKey: ['hostel'] })
      setAddRoomDialogOpen(false)
      resetRoomForm()
    },
    onError: (err: Error) => { toast.error(err.message) },
  })

  function resetHostelForm() {
    setFhName(''); setFhType('boys'); setFhCapacity('100'); setFhWardenName(''); setFhWardenPhone(''); setFhFloors('3')
  }
  function resetRoomForm() {
    setFrHostelId(''); setFrRoomNumber(''); setFrFloor('1'); setFrCapacity('2'); setFrRoomType('shared')
  }

  function handleAddHostel() {
    if (!fhName) { toast.error('Hostel name is required'); return }
    addHostelMutation.mutate({
      action: 'addHostel', schoolId, name: fhName, type: fhType,
      capacity: fhCapacity, wardenName: fhWardenName, wardenPhone: fhWardenPhone, floors: fhFloors,
    })
  }

  function handleAddRoom() {
    if (!frHostelId || !frRoomNumber) { toast.error('Hostel and room number are required'); return }
    addRoomMutation.mutate({
      action: 'addRoom', schoolId, hostelId: frHostelId, roomNumber: frRoomNumber,
      floor: frFloor, capacity: frCapacity, roomType: frRoomType,
    })
  }

  const stats = data?.stats || { totalHostels: 0, totalRooms: 0, totalOccupants: 0, occupancyRate: 0 }
  const occupancyByHostel = data?.occupancyByHostel || []

  // Room type distribution
  const roomTypeData = (() => {
    if (!data?.hostels) return []
    const map = new Map<string, number>()
    data.hostels.forEach(h => h.rooms.forEach(r => { map.set(r.roomType, (map.get(r.roomType) || 0) + 1) }))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  })()

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
        <h3 className="text-lg font-semibold">Failed to load hostel data</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">{(error as Error)?.message}</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  // Collect all rooms from all hostels
  const allRooms = data?.hostels.flatMap(h => h.rooms.map(r => ({ ...r, hostelName: h.name }))) || []

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-500" />
            Hostel & Residence
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage hostels, rooms, and student allocations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddHostelDialogOpen(true)} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" /> Add Hostel
          </Button>
          <Button onClick={() => setAddRoomDialogOpen(true)} variant="outline" className="h-9">
            <Plus className="h-4 w-4 mr-1.5" /> Add Room
          </Button>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Hostels" value={stats.totalHostels} icon={Building2} trend="up" trendLabel="Buildings" iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Total Rooms" value={stats.totalRooms} icon={BedDouble} trend="neutral" trendLabel="Configured" iconBg="bg-teal-50 dark:bg-teal-950/30" iconColor="text-teal-600 dark:text-teal-400" />
        <StatCard title="Total Occupants" value={stats.totalOccupants} icon={Users} trend="up" trendLabel="Residents" iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" />
        <StatCard title="Occupancy Rate" value={`${stats.occupancyRate}%`} icon={TrendingUp} trend={stats.occupancyRate >= 80 ? 'up' : stats.occupancyRate >= 50 ? 'neutral' : 'down'} trendLabel={stats.occupancyRate >= 80 ? 'High' : 'Moderate'} iconBg="bg-sky-50 dark:bg-sky-950/30" iconColor="text-sky-600 dark:text-sky-400" />
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="hostels" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="hostels" className="text-xs">Hostels</TabsTrigger>
          <TabsTrigger value="rooms" className="text-xs">Rooms</TabsTrigger>
          <TabsTrigger value="allocations" className="text-xs">Allocations</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
        </TabsList>

        {/* ── Hostels Tab ── */}
        <TabsContent value="hostels">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.hostels || []).length > 0 ? (data?.hostels || []).map((hostel) => {
              const roomOccupants = hostel.rooms.reduce((a, r) => a + r.occupants, 0)
              const roomCapacity = hostel.rooms.reduce((a, r) => a + r.capacity, 0)
              return (
                <Card key={hostel.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{hostel.name}</h4>
                        <Badge variant="outline" className="text-[10px] capitalize mt-1">{hostel.type}</Badge>
                      </div>
                      <Badge className={`text-[10px] ${STATUS_BADGE[hostel.status] || STATUS_BADGE.active}`}>{hostel.status}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{hostel.rooms.length}</p>
                        <p className="text-[10px] text-muted-foreground">Rooms</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2">
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{roomOccupants}</p>
                        <p className="text-[10px] text-muted-foreground">Occupants</p>
                      </div>
                      <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 p-2">
                        <p className="text-lg font-bold text-sky-600 dark:text-sky-400">{roomCapacity - roomOccupants}</p>
                        <p className="text-[10px] text-muted-foreground">Vacant</p>
                      </div>
                    </div>
                    {hostel.wardenName && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{hostel.wardenName}</span>
                        {hostel.wardenPhone && <><Phone className="h-3 w-3 ml-2" />{hostel.wardenPhone}</>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            }) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Building2 className="h-10 w-10 opacity-40 mb-2" />
                <p className="text-sm">No hostels configured</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Rooms Tab ── */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><BedDouble className="h-4 w-4 text-emerald-500" /> Room List</CardTitle>
              <CardDescription className="text-xs">{allRooms.length} rooms total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Room No</TableHead>
                      <TableHead className="text-xs">Hostel</TableHead>
                      <TableHead className="text-xs">Floor</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Capacity</TableHead>
                      <TableHead className="text-xs">Occupants</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allRooms.length > 0 ? allRooms.map((room) => (
                      <TableRow key={room.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">{room.roomNumber}</TableCell>
                        <TableCell className="text-xs">{room.hostelName}</TableCell>
                        <TableCell className="text-xs">{room.floor}</TableCell>
                        <TableCell className="text-xs"><Badge variant="outline" className="text-[10px] capitalize">{room.roomType}</Badge></TableCell>
                        <TableCell className="text-xs text-center">{room.capacity}</TableCell>
                        <TableCell className="text-xs text-center font-medium">{room.occupants}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${STATUS_BADGE[room.occupants >= room.capacity ? 'full' : room.occupants > 0 ? 'occupied' : 'available']}`}>
                            {room.occupants >= room.capacity ? 'Full' : room.occupants > 0 ? 'Occupied' : 'Available'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No rooms found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Allocations Tab ── */}
        <TabsContent value="allocations">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-teal-500" /> Student Allocations</CardTitle>
              <CardDescription className="text-xs">{data?.allocations.length || 0} allocation records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Hostel</TableHead>
                      <TableHead className="text-xs">Room</TableHead>
                      <TableHead className="text-xs">Check-In</TableHead>
                      <TableHead className="text-xs">Check-Out</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.allocations || []).length > 0 ? (data?.allocations || []).map((alloc) => (
                      <TableRow key={alloc.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">{alloc.student.firstName} {alloc.student.lastName}</TableCell>
                        <TableCell className="text-xs">{alloc.room.hostel.name}</TableCell>
                        <TableCell className="text-xs">{alloc.room.roomNumber}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(alloc.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{alloc.checkOut ? new Date(alloc.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${STATUS_BADGE[alloc.status] || STATUS_BADGE.active}`}>{alloc.status}</Badge>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No allocations found</TableCell></TableRow>
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
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> Occupancy by Hostel</CardTitle>
                <CardDescription className="text-xs">Capacity vs current occupants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {occupancyByHostel.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupancyByHostel}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                        <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                        <RechartsTooltip /><Legend />
                        <Bar dataKey="capacity" fill="#10b981" radius={[4, 4, 0, 0]} name="Capacity" />
                        <Bar dataKey="occupants" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Occupants" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data</div>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><BedDouble className="h-4 w-4 text-teal-500" /> Room Type Distribution</CardTitle>
                <CardDescription className="text-xs">Breakdown by room type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {roomTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={roomTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {roomTypeData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data</div>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Add Hostel Dialog ── */}
      <Dialog open={addHostelDialogOpen} onOpenChange={setAddHostelDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-emerald-500" /> Add New Hostel</DialogTitle>
            <DialogDescription>Register a new hostel building.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-xs font-medium">Hostel Name *</Label><Input placeholder="e.g. Boys Hostel A" value={fhName} onChange={(e) => setFhName(e.target.value)} /></div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Type</Label>
                <Select value={fhType} onValueChange={setFhType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                    <SelectItem value="co-ed">Co-Ed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-xs font-medium">Capacity</Label><Input type="number" value={fhCapacity} onChange={(e) => setFhCapacity(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Floors</Label><Input type="number" value={fhFloors} onChange={(e) => setFhFloors(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Warden Name</Label><Input placeholder="Warden name" value={fhWardenName} onChange={(e) => setFhWardenName(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Warden Phone</Label><Input placeholder="+91 9876543210" value={fhWardenPhone} onChange={(e) => setFhWardenPhone(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddHostelDialogOpen(false)} className="h-9">Cancel</Button>
            <Button onClick={handleAddHostel} disabled={addHostelMutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              {addHostelMutation.isPending ? 'Adding...' : 'Add Hostel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Room Dialog ── */}
      <Dialog open={addRoomDialogOpen} onOpenChange={setAddRoomDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BedDouble className="h-5 w-5 text-teal-500" /> Add New Room</DialogTitle>
            <DialogDescription>Add a room to an existing hostel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Hostel *</Label>
                <Select value={frHostelId} onValueChange={setFrHostelId}>
                  <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                  <SelectContent>
                    {(data?.hostels || []).map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-xs font-medium">Room Number *</Label><Input placeholder="e.g. 101" value={frRoomNumber} onChange={(e) => setFrRoomNumber(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Floor</Label><Input type="number" value={frFloor} onChange={(e) => setFrFloor(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Capacity</Label><Input type="number" value={frCapacity} onChange={(e) => setFrCapacity(e.target.value)} /></div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Room Type</Label>
                <Select value={frRoomType} onValueChange={setFrRoomType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="shared">Shared</SelectItem>
                    <SelectItem value="dormitory">Dormitory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddRoomDialogOpen(false)} className="h-9">Cancel</Button>
            <Button onClick={handleAddRoom} disabled={addRoomMutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              {addRoomMutation.isPending ? 'Adding...' : 'Add Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
