'use client'

import { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useERPStore, type ModuleKey, type AuthUser } from '@/store/erp-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  LayoutDashboard, Users, UserPlus, BookOpen, CalendarCheck,
  FileText, DollarSign, Briefcase, Bus, LibraryIcon, Building2,
  MessageSquare, Brain, Settings, ChevronLeft, ChevronRight,
  Search, Bell, Moon, Sun, Menu, X, Sparkles, GraduationCap,
  Shield, LogOut, User, School, ChevronDown, Bot, Command,
  PanelRightClose, CalendarDays, Package, BarChart3, Crown
} from 'lucide-react'

// Lazy load all module components
const Dashboard = lazy(() => import('@/components/erp/dashboard'))
const Students = lazy(() => import('@/components/erp/students'))
const Admissions = lazy(() => import('@/components/erp/admissions'))
const Academics = lazy(() => import('@/components/erp/academics'))
const Attendance = lazy(() => import('@/components/erp/attendance'))
const Examinations = lazy(() => import('@/components/erp/examinations'))
const Finance = lazy(() => import('@/components/erp/finance'))
const HR = lazy(() => import('@/components/erp/hr'))
const Transport = lazy(() => import('@/components/erp/transport'))
const Library = lazy(() => import('@/components/erp/library'))
const Hostel = lazy(() => import('@/components/erp/hostel'))
const Communication = lazy(() => import('@/components/erp/communication'))
const AICopilot = lazy(() => import('@/components/erp/ai-copilot'))
const Portals = lazy(() => import('@/components/erp/portals'))
const Calendar = lazy(() => import('@/components/erp/calendar'))
const Discipline = lazy(() => import('@/components/erp/discipline'))
const Inventory = lazy(() => import('@/components/erp/inventory'))
const Reports = lazy(() => import('@/components/erp/reports'))
const SettingsPage = lazy(() => import('@/components/erp/settings'))
const OwnerModule = lazy(() => import('@/components/erp/owner-module'))
const LoginPage = lazy(() => import('@/components/erp/login-page'))

const moduleComponents: Record<ModuleKey, React.ComponentType> = {
  dashboard: Dashboard,
  students: Students,
  admissions: Admissions,
  academics: Academics,
  attendance: Attendance,
  examinations: Examinations,
  finance: Finance,
  hr: HR,
  transport: Transport,
  library: Library,
  hostel: Hostel,
  communication: Communication,
  'ai-copilot': AICopilot,
  calendar: Calendar,
  discipline: Discipline,
  inventory: Inventory,
  reports: Reports,
  'parent-portal': Portals,
  'student-portal': Portals,
  'teacher-portal': Portals,
  owner: OwnerModule,
  settings: SettingsPage,
}

// Icon gradient mapping for macOS-style app icons
const iconGradients: Record<string, string> = {
  emerald: 'from-teal-400 to-cyan-500',
  teal: 'from-teal-400 to-cyan-500',
  cyan: 'from-cyan-400 to-sky-500',
  amber: 'from-amber-400 to-orange-500',
  green: 'from-green-400 to-emerald-500',
  rose: 'from-rose-400 to-pink-500',
  orange: 'from-orange-400 to-red-500',
  sky: 'from-sky-400 to-blue-500',
  purple: 'from-purple-400 to-violet-500',
  pink: 'from-pink-400 to-rose-500',
  blue: 'from-blue-400 to-indigo-500',
  violet: 'from-violet-400 to-purple-500',
  gray: 'from-slate-400 to-slate-500',
}

// Icon shadow mapping
const iconShadows: Record<string, string> = {
  emerald: 'shadow-teal-500/30',
  teal: 'shadow-teal-500/30',
  cyan: 'shadow-cyan-500/30',
  amber: 'shadow-amber-500/30',
  green: 'shadow-green-500/30',
  rose: 'shadow-rose-500/30',
  orange: 'shadow-orange-500/30',
  sky: 'shadow-sky-500/30',
  purple: 'shadow-purple-500/30',
  pink: 'shadow-pink-500/30',
  blue: 'shadow-blue-500/30',
  violet: 'shadow-violet-500/30',
  gray: 'shadow-slate-500/20',
}

