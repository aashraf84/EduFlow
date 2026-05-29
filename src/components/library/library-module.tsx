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
  BookOpen, Search, Plus, TrendingUp, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Library, BookCheck, Clock, RotateCcw, Eye, Filter,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// ── Color palette ───────────────────────────────────────────────
const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6', '#64748b', '#ec4899']

const STATUS_BADGE: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  issued: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  returned: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
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
interface BookIssue {
  id: string
  bookId: string
  studentId: string
  issueDate: string
  dueDate: string
  returnDate: string | null
  fine: number
  status: string
  book: { id: string; title: string; author: string }
  student: { id: string; firstName: string; lastName: string; admissionNo: string }
}

interface LibraryBook {
  id: string
  title: string
  author: string
  isbn: string | null
  publisher: string | null
  category: string | null
  totalCopies: number
  availableCopies: number
  shelfLocation: string | null
  price: number | null
  status: string
  issues: BookIssue[]
}

interface LibraryData {
  books: LibraryBook[]
  issues: BookIssue[]
  stats: { totalBooks: number; availableBooks: number; issuedBooks: number; overdueBooks: number }
  pagination: { page: number; limit: number; total: number; totalPages: number }
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
export function LibraryModule() {
  const { user } = useAppStore()
  const queryClient = useQueryClient()
  const schoolId = user?.schoolId || ''

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formAuthor, setFormAuthor] = useState('')
  const [formIsbn, setFormIsbn] = useState('')
  const [formPublisher, setFormPublisher] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formTotalCopies, setFormTotalCopies] = useState('1')
  const [formShelfLocation, setFormShelfLocation] = useState('')
  const [formPrice, setFormPrice] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery<LibraryData>({
    queryKey: ['library', schoolId, search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (schoolId) params.set('schoolId', schoolId)
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      const res = await fetch(`/api/library?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch library data')
      const json = await res.json()
      return json.data
    },
    staleTime: 30_000,
  })

  const addBookMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Book added successfully')
      queryClient.invalidateQueries({ queryKey: ['library'] })
      setAddDialogOpen(false)
      resetForm()
    },
    onError: (err: Error) => { toast.error(err.message) },
  })

  const returnBookMutation = useMutation({
    mutationFn: async (issueId: string) => {
      const res = await fetch('/api/library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'return', issueId }),
      })
      if (!res.ok) throw new Error('Failed to return book')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Book returned successfully')
      queryClient.invalidateQueries({ queryKey: ['library'] })
    },
    onError: () => { toast.error('Failed to return book') },
  })

  function resetForm() {
    setFormTitle(''); setFormAuthor(''); setFormIsbn(''); setFormPublisher('')
    setFormCategory(''); setFormTotalCopies('1'); setFormShelfLocation(''); setFormPrice('')
  }

  function handleAddBook() {
    if (!formTitle || !formAuthor) { toast.error('Title and Author are required'); return }
    addBookMutation.mutate({
      schoolId, title: formTitle, author: formAuthor, isbn: formIsbn,
      publisher: formPublisher, category: formCategory, totalCopies: formTotalCopies,
      shelfLocation: formShelfLocation, price: formPrice,
    })
  }

  // Analytics data
  const categoryChartData = (() => {
    if (!data?.books) return []
    const map = new Map<string, number>()
    data.books.forEach(b => { const cat = b.category || 'Uncategorized'; map.set(cat, (map.get(cat) || 0) + b.totalCopies) })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  })()

  const monthlyIssuesData = (() => {
    if (!data?.issues) return []
    const map = new Map<string, { month: string; issued: number; returned: number }>()
    data.issues.forEach(i => {
      const d = new Date(i.issueDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const existing = map.get(key) || { month: label, issued: 0, returned: 0 }
      existing.issued++
      if (i.status === 'returned') existing.returned++
      map.set(key, existing)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)
  })()

  const stats = data?.stats || { totalBooks: 0, availableBooks: 0, issuedBooks: 0, overdueBooks: 0 }

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
        <h3 className="text-lg font-semibold">Failed to load library data</h3>
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
            <Library className="h-5 w-5 text-emerald-500" />
            Library Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage books, track issues, and analyze reading trends</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Add Book
        </Button>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Books" value={stats.totalBooks} icon={BookOpen} trend="up" trendLabel="In catalog" iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Available" value={stats.availableBooks} icon={BookCheck} trend="neutral" trendLabel="Ready to issue" iconBg="bg-teal-50 dark:bg-teal-950/30" iconColor="text-teal-600 dark:text-teal-400" />
        <StatCard title="Books Issued" value={stats.issuedBooks} icon={Clock} trend="neutral" trendLabel="Currently out" iconBg="bg-amber-50 dark:bg-amber-950/30" iconColor="text-amber-600 dark:text-amber-400" />
        <StatCard title="Overdue" value={stats.overdueBooks} icon={AlertTriangle} trend={stats.overdueBooks > 0 ? 'down' : 'neutral'} trendLabel={stats.overdueBooks > 0 ? 'Needs attention' : 'All clear'} iconBg="bg-red-50 dark:bg-red-950/30" iconColor="text-red-600 dark:text-red-400" />
      </div>

      {/* ── Search & Filters ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by title, author, ISBN..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-40 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Fiction">Fiction</SelectItem>
            <SelectItem value="Science">Science</SelectItem>
            <SelectItem value="Mathematics">Mathematics</SelectItem>
            <SelectItem value="History">History</SelectItem>
            <SelectItem value="Computer Science">Computer Science</SelectItem>
            <SelectItem value="Literature">Literature</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="books" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="books" className="text-xs">Books</TabsTrigger>
          <TabsTrigger value="issues" className="text-xs">Issue Tracking</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
        </TabsList>

        {/* ── Books Tab ── */}
        <TabsContent value="books">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-500" /> Book Catalog
              </CardTitle>
              <CardDescription className="text-xs">{data?.books.length || 0} books found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Author</TableHead>
                      <TableHead className="text-xs">ISBN</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Total</TableHead>
                      <TableHead className="text-xs">Available</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.books || []).length > 0 ? (data?.books || []).map((book) => (
                      <TableRow key={book.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium max-w-[150px] truncate">{book.title}</TableCell>
                        <TableCell className="text-xs">{book.author}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{book.isbn || '-'}</TableCell>
                        <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{book.category || 'N/A'}</Badge></TableCell>
                        <TableCell className="text-xs text-center">{book.totalCopies}</TableCell>
                        <TableCell className="text-xs text-center font-medium">{book.availableCopies}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${STATUS_BADGE[book.availableCopies > 0 ? 'available' : 'issued']}`}>
                            {book.availableCopies > 0 ? 'Available' : 'All Issued'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" title="View details">
                            <Eye className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No books found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Issues Tab ── */}
        <TabsContent value="issues">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-500" /> Issue Tracking
              </CardTitle>
              <CardDescription className="text-xs">{data?.issues.length || 0} records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Book</TableHead>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Issue Date</TableHead>
                      <TableHead className="text-xs">Due Date</TableHead>
                      <TableHead className="text-xs">Return Date</TableHead>
                      <TableHead className="text-xs">Fine</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.issues || []).length > 0 ? (data?.issues || []).map((issue) => (
                      <TableRow key={issue.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium max-w-[120px] truncate">{issue.book.title}</TableCell>
                        <TableCell className="text-xs">{issue.student.firstName} {issue.student.lastName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(issue.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{issue.returnDate ? new Date(issue.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</TableCell>
                        <TableCell className="text-xs">{issue.fine > 0 ? `₹${issue.fine}` : '-'}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${STATUS_BADGE[issue.status] || STATUS_BADGE.issued}`}>{issue.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {issue.status === 'issued' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => returnBookMutation.mutate(issue.id)} title="Return Book" disabled={returnBookMutation.isPending}>
                              <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No issue records</TableCell></TableRow>
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
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> Books by Category</CardTitle>
                <CardDescription className="text-xs">Distribution across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {categoryChartData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data available</div>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-teal-500" /> Monthly Issues Trend</CardTitle>
                <CardDescription className="text-xs">Issues vs returns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {monthlyIssuesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyIssuesData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                        <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="issued" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Issued" />
                        <Line type="monotone" dataKey="returned" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} name="Returned" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data available</div>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Add Book Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-emerald-500" /> Add New Book</DialogTitle>
            <DialogDescription>Fill in the book details to add to the library catalog.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Title *</Label>
                <Input placeholder="Book title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Author *</Label>
                <Input placeholder="Author name" value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">ISBN</Label>
                <Input placeholder="978-..." value={formIsbn} onChange={(e) => setFormIsbn(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Publisher</Label>
                <Input placeholder="Publisher name" value={formPublisher} onChange={(e) => setFormPublisher(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fiction">Fiction</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="History">History</SelectItem>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Literature">Literature</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Total Copies</Label>
                <Input type="number" min="1" value={formTotalCopies} onChange={(e) => setFormTotalCopies(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Shelf Location</Label>
                <Input placeholder="e.g. A-12" value={formShelfLocation} onChange={(e) => setFormShelfLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Price (₹)</Label>
                <Input type="number" placeholder="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="h-9">Cancel</Button>
            <Button onClick={handleAddBook} disabled={addBookMutation.isPending} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              {addBookMutation.isPending ? 'Adding...' : 'Add Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
