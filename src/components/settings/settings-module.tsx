'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Progress } from '@/components/ui/progress'
import {
  Settings,
  School,
  Calendar,
  Users,
  CreditCard,
  Save,
  Plus,
  CheckCircle2,
  AlertCircle,
  Edit3,
  MapPin,
  Phone,
  Mail,
  Globe,
  Crown,
  Zap,
  Building,
  GraduationCap,
  Clock,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// ── Types ───────────────────────────────────────────────────────
interface SchoolProfile {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  phone: string | null
  email: string | null
  website: string | null
  plan: string
  maxStudents: number
  status: string
}

interface AcademicSession {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  terms: {
    id: string
    name: string
    startDate: string
    endDate: string
    status: string
  }[]
}

interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  status: string
  phone: string | null
  lastLogin: string | null
}

interface SettingsData {
  school: SchoolProfile
  academicSessions: AcademicSession[]
  users: UserRecord[]
  totalStudents: number
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
function SettingsSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-3 gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full col-span-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Plan badge colors ───────────────────────────────────────────
const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  growth: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  enterprise: 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  principal: 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
  teacher: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  student: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
  parent: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
}

// ── Main Component ──────────────────────────────────────────────
export function SettingsModule() {
  const { user, tenantCode } = useAppStore()
  const queryClient = useQueryClient()
  const schoolId = user?.schoolId || ''

  // School profile form state
  const [editing, setEditing] = useState(false)
  const [schoolName, setSchoolName] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [schoolAddress, setSchoolAddress] = useState('')
  const [schoolCity, setSchoolCity] = useState('')
  const [schoolState, setSchoolState] = useState('')
  const [schoolCountry, setSchoolCountry] = useState('')
  const [schoolPhone, setSchoolPhone] = useState('')
  const [schoolEmail, setSchoolEmail] = useState('')
  const [schoolWebsite, setSchoolWebsite] = useState('')

  // Term dialog state
  const [termDialogOpen, setTermDialogOpen] = useState(false)
  const [termName, setTermName] = useState('')
  const [termStart, setTermStart] = useState('')
  const [termEnd, setTermEnd] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')

  // User dialog state
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('teacher')
  const [userPhone, setUserPhone] = useState('')

  // Fetch settings data
  const { data, isLoading, isError, error } = useQuery<SettingsData>({
    queryKey: ['settings', schoolId],
    queryFn: async () => {
      const res = await fetch(`/api/settings?schoolCode=${tenantCode}${schoolId ? `&schoolId=${schoolId}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch settings')
      const json = await res.json()
      return json.data
    },
    staleTime: 60_000,
  })

  // Update school profile mutation
  const updateSchoolMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, schoolCode: tenantCode }),
      })
      if (!res.ok) throw new Error('Failed to update school profile')
      return res.json()
    },
    onSuccess: () => {
      toast.success('School profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setEditing(false)
    },
    onError: () => {
      toast.error('Failed to update school profile')
    },
  })

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, schoolCode: tenantCode }),
      })
      if (!res.ok) throw new Error('Failed to create user')
      return res.json()
    },
    onSuccess: () => {
      toast.success('User created successfully')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setUserDialogOpen(false)
      setUserName('')
      setUserEmail('')
      setUserRole('teacher')
      setUserPhone('')
    },
    onError: () => {
      toast.error('Failed to create user')
    },
  })

  // Initialize form with fetched data
  const initForm = () => {
    if (data?.school) {
      setSchoolName(data.school.name)
      setSchoolCode(data.school.code)
      setSchoolAddress(data.school.address || '')
      setSchoolCity(data.school.city || '')
      setSchoolState(data.school.state || '')
      setSchoolCountry(data.school.country || '')
      setSchoolPhone(data.school.phone || '')
      setSchoolEmail(data.school.email || '')
      setSchoolWebsite(data.school.website || '')
    }
  }

  const handleSave = () => {
    updateSchoolMutation.mutate({
      schoolId,
      name: schoolName,
      code: schoolCode,
      address: schoolAddress,
      city: schoolCity,
      state: schoolState,
      country: schoolCountry,
      phone: schoolPhone,
      email: schoolEmail,
      website: schoolWebsite,
    })
  }

  const handleAddTerm = () => {
    if (!termName || !termStart || !termEnd) {
      toast.error('Please fill in all term fields')
      return
    }
    toast.success('Term added successfully')
    setTermDialogOpen(false)
    setTermName('')
    setTermStart('')
    setTermEnd('')
  }

  const handleAddUser = () => {
    if (!userName || !userEmail) {
      toast.error('Please fill in name and email')
      return
    }
    createUserMutation.mutate({
      schoolId,
      name: userName,
      email: userEmail,
      role: userRole,
      phone: userPhone,
    })
  }

  // Computed values
  const plan = data?.school?.plan || 'starter'
  const maxStudents = data?.school?.maxStudents || 500
  const totalStudents = data?.totalStudents || 0
  const usagePercent = maxStudents > 0 ? Math.round((totalStudents / maxStudents) * 100) : 0

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <SettingsSkeleton />
        <SettingsSkeleton />
      </div>
    )
  }

  // ── Error state ──
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold">Failed to load settings</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          {(error as Error)?.message || 'Something went wrong. Please try again later.'}
        </p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['settings'] })}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* ── Header ── */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-500" />
          Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your school profile, academic sessions, and users</p>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="profile" className="text-xs gap-1.5">
              <School className="h-3.5 w-3.5" />
              School Profile
            </TabsTrigger>
            <TabsTrigger value="academic" className="text-xs gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Academic Year
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Users
            </TabsTrigger>
            <TabsTrigger value="subscription" className="text-xs gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Subscription
            </TabsTrigger>
          </TabsList>

          {/* ── School Profile Tab ── */}
          <TabsContent value="profile">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Building className="h-4 w-4 text-emerald-500" />
                      School Details
                    </CardTitle>
                    <CardDescription className="text-xs">Manage your school&apos;s profile information</CardDescription>
                  </div>
                  {!editing ? (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { initForm(); setEditing(true) }}>
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditing(false)}>Cancel</Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs" onClick={handleSave} disabled={updateSchoolMutation.isPending}>
                        <Save className="h-3.5 w-3.5" />
                        {updateSchoolMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <School className="h-3 w-3 text-muted-foreground" />
                      School Name
                    </Label>
                    {editing ? (
                      <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                    ) : (
                      <p className="text-sm text-foreground py-2">{data?.school?.name || 'Not set'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">School Code</Label>
                    {editing ? (
                      <Input value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} />
                    ) : (
                      <p className="text-sm text-foreground py-2 font-mono">{data?.school?.code || 'N/A'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      Address
                    </Label>
                    {editing ? (
                      <Input value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} />
                    ) : (
                      <p className="text-sm text-foreground py-2">{data?.school?.address || 'Not set'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">City</Label>
                    {editing ? (
                      <Input value={schoolCity} onChange={(e) => setSchoolCity(e.target.value)} />
                    ) : (
                      <p className="text-sm text-foreground py-2">{data?.school?.city || 'Not set'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">State</Label>
                    {editing ? (
                      <Input value={schoolState} onChange={(e) => setSchoolState(e.target.value)} />
                    ) : (
                      <p className="text-sm text-foreground py-2">{data?.school?.state || 'Not set'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Country</Label>
                    {editing ? (
                      <Input value={schoolCountry} onChange={(e) => setSchoolCountry(e.target.value)} />
                    ) : (
                      <p className="text-sm text-foreground py-2">{data?.school?.country || 'Not set'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      Phone
                    </Label>
                    {editing ? (
                      <Input value={schoolPhone} onChange={(e) => setSchoolPhone(e.target.value)} />
                    ) : (
                      <p className="text-sm text-foreground py-2">{data?.school?.phone || 'Not set'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      Email
                    </Label>
                    {editing ? (
                      <Input value={schoolEmail} onChange={(e) => setSchoolEmail(e.target.value)} />
                    ) : (
                      <p className="text-sm text-foreground py-2">{data?.school?.email || 'Not set'}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      Website
                    </Label>
                    {editing ? (
                      <Input value={schoolWebsite} onChange={(e) => setSchoolWebsite(e.target.value)} />
                    ) : (
                      <p className="text-sm text-foreground py-2">{data?.school?.website || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Academic Year Tab ── */}
          <TabsContent value="academic">
            <div className="space-y-4">
              {(data?.academicSessions || []).length > 0 ? (
                data.academicSessions.map((session) => (
                  <Card key={session.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-emerald-500" />
                            {session.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {new Date(session.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(session.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </CardDescription>
                        </div>
                        <Badge className={`text-[10px] ${session.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {session.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terms</h5>
                          <Dialog open={termDialogOpen && selectedSessionId === session.id} onOpenChange={(open) => { setTermDialogOpen(open); if (open) setSelectedSessionId(session.id) }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-xs gap-1 h-7">
                                <Plus className="h-3 w-3" />
                                Add Term
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Add Term</DialogTitle>
                                <DialogDescription>Add a new term to the academic session.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium">Term Name *</Label>
                                  <Input placeholder="e.g., Term 1" value={termName} onChange={(e) => setTermName(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium">Start Date *</Label>
                                    <Input type="date" value={termStart} onChange={(e) => setTermStart(e.target.value)} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium">End Date *</Label>
                                    <Input type="date" value={termEnd} onChange={(e) => setTermEnd(e.target.value)} />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                  <Button variant="outline" size="sm" onClick={() => setTermDialogOpen(false)}>Cancel</Button>
                                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddTerm}>Add Term</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        {session.terms.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {session.terms.map((term) => (
                              <div key={term.id} className="rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-foreground">{term.name}</h4>
                                  <Badge className={`text-[9px] ${term.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : term.status === 'completed' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'}`}>
                                    {term.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {new Date(term.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(term.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-4">No terms defined yet. Add a term to get started.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Calendar className="h-12 w-12 opacity-30 mx-auto mb-3" />
                    <p className="text-sm font-medium">No academic sessions found</p>
                    <p className="text-xs mt-1">Academic sessions will appear here once configured</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── Users Tab ── */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-500" />
                      User Management
                    </CardTitle>
                    <CardDescription className="text-xs">{(data?.users || []).length} users in this school</CardDescription>
                  </div>
                  <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs">
                        <Plus className="h-3.5 w-3.5" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add User</DialogTitle>
                        <DialogDescription>Create a new user account for your school.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Full Name *</Label>
                          <Input placeholder="Enter full name" value={userName} onChange={(e) => setUserName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Email *</Label>
                          <Input type="email" placeholder="user@school.com" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Role</Label>
                            <Select value={userRole} onValueChange={setUserRole}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="principal">Principal</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Phone</Label>
                            <Input placeholder="Phone number" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => setUserDialogOpen(false)}>Cancel</Button>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddUser} disabled={createUserMutation.isPending}>
                            {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs">Role</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Last Login</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.users || []).length > 0 ? (
                        data.users.map((u) => (
                          <TableRow key={u.id} className="hover:bg-muted/30">
                            <TableCell className="text-xs font-medium">{u.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] ${ROLE_BADGE[u.role] || ROLE_BADGE.teacher}`}>
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                {u.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Subscription Tab ── */}
          <TabsContent value="subscription">
            <div className="space-y-4">
              {/* Current Plan */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Current Plan
                  </CardTitle>
                  <CardDescription className="text-xs">Your active subscription details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/50 dark:border-emerald-800/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground capitalize">{plan} Plan</h3>
                        <Badge className={`text-[10px] ${PLAN_BADGE[plan] || PLAN_BADGE.starter}`}>
                          Active
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {plan === 'starter' && 'Basic features for small schools'}
                        {plan === 'growth' && 'Advanced features for growing schools'}
                        {plan === 'enterprise' && 'Full suite for large institutions'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {plan === 'starter' ? '$49' : plan === 'growth' ? '$99' : 'Custom'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">/month</p>
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="mt-4 space-y-3">
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usage</h5>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <GraduationCap className="h-3 w-3" />
                            Students
                          </span>
                          <span className="text-xs font-medium text-foreground">{totalStudents} / {maxStudents}</span>
                        </div>
                        <Progress value={usagePercent} className="h-2" />
                        <p className="text-[10px] text-muted-foreground mt-1">{usagePercent}% capacity used</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plan Comparison */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Plan Comparison
                  </CardTitle>
                  <CardDescription className="text-xs">Compare plans and features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        name: 'Starter',
                        price: '$49/mo',
                        features: ['Up to 500 students', 'Basic attendance', 'Fee management', 'Email support'],
                        current: plan === 'starter',
                        highlight: false,
                      },
                      {
                        name: 'Growth',
                        price: '$99/mo',
                        features: ['Up to 2000 students', 'AI insights', 'Advanced analytics', 'Priority support'],
                        current: plan === 'growth',
                        highlight: true,
                      },
                      {
                        name: 'Enterprise',
                        price: 'Custom',
                        features: ['Unlimited students', 'Custom integrations', 'Dedicated manager', 'SLA guarantee'],
                        current: plan === 'enterprise',
                        highlight: false,
                      },
                    ].map((p) => (
                      <div
                        key={p.name}
                        className={`rounded-xl border p-4 transition-all ${
                          p.highlight
                            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md shadow-emerald-100 dark:shadow-emerald-900/30'
                            : 'border-border/50 hover:border-border'
                        } ${p.current ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background' : ''}`}
                      >
                        {p.highlight && (
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 mb-2">
                            Recommended
                          </Badge>
                        )}
                        <h4 className="text-sm font-bold text-foreground">{p.name}</h4>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{p.price}</p>
                        <ul className="mt-3 space-y-1.5">
                          {p.features.map((f) => (
                            <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <Button
                          variant={p.current ? 'outline' : 'default'}
                          size="sm"
                          className={`mt-4 w-full text-xs ${p.current ? '' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                          disabled={p.current}
                        >
                          {p.current ? 'Current Plan' : 'Upgrade'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
