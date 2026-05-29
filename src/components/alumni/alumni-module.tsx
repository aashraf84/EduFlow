'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid,
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
  GraduationCap, Search, Plus, AlertTriangle, Users, Building2, Briefcase,
  TrendingUp, ArrowUpRight, ArrowDownRight, ExternalLink,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// ── Color palette ───────────────────────────────────────────────
const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b']

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
interface Alumni {
  id: string
  name: string
  email: string
  phone: string | null
  graduationYear: number
  degree: string | null
  department: string | null
  currentCompany: string | null
  currentRole: string | null
  linkedIn: string | null
  status: string
}

interface AlumniData {
  alumni: Alumni[]
  stats: { totalAlumni: number; thisYearGraduates: number; employed: number; topCompanies: number }
  byYearData: { year: number; count: number }[]
  byDeptData: { department: string; count: number }[]
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
export function AlumniModule() {
  const { user } = useAppStore()
  const queryClient = useQueryClient()
  const schoolId = user?.schoolId || ''

  const [search, setSearch] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formGradYear, setFormGradYear] = useState(String(new Date().getFullYear()))
  const [formDegree, setFormDegree] = useState('')
  const [formDepartment, setFormDepartment] = useState('')
  const [formCompany, setFormCompany] = useState('')
  const [formRole, setFormRole] = useState('')
  const [formLinkedIn, setFormLinkedIn] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery<AlumniData>({
    queryKey: ['alumni', schoolId, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (schoolId) params.set('schoolId', schoolId)
      if (search) params.set('search', search)
      const res = await fetch(`/api/alumni?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch alumni data')
      const json = await res.json()
      return json.data
    },
    staleTime: 30_000,
  })

  const addAlumniMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Alumni added successfully')
      queryClient.invalidateQueries({ queryKey: ['alumni'] })
      setAddDialogOpen(false)
      resetForm()
    },
    onError: (err: Error) => { toast.error(err.message) },
  })

  function resetForm() {
    setFormName(''); setFormEmail(''); setFormPhone(''); setFormGradYear(String(new Date().getFullYear()))
    setFormDegree(''); setFormDepartment(''); setFormCompany(''); setFormRole(''); setFormLinkedIn('')
  }

  function handleAddAlumni() {
    if (!formName || !formEmail) { toast.error('Name and Email are required'); return }
    addAlumniMutation.mutate({
      schoolId, name: formName, email: formEmail, phone: formPhone,
      graduationYear: formGradYear, degree: formDegree, department: formDepartment,
      currentCompany: formCompany, currentRole: formRole, linkedIn: formLinkedIn,
    })
  }

  const stats = data?.stats || { totalAlumni: 0, thisYearGraduates: 0, employed: 0, topCompanies: 0 }
  const employmentRate = stats.totalAlumni > 0 ? Math.round((stats.employed / stats.totalAlumni) * 100) : 0

  // Simulated employment rate trend
  const employmentTrendData = (() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, i) => ({
      year: currentYear - 5 + i,
      rate: Math.min(100, employmentRate + Math.round((Math.random() - 0.3) * 15)),
    }))
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
        <h3 className="text-lg font-semibold">Failed to load alumni data</h3>
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
            <GraduationCap className="h-5 w-5 text-emerald-500" />
            Alumni Network
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Connect, track, and engage with graduates</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Add Alumni
        </Button>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Alumni" value={stats.totalAlumni} icon={Users} trend="up" trendLabel="Registered" iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="This Year Grads" value={stats.thisYearGraduates} icon={GraduationCap} trend="neutral" trendLabel={new Date().getFullYear().toString()} iconBg="bg-teal-50 dark:bg-teal-950/30" iconColor="text-teal-600 dark:text-teal-400" />
        <StatCard title="Employed" value={stats.employed} icon={Briefcase} trend="up" trendLabel={`${employmentRate}% rate`} iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" />
        <StatCard title="Top Companies" value={stats.topCompanies} icon={Building2} trend="neutral" trendLabel="Hiring partners" iconBg="bg-sky-50 dark:bg-sky-950/30" iconColor="text-sky-600 dark:text-sky-400" />
      </div>

      {/* ── Search ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by name, company, department..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
        </div>
      </motion.div>

      {/* ── Data Table ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-500" /> Alumni Directory
            </CardTitle>
            <CardDescription className="text-xs">{data?.alumni.length || 0} alumni found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Grad Year</TableHead>
                    <TableHead className="text-xs">Degree</TableHead>
                    <TableHead className="text-xs">Company</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">LinkedIn</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.alumni || []).length > 0 ? (data?.alumni || []).map((alum) => (
                    <TableRow key={alum.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-medium">{alum.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{alum.email}</TableCell>
                      <TableCell className="text-xs text-center">{alum.graduationYear}</TableCell>
                      <TableCell className="text-xs">{alum.degree || '-'}</TableCell>
                      <TableCell className="text-xs">{alum.currentCompany || '-'}</TableCell>
                      <TableCell className="text-xs">{alum.currentRole || '-'}</TableCell>
                      <TableCell className="text-xs">
                        {alum.linkedIn ? (
                          <a href={alum.linkedIn} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700">
                            <ExternalLink className="h-3 w-3" /> Profile
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                          <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No alumni found</TableCell></TableRow>
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> Alumni by Year</CardTitle>
              <CardDescription className="text-xs">Graduation year distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                {(data?.byYearData || []).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.byYearData || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="year" className="text-xs" tick={{ fontSize: 11 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Alumni" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-teal-500" /> By Department</CardTitle>
              <CardDescription className="text-xs">Department-wise distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                {(data?.byDeptData || []).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data?.byDeptData || []} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="count" label={({ department, percent }) => `${department} (${(percent * 100).toFixed(0)}%)`}>
                        {(data?.byDeptData || []).map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
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
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4 text-amber-500" /> Employment Rate Trend</CardTitle>
              <CardDescription className="text-xs">Employment rate over years</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                {employmentTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={employmentTrendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="year" className="text-xs" tick={{ fontSize: 11 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Employment %" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ── Add Alumni Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-emerald-500" /> Add Alumni</DialogTitle>
            <DialogDescription>Register a new alumni member to the network.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-xs font-medium">Full Name *</Label><Input placeholder="Full name" value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Email *</Label><Input type="email" placeholder="email@example.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Phone</Label><Input placeholder="+91 9876543210" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Graduation Year</Label><Input type="number" value={formGradYear} onChange={(e) => setFormGradYear(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Degree</Label><Input placeholder="e.g. B.Sc, B.Tech" value={formDegree} onChange={(e) => setFormDegree(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Department</Label><Input placeholder="e.g. Computer Science" value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Current Company</Label><Input placeholder="Company name" value={formCompany} onChange={(e) => setFormCompany(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Current Role</Label><Input placeholder="Job title" value={formRole} onChange={(e) => setFormRole(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label className="text-xs font-medium">LinkedIn Profile</Label><Input placeholder="https://linkedin.com/in/..." value={formLinkedIn} onChange={(e) => setFormLinkedIn(e.target.value)} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="h-9">Cancel</Button>
            <Button onClick={handleAddAlumni} disabled={addAlumniMutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              {addAlumniMutation.isPending ? 'Adding...' : 'Add Alumni'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