interface NavItem {
  key: ModuleKey
  label: string
  icon: React.ElementType
  badge?: string
  color: string
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'emerald' },
      { key: 'reports', label: 'Reports', icon: BarChart3, color: 'cyan' },
      { key: 'ai-copilot', label: 'AI Copilot', icon: Brain, badge: 'AI', color: 'violet' },
    ],
  },
  {
    label: 'Academic',
    items: [
      { key: 'students', label: 'Students', icon: Users, badge: '1.1K', color: 'teal' },
      { key: 'admissions', label: 'Admissions', icon: UserPlus, color: 'cyan' },
      { key: 'academics', label: 'Academics', icon: BookOpen, color: 'amber' },
      { key: 'attendance', label: 'Attendance', icon: CalendarCheck, color: 'green' },
      { key: 'examinations', label: 'Examinations', icon: FileText, color: 'rose' },
      { key: 'discipline', label: 'Discipline', icon: Shield, color: 'orange' },
      { key: 'calendar', label: 'Calendar', icon: CalendarDays, color: 'teal' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { key: 'finance', label: 'Finance & Fees', icon: DollarSign, color: 'emerald' },
      { key: 'hr', label: 'HR & Payroll', icon: Briefcase, color: 'orange' },
      { key: 'transport', label: 'Transport', icon: Bus, color: 'sky' },
      { key: 'library', label: 'Library', icon: LibraryIcon, color: 'purple' },
      { key: 'hostel', label: 'Hostel', icon: Building2, color: 'pink' },
      { key: 'inventory', label: 'Inventory', icon: Package, color: 'teal' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { key: 'communication', label: 'Communication', icon: MessageSquare, badge: '3', color: 'blue' },
    ],
  },
  {
    label: 'Portals',
    items: [
      { key: 'parent-portal', label: 'Parent Portal', icon: Users, color: 'teal' },
      { key: 'student-portal', label: 'Student Portal', icon: GraduationCap, color: 'amber' },
      { key: 'teacher-portal', label: 'Teacher Portal', icon: BookOpen, color: 'violet' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { key: 'owner', label: 'Owner Panel', icon: Crown, color: 'purple' },
    ],
  },
  {
    label: 'System',
    items: [
      { key: 'settings', label: 'Settings', icon: Settings, color: 'gray' },
    ],
  },
]

const notifications = [
  { id: 1, title: 'New admission application', desc: 'Ahmed Khan applied for Grade 5', time: '5m ago', type: 'info' },
  { id: 2, title: 'Fee payment received', desc: 'Rs. 15,000 from Fatima Ali', time: '15m ago', type: 'success' },
  { id: 3, title: 'Attendance alert', desc: '8 students absent in Grade 7', time: '30m ago', type: 'warning' },
  { id: 4, title: 'Exam results published', desc: 'Grade 10 Mid-term results are out', time: '1h ago', type: 'info' },
  { id: 5, title: 'System update', desc: 'EduFlow v2.1 deployed successfully', time: '2h ago', type: 'success' },
]

function ModuleLoader() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg border-2 border-teal-500/20 border-t-teal-500 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// Enterprise-level icon box for sidebar
function TahoeIconBox({ icon: Icon, color, isActive }: { icon: React.ElementType; color: string; isActive: boolean }) {
  const gradient = iconGradients[color] || iconGradients.gray
  const shadow = iconShadows[color] || iconShadows.gray

  return (
    <div
      className={cn(
        'relative w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-all duration-300',
        isActive
          ? `bg-gradient-to-br ${gradient} shadow-md ${shadow}`
          : 'bg-foreground/[0.05] dark:bg-foreground/[0.07]'
      )}
    >
      <Icon className={cn(
        'w-[17px] h-[17px] transition-all duration-300',
        isActive ? 'text-white drop-shadow-sm' : 'text-foreground/60 dark:text-foreground/50'
      )} />
      {isActive && (
        <div className={cn('absolute inset-0 rounded-[10px] bg-gradient-to-t from-black/10 to-transparent pointer-events-none')} />
      )}
    </div>
  )
}

// Sonoma-style breadcrumb badge for header
function SonomaModuleBadge() {
  return (
    <div className="hidden lg:flex items-center gap-2 mr-1">
      <div className="w-[3px] h-4 rounded-full bg-gradient-to-b from-teal-500 to-cyan-600 dark:from-teal-400 dark:to-cyan-500" />
      <span className="text-tahoe-caption text-muted-foreground/50 dark:text-foreground/25 font-medium">EduFlow</span>
      <span className="text-tahoe-micro text-muted-foreground/20 dark:text-foreground/10">/</span>
    </div>
  )
}

// Desktop sidebar component — defined outside render to avoid lint error
interface DesktopSidebarProps {
  collapsed: boolean
  activeModule: ModuleKey
  searchQuery: string
  onNavClick: (key: ModuleKey) => void
  onSearchChange: (value: string) => void
  onToggleCollapse: () => void
  user: AuthUser | null
}

function DesktopSidebar({ collapsed, activeModule, searchQuery, onNavClick, onSearchChange, onToggleCollapse, user }: DesktopSidebarProps) {
  const allNavItems = navGroups.flatMap(g => g.items)
  const filteredNavItems = searchQuery
    ? allNavItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  return (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className={cn(
        'flex items-center h-[52px] px-4 flex-shrink-0',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        <div className="flex items-center gap-2.5">
          <div className="tahoe-icon-box w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30">
            <School className="w-[18px] h-[18px] text-white" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <h1 className="text-tahoe-heading text-foreground tracking-tight">EduFlow</h1>
              <p className="text-tahoe-micro text-teal-600 dark:text-teal-400 -mt-0.5">Intelligent Education OS</p>
            </motion.div>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-7 w-7 text-muted-foreground dark:text-foreground/30 hover:text-foreground hover:bg-foreground/5 rounded-xl"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Search in Sidebar */}
      {!collapsed && (
        <div className="px-3 py-1.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground dark:text-foreground/25" />
            <Input
              placeholder="Search modules..."
              className={cn(
                'pl-8 h-8 glass text-foreground/80 text-tahoe-caption placeholder:text-muted-foreground dark:placeholder:text-muted-foreground dark:text-foreground/25',
                'border-0 rounded-xl focus:ring-1 focus:ring-teal-400/30'
              )}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <kbd className="text-[9px] font-mono text-foreground/20 bg-foreground/5 rounded px-1 py-0.5">⌘</kbd>
              <kbd className="text-[9px] font-mono text-foreground/20 bg-foreground/5 rounded px-1 py-0.5">K</kbd>
            </div>
          </div>
          {searchQuery && filteredNavItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 space-y-0.5"
            >
              {filteredNavItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => onNavClick(item.key)}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-tahoe-caption text-foreground/60 hover:bg-foreground/5 hover:text-foreground transition-all duration-200"
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Navigation Groups */}
      <ScrollArea className="flex-1 px-2 py-1">
        <div className="space-y-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 mb-1 text-tahoe-micro text-muted-foreground/60 dark:text-foreground/20">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeModule === item.key
                  return (
                    <TooltipProvider key={item.key} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.button
                            layout
                            onClick={() => onNavClick(item.key)}
                            className={cn(
                              'flex items-center gap-2.5 w-full rounded-xl transition-all duration-200 relative group',
                              collapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-[9px]',
                              isActive
                                ? 'bg-foreground/[0.06] dark:bg-foreground/[0.08] text-foreground'
                                : 'text-foreground/50 dark:text-foreground/40 hover:bg-foreground/[0.04] hover:text-foreground/70 dark:hover:text-foreground/60'
                            )}
                          >
                            <TahoeIconBox icon={item.icon} color={item.color} isActive={isActive} />
                            {!collapsed && (
                              <>
                                <span className={cn(
                                  'text-tahoe-caption truncate flex-1 text-left transition-colors duration-200',
                                  isActive ? 'text-foreground font-medium' : ''
                                )}>
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'h-5 text-[10px] px-1.5 border-0 rounded-lg font-medium',
                                      item.key === 'ai-copilot'
                                        ? 'bg-violet-100 dark:bg-violet-400/15 text-violet-600 dark:text-violet-400'
                                        : isActive
                                          ? 'bg-teal-100 dark:bg-teal-400/15 text-teal-600 dark:text-teal-400'
                                          : 'bg-foreground/[0.06] text-muted-foreground dark:text-foreground/35'
                                    )}
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                              </>
                            )}
                          </motion.button>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right" className="glass-elevated text-foreground border-0 rounded-xl text-tahoe-caption">
                            {item.label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Sidebar Footer */}
      <div className={cn(
        'p-3 flex-shrink-0 border-t border-border',
        collapsed ? 'flex flex-col items-center gap-2' : ''
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-foreground/[0.03] dark:bg-foreground/[0.05] mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 shadow-md shadow-teal-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-tahoe-caption text-foreground font-medium">EduFlow Pro</p>
              <p className="text-tahoe-micro text-foreground/40 dark:text-foreground/30">AI-Powered ERP</p>
            </div>
          </div>
        )}
        <div className={cn(
          'flex items-center gap-2.5',
          collapsed ? 'flex-col' : ''
        )}>
          <Avatar className="w-8 h-8 border border-foreground/10 shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-400/20 dark:to-cyan-500/20 text-teal-600 dark:text-teal-400 text-tahoe-caption font-bold">
              {user?.avatar || user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-tahoe-caption text-foreground font-medium truncate">{user?.name || 'User'}</p>
                {user?.role === 'viewer' && (
                  <Badge className="h-4 text-[9px] px-1.5 bg-violet-100 dark:bg-violet-400/15 text-violet-600 dark:text-violet-400 border-0 rounded-md font-semibold">
                    VIEW ONLY
                  </Badge>
                )}
              </div>
              <p className="text-tahoe-micro text-muted-foreground dark:text-foreground/30 truncate">{user?.email || ''}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { activeModule, setActiveModule, copilotOpen, setCopilotOpen, selectedCampus, setSelectedCampus, user, isAuthenticated, isAuthLoading, setUser, setTenantCode, setSchoolId } = useERPStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Start in light mode by default
    document.documentElement.classList.remove('dark')

    // Seed database — fire and forget, never blocks rendering
    fetch('/api/seed', { method: 'POST' }).catch(() => {})

    // Check existing session — handle gracefully if API fails
    fetch('/api/auth/session')
      .then(async res => {
        // Guard against non-JSON responses (e.g., Vercel error pages)
        if (!res.ok) return null
        try {
          return await res.json()
        } catch {
          return null
        }
      })
      .then(data => {
        if (data?.authenticated && data?.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      })
      .catch(() => setUser(null))

    // Safety timeout: if session check takes too long, show login page anyway
    const timeout = setTimeout(() => {
      const { isAuthLoading } = useERPStore.getState()
      if (isAuthLoading) {
        setUser(null)
      }
    }, 8000)

    return () => clearTimeout(timeout)
  }, [setUser])

  const handleLogin = useCallback((_user: AuthUser) => {
    setUser(_user)
    if (_user.tenantCode) setTenantCode(_user.tenantCode)
    if (_user.schoolId) setSchoolId(_user.schoolId)
    // Owner users should land on owner module
    if (_user.role === 'owner' || _user.tenantCode === 'OWNER') {
      setActiveModule('owner')
    }
  }, [setUser, setTenantCode, setSchoolId, setActiveModule])

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [setUser])

  const toggleTheme = useCallback(() => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }, [isDark])

  const ActiveComponent = moduleComponents[activeModule]
  const allNavItems = navGroups.flatMap(g => g.items)

  const filteredNavItems = searchQuery
    ? allNavItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const getModuleTitle = () => {
    const item = allNavItems.find(i => i.key === activeModule)
    return item?.label || 'Dashboard'
  }

  const handleNavClick = useCallback((key: ModuleKey) => {
    setActiveModule(key)
    setMobileMenuOpen(false)
    setSearchQuery('')
  }, [setActiveModule])

  // Auth loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <div className="tahoe-bg" />
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 flex items-center justify-center animate-gentle-float">
              <School className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin" />
            <p className="text-tahoe-caption text-muted-foreground">Loading EduFlow...</p>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated - show login page
  if (!isAuthenticated || !user) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin" /></div>}>
        <LoginPage onLogin={handleLogin} isSeeding={false} />
      </Suspense>
    )
  }

  // Get user initials for avatar
  const userInitials = user.avatar || user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={cn('min-h-screen bg-background flex relative overflow-hidden', user.role === 'viewer' && 'view-only-mode')}>
      {/* Tahoe Dynamic Background */}
      <div className="tahoe-bg" />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'hidden lg:flex flex-col flex-shrink-0 glass-sidebar glass-lens z-30 relative',
          'overflow-hidden'
        )}
      >
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          activeModule={activeModule}
          searchQuery={searchQuery}
          onNavClick={handleNavClick}
          onSearchChange={setSearchQuery}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={user}
        />

        {/* Expand button when collapsed */}
        {sidebarCollapsed && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground dark:text-foreground/30 hover:text-foreground hover:bg-foreground/5 rounded-xl"
              onClick={() => setSidebarCollapsed(false)}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </motion.aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="glass-sidebar glass-lens border-0 p-0 w-72 [&>button]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-between px-4 h-[52px] border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="tahoe-icon-box w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30">
                <School className="w-[18px] h-[18px] text-white" />
              </div>
              <div>
                <h1 className="text-tahoe-heading text-foreground">EduFlow</h1>
                <p className="text-tahoe-micro text-teal-600 dark:text-teal-400 -mt-0.5">Intelligent Education OS</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground dark:text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-xl"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Nav */}
          <ScrollArea className="flex-1 px-2 py-2">
            <div className="space-y-3">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 mb-1 text-tahoe-micro text-muted-foreground/60 dark:text-foreground/20">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = activeModule === item.key
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleNavClick(item.key)}
                          className={cn(
                            'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl transition-all duration-200',
                            isActive
                              ? 'glass-tinted-teal glass-lens'
                              : 'text-foreground/60 dark:text-foreground/45 hover:bg-foreground/[0.04] hover:text-foreground/80 dark:hover:text-foreground/70'
                          )}
                        >
                          <TahoeIconBox icon={item.icon} color={item.color} isActive={isActive} />
                          <span className={cn(
                            'text-tahoe-caption truncate flex-1 text-left',
                            isActive ? 'text-foreground font-medium' : ''
                          )}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'h-5 text-[10px] px-1.5 border-0 rounded-lg font-medium',
                                item.key === 'ai-copilot'
                                  ? 'bg-violet-100 dark:bg-violet-400/15 text-violet-600 dark:text-violet-400'
                                  : 'bg-foreground/[0.06] text-muted-foreground dark:text-foreground/35'
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Mobile User */}
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl glass-tinted-teal">
              <Avatar className="w-8 h-8 border border-foreground/10">
                <AvatarFallback className="bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-400/20 dark:to-cyan-500/20 text-teal-600 dark:text-teal-400 text-tahoe-caption font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-tahoe-caption text-foreground font-medium truncate">{user.name}</p>
                  {user.role === 'viewer' && (
                    <Badge className="h-4 text-[9px] px-1.5 bg-violet-100 dark:bg-violet-400/15 text-violet-600 dark:text-violet-400 border-0 rounded-md font-semibold">
                      VIEW ONLY
                    </Badge>
                  )}
                </div>
                <p className="text-tahoe-micro text-muted-foreground dark:text-foreground/30">{user.email}</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        {/* Header — glass-toolbar with Tahoe style */}
        <header className="h-[52px] flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-20 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {/* View Only Banner (for viewer role) */}
            {user.role === 'viewer' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-400/10 border border-violet-200/50 dark:border-violet-400/20">
                <Shield className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                <span className="text-tahoe-micro text-violet-600 dark:text-violet-400 font-semibold">VIEW ONLY</span>
              </div>
            )}

            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-xl h-8 w-8"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>

            {/* Breadcrumb / Module Title */}
            <div className="flex items-center gap-2">
              <SonomaModuleBadge />
              <h2 className="text-tahoe-heading text-foreground tracking-tight">{getModuleTitle()}</h2>
              <Separator orientation="vertical" className="h-4 bg-foreground/10 hidden sm:block" />
              <p className="text-tahoe-caption text-muted-foreground dark:text-foreground/30 hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {/* Campus Selector — Tahoe Pill */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden sm:flex tahoe-pill glass items-center gap-1.5 text-foreground/60 hover:text-foreground">
                  <School className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  <span className="text-tahoe-caption">
                    {selectedCampus === 'all' ? 'All Campuses' : selectedCampus === 'main' ? 'Main Campus' : 'City Campus'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground dark:text-foreground/30" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-elevated border-0 rounded-2xl min-w-[180px] p-1.5">
                <DropdownMenuItem
                  className="rounded-xl text-tahoe-caption text-foreground/60 focus:text-foreground focus:bg-foreground/[0.04] cursor-pointer"
                  onClick={() => setSelectedCampus('all')}
                >
                  All Campuses
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-xl text-tahoe-caption text-foreground/60 focus:text-foreground focus:bg-foreground/[0.04] cursor-pointer"
                  onClick={() => setSelectedCampus('main')}
                >
                  Main Campus
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-xl text-tahoe-caption text-foreground/60 focus:text-foreground focus:bg-foreground/[0.04] cursor-pointer"
                  onClick={() => setSelectedCampus('city')}
                >
                  City Campus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Header Search */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground dark:text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-xl"
                    onClick={() => setSearchOpen(!searchOpen)}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="glass-elevated border-0 rounded-xl text-tahoe-caption">Search</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Theme Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground dark:text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-xl"
                    onClick={toggleTheme}
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="glass-elevated border-0 rounded-xl text-tahoe-caption">Toggle theme</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* AI Copilot Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8 rounded-xl transition-all duration-300',
                      copilotOpen
                        ? 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-400/10 hover:bg-violet-200 dark:hover:bg-violet-400/15'
                        : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'
                    )}
                    onClick={() => setCopilotOpen(!copilotOpen)}
                  >
                    {copilotOpen ? <PanelRightClose className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="glass-elevated border-0 rounded-xl text-tahoe-caption">AI Copilot</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 text-muted-foreground dark:text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-xl"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full shadow-sm shadow-rose-500/40 animate-pulse-glow" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-elevated border-0 rounded-2xl w-80 p-1.5">
                <DropdownMenuLabel className="text-foreground flex items-center justify-between px-3 py-2">
                  <span className="text-tahoe-heading">Notifications</span>
                  <Badge className="bg-rose-100 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400 border-0 text-[10px] px-2 rounded-lg font-medium">
                    5 new
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-foreground/[0.04]" />
                {notifications.map(n => (
                  <DropdownMenuItem
                    key={n.id}
                    className="flex flex-col items-start gap-1 py-2.5 px-3 rounded-xl focus:bg-foreground/[0.04] cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-tahoe-caption text-foreground font-medium">{n.title}</span>
                      <span className="text-tahoe-micro text-muted-foreground/60 dark:text-foreground/20 ml-auto whitespace-nowrap">{n.time}</span>
                    </div>
                    <span className="text-tahoe-caption text-foreground/40">{n.desc}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-foreground/[0.04]" />
                <DropdownMenuItem className="text-teal-600 dark:text-teal-400 focus:text-teal-700 dark:focus:text-teal-300 focus:bg-foreground/[0.04] text-center justify-center text-tahoe-caption rounded-xl py-2">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 hover:bg-foreground/[0.04] rounded-xl px-1.5 py-1 transition-all duration-200">
                  <Avatar className="w-7 h-7 border border-foreground/10 shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-400/20 dark:to-cyan-500/20 text-teal-600 dark:text-teal-400 text-[10px] font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-3 h-3 text-muted-foreground/50 dark:text-foreground/20 hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-elevated border-0 rounded-2xl w-56 p-1.5">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-tahoe-caption text-foreground font-medium">{user.name}</span>
                      {user.role === 'viewer' && (
                        <Badge className="h-4 text-[9px] px-1.5 bg-violet-100 dark:bg-violet-400/15 text-violet-600 dark:text-violet-400 border-0 rounded-md font-semibold">
                          VIEW ONLY
                        </Badge>
                      )}
                    </div>
                    <span className="text-tahoe-micro text-muted-foreground dark:text-foreground/30">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-foreground/[0.04]" />
                <DropdownMenuItem className="text-foreground/60 focus:text-foreground focus:bg-foreground/[0.04] cursor-pointer rounded-xl text-tahoe-caption py-2">
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground/60 focus:text-foreground focus:bg-foreground/[0.04] cursor-pointer rounded-xl text-tahoe-caption py-2">
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground/60 focus:text-foreground focus:bg-foreground/[0.04] cursor-pointer rounded-xl text-tahoe-caption py-2">
                  <Shield className="w-4 h-4 mr-2" /> Security
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-foreground/[0.04]" />
                <DropdownMenuItem
                  className="text-rose-600 dark:text-rose-400 focus:text-rose-700 dark:focus:text-rose-300 focus:bg-rose-100 dark:focus:bg-rose-400/5 cursor-pointer rounded-xl text-tahoe-caption py-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Search Overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute top-[52px] left-0 right-0 z-30 glass-elevated glass-lens p-4"
            >
              <div className="max-w-xl mx-auto">
                <div className="relative">
                  <Command className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-foreground/30" />
                  <Input
                    autoFocus
                    placeholder="Search modules, students, staff..."
                    className="pl-10 h-10 glass border-0 rounded-2xl text-tahoe-body text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground dark:text-foreground/25 focus:ring-1 focus:ring-teal-400/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchOpen(false)
                        setSearchQuery('')
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground dark:text-foreground/30 hover:text-foreground rounded-xl"
                    onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {searchQuery && filteredNavItems.length > 0 && (
                  <div className="mt-3 space-y-0.5">
                    {filteredNavItems.map(item => (
                      <button
                        key={item.key}
                        onClick={() => { handleNavClick(item.key); setSearchOpen(false); setSearchQuery('') }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-foreground/60 hover:bg-foreground/[0.04] hover:text-foreground transition-all duration-200"
                      >
                        <TahoeIconBox icon={item.icon} color={item.color} isActive={false} />
                        <span className="text-tahoe-caption">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery && filteredNavItems.length === 0 && (
                  <p className="text-center text-tahoe-caption text-muted-foreground dark:text-foreground/25 py-4">No results found</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="p-5 lg:p-6 pb-8 max-w-[1600px] mx-auto">
            {/* Main Module Content */}
            <motion.div
              className="flex-1 transition-all duration-500"
              animate={{ marginRight: copilotOpen ? 384 : 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Suspense fallback={<ModuleLoader />}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeModule}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.99 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                  >
                    <ActiveComponent />
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </motion.div>

            {/* AI Copilot Side Panel */}
            <AnimatePresence>
              {copilotOpen && (
                <motion.div
                  initial={{ x: 384, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 384, opacity: 0 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                  className="hidden lg:block w-96 fixed right-0 top-[52px] bottom-0 glass-elevated glass-lens z-10 flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Copilot Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="tahoe-icon-box w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 shadow-md shadow-violet-500/25">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-tahoe-heading text-foreground">AI Copilot</h3>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse-glow" />
                            <span className="text-tahoe-micro text-teal-600 dark:text-teal-400">Online</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground dark:text-foreground/30 hover:text-foreground hover:bg-foreground/5 rounded-xl"
                        onClick={() => setCopilotOpen(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <Separator className="bg-foreground/[0.04] mb-4" />

                    <AICopilot />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
