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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MessageSquare,
  Bell,
  Send,
  Plus,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Megaphone,
  Mail,
  Eye,
  EyeOff,
  Search,
  Filter,
  AlertCircle,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// ── Types ───────────────────────────────────────────────────────
interface Announcement {
  id: string
  title: string
  content: string
  type: string
  target: string
  priority: string
  createdAt: string
  updatedAt: string
}

interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

interface CommunicationData {
  announcements: Announcement[]
  notifications: Notification[]
  unreadNotificationCount: number
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

// ── Badge colors ────────────────────────────────────────────────
const TYPE_BADGE: Record<string, string> = {
  general: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  academic: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  event: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
  emergency: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  maintenance: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  normal: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
}

const NOTIFICATION_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  info: { icon: Info, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/30' },
  warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  error: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
  success: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
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
function AnnouncementSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Component ──────────────────────────────────────────────
export function CommunicationModule() {
  const { user } = useAppStore()
  const queryClient = useQueryClient()
  const schoolId = user?.schoolId || ''
  const userId = user?.id || ''

  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false)
  const [notificationFilter, setNotificationFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formType, setFormType] = useState('general')
  const [formTarget, setFormTarget] = useState('all')
  const [formPriority, setFormPriority] = useState('normal')

  // Message state
  const [messageText, setMessageText] = useState('')

  // Fetch data
  const { data, isLoading, isError, error } = useQuery<CommunicationData>({
    queryKey: ['communication', schoolId, userId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (schoolId) params.set('schoolId', schoolId)
      if (userId) params.set('userId', userId)
      const res = await fetch(`/api/communication?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch communication data')
      const json = await res.json()
      return json.data
    },
    staleTime: 30_000,
  })

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create announcement')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Announcement created successfully')
      queryClient.invalidateQueries({ queryKey: ['communication'] })
      setAnnouncementDialogOpen(false)
      resetForm()
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create announcement')
    },
  })

  // Mark notification as read mutation
  const markReadMutation = useMutation({
    mutationFn: async ({ notificationId, read }: { notificationId: string; read: boolean }) => {
      const res = await fetch('/api/communication', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, read }),
      })
      if (!res.ok) throw new Error('Failed to update notification')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication'] })
    },
  })

  function resetForm() {
    setFormTitle('')
    setFormContent('')
    setFormType('general')
    setFormTarget('all')
    setFormPriority('normal')
  }

  function handleCreateAnnouncement() {
    if (!formTitle || !formContent) {
      toast.error('Please fill in title and content')
      return
    }
    createAnnouncementMutation.mutate({
      schoolId,
      title: formTitle,
      content: formContent,
      type: formType,
      target: formTarget,
      priority: formPriority,
    })
  }

  // Filtered announcements
  const filteredAnnouncements = (data?.announcements || []).filter(a => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
  })

  // Filtered notifications
  const filteredNotifications = (data?.notifications || []).filter(n => {
    if (!notificationFilter || notificationFilter === 'all') return true
    return n.type === notificationFilter
  })

  // Decorative conversations for messages tab
  const conversations = [
    { name: 'Mrs. Sharma', role: 'Teacher', lastMsg: 'Can we discuss the upcoming parent-teacher meeting?', time: '2m ago', unread: 2 },
    { name: 'Mr. Gupta', role: 'Parent', lastMsg: 'Thank you for the update on my child\'s progress.', time: '15m ago', unread: 0 },
    { name: 'Ms. Verma', role: 'Teacher', lastMsg: 'The science project submissions are due next week.', time: '1h ago', unread: 1 },
    { name: 'Dr. Patel', role: 'Principal', lastMsg: 'Staff meeting rescheduled to Thursday at 3 PM.', time: '3h ago', unread: 0 },
    { name: 'Mr. Singh', role: 'Parent', lastMsg: 'Is the school bus running on the holiday route?', time: '5h ago', unread: 0 },
  ]

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <AnnouncementSkeleton key={i} />)}
        </div>
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
        <h3 className="text-lg font-semibold">Failed to load communication data</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          {(error as Error)?.message || 'Something went wrong. Please try again later.'}
        </p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['communication'] })}>
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
            <MessageSquare className="h-5 w-5 text-emerald-500" />
            Communication Hub
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage announcements, notifications, and messaging</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs w-48"
            />
          </div>
          <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-emerald-500" />
                  New Announcement
                </DialogTitle>
                <DialogDescription>Create a new announcement for your school community.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Title *</Label>
                  <Input placeholder="Enter announcement title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Content *</Label>
                  <Textarea placeholder="Write your announcement..." rows={4} value={formContent} onChange={(e) => setFormContent(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Type</Label>
                    <Select value={formType} onValueChange={setFormType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Target</Label>
                    <Select value={formTarget} onValueChange={setFormTarget}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="teachers">Teachers</SelectItem>
                        <SelectItem value="parents">Parents</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Priority</Label>
                    <Select value={formPriority} onValueChange={setFormPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setAnnouncementDialogOpen(false)}>Cancel</Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateAnnouncement} disabled={createAnnouncementMutation.isPending}>
                    {createAnnouncementMutation.isPending ? 'Creating...' : 'Create Announcement'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="announcements" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="announcements" className="text-xs gap-1.5">
              <Megaphone className="h-3.5 w-3.5" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs gap-1.5 relative">
              <Bell className="h-3.5 w-3.5" />
              Notifications
              {(data?.unreadNotificationCount ?? 0) > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ml-1">
                  {data?.unreadNotificationCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Messages
            </TabsTrigger>
          </TabsList>

          {/* ── Announcements Tab ── */}
          <TabsContent value="announcements">
            {filteredAnnouncements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="hover:shadow-md transition-shadow group">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 shrink-0">
                          <Megaphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-foreground line-clamp-1">{announcement.title}</h4>
                            <Badge className={`text-[10px] shrink-0 ${PRIORITY_BADGE[announcement.priority] || PRIORITY_BADGE.normal}`}>
                              {announcement.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{announcement.content}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <Badge className={`text-[10px] ${TYPE_BADGE[announcement.type] || TYPE_BADGE.general}`}>
                              {announcement.type}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {announcement.target}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Megaphone className="h-12 w-12 opacity-30 mb-3" />
                <p className="text-sm font-medium">No announcements yet</p>
                <p className="text-xs">Create your first announcement to get started</p>
              </div>
            )}
          </TabsContent>

          {/* ── Notifications Tab ── */}
          <TabsContent value="notifications">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Notifications {data?.unreadNotificationCount ? `(${data.unreadNotificationCount} unread)` : ''}
              </h3>
              <div className="flex items-center gap-2">
                <Select value={notificationFilter} onValueChange={setNotificationFilter}>
                  <SelectTrigger className="h-8 text-xs w-32">
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
                {(data?.unreadNotificationCount ?? 0) > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => {
                      filteredNotifications.filter(n => !n.read).forEach(n => {
                        markReadMutation.mutate({ notificationId: n.id, read: true })
                      })
                      toast.success('All notifications marked as read')
                    }}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => {
                  const config = NOTIFICATION_ICON[notification.type] || NOTIFICATION_ICON.info
                  const NotifIcon = config.icon
                  return (
                    <Card
                      key={notification.id}
                      className={`transition-all hover:shadow-sm ${!notification.read ? 'border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10' : ''}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bg} shrink-0`}>
                            <NotifIcon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-sm ${!notification.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notification.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => markReadMutation.mutate({ notificationId: notification.id, read: !notification.read })}
                                >
                                  {notification.read ? (
                                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-3 w-3 text-emerald-600" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 opacity-30 mb-3" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs">You&apos;re all caught up!</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Messages Tab ── */}
          <TabsContent value="messages">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Conversations List */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-emerald-500" />
                    Conversations
                  </CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search messages..." className="pl-8 h-8 text-xs" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {conversations.map((conv, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-0 ${idx === 0 ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                            {conv.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground truncate">{conv.name}</p>
                            <span className="text-[10px] text-muted-foreground shrink-0">{conv.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{conv.lastMsg}</p>
                        </div>
                        {conv.unread > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shrink-0">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Message Compose Area */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    {conversations[0]?.name || 'Select a conversation'}
                  </CardTitle>
                  <CardDescription className="text-xs">{conversations[0]?.role || 'Start messaging'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Chat area placeholder */}
                    <div className="min-h-[280px] max-h-[280px] overflow-y-auto rounded-lg border border-border/50 p-4 bg-muted/20 space-y-3">
                      <div className="flex justify-start">
                        <div className="max-w-[75%] rounded-lg bg-background border border-border/50 p-3 shadow-sm">
                          <p className="text-xs text-foreground">{conversations[0]?.lastMsg}</p>
                          <span className="text-[10px] text-muted-foreground mt-1 block">{conversations[0]?.time}</span>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[75%] rounded-lg bg-emerald-600 text-white p-3 shadow-sm">
                          <p className="text-xs">Thanks for the information. I&apos;ll look into it right away.</p>
                          <span className="text-[10px] text-emerald-200 mt-1 block">Just now</span>
                        </div>
                      </div>
                    </div>

                    {/* Compose area */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="flex-1 h-9 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && messageText.trim()) {
                            toast.success('Message sent')
                            setMessageText('')
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        onClick={() => {
                          if (messageText.trim()) {
                            toast.success('Message sent')
                            setMessageText('')
                          }
                        }}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Send
                      </Button>
                    </div>
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
