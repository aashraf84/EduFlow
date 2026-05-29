'use client'

import { useAppStore, type AppModule } from '@/lib/store'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  DollarSign,
  MessageSquare,
  Brain,
  Settings,
  LogOut,
  Bell,
  Search,
  BookOpen,
  ClipboardList,
  Briefcase,
  Award,
  Heart,
  FlaskConical,
  Library,
  Bus,
  Building2,
  Package,
  MonitorPlay,
  UserPlus,
  Trophy,
  Stethoscope,
  Beaker,
  Shield,
  Lock,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DashboardModule } from '@/components/dashboard/dashboard-module'
import { StudentsModule } from '@/components/students/students-module'
import { TeachersModule } from '@/components/teachers/teachers-module'
import { AttendanceModule } from '@/components/attendance/attendance-module'
import { ExamsModule } from '@/components/exams/exams-module'
import { FeesModule } from '@/components/fees/fees-module'
import { CommunicationModule } from '@/components/communication/communication-module'
import { AiModule } from '@/components/ai/ai-module'
import { SettingsModule } from '@/components/settings/settings-module'
import { LmsModule } from '@/components/lms/lms-module'
import { AdmissionModule } from '@/components/admission/admission-module'
import { PlacementModule } from '@/components/placement/placement-module'
import { ScholarshipModule } from '@/components/scholarship/scholarship-module'
import { HealthModule } from '@/components/health/health-module'
import { LabModule } from '@/components/lab/lab-module'
import { LibraryModule } from '@/components/library/library-module'
import { TransportModule } from '@/components/transport/transport-module'
import { HostelModule } from '@/components/hostel/hostel-module'
import { AlumniModule } from '@/components/alumni/alumni-module'
import { HrModule } from '@/components/hr/hr-module'
import { InventoryModule } from '@/components/inventory/inventory-module'
import { OwnerModule } from '@/components/owner/owner-module'
import { motion, AnimatePresence } from 'framer-motion'

interface NavItem {
  module: AppModule
  label: string
  icon: React.ElementType
}

const coreNavItems: NavItem[] = [
  { module: 'dashboard', label: 'Control Tower', icon: LayoutDashboard },
  { module: 'students', label: 'Students', icon: GraduationCap },
  { module: 'teachers', label: 'Teachers', icon: Users },
  { module: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { module: 'exams', label: 'Exams & Grades', icon: FileText },
  { module: 'fees', label: 'Fees & Finance', icon: DollarSign },
]

const academicNavItems: NavItem[] = [
  { module: 'lms', label: 'LMS / eLearning', icon: MonitorPlay },
  { module: 'admission', label: 'Admissions', icon: UserPlus },
  { module: 'library', label: 'Library', icon: Library },
  { module: 'lab', label: 'Labs', icon: Beaker },
  { module: 'scholarship', label: 'Scholarships', icon: Award },
  { module: 'placement', label: 'Placements', icon: Trophy },
]

const operationsNavItems: NavItem[] = [
  { module: 'communication', label: 'Communication', icon: MessageSquare },
  { module: 'transport', label: 'Transport', icon: Bus },
  { module: 'hostel', label: 'Hostel', icon: Building2 },
  { module: 'health', label: 'Health Records', icon: Stethoscope },
  { module: 'hr', label: 'HR & Payroll', icon: Briefcase },
  { module: 'inventory', label: 'Inventory', icon: Package },
  { module: 'alumni', label: 'Alumni Network', icon: GraduationCap },
]

const businessNavItems: NavItem[] = [
  { module: 'owner', label: 'ERP Owner Hub', icon: Shield },
]

const intelligenceNavItems: NavItem[] = [
  { module: 'ai', label: 'AI Intelligence', icon: Brain },
  { module: 'settings', label: 'Settings', icon: Settings },
]

const moduleLabels: Record<AppModule, string> = {
  dashboard: 'Control Tower',
  students: 'Student Intelligence',
  teachers: 'Teacher Management',
  attendance: 'Attendance & Discipline',
  exams: 'Exams & Grading',
  fees: 'Fees & Finance',
  communication: 'Communication Hub',
  ai: 'AI Intelligence',
  lms: 'LMS / Online Learning',
  admission: 'Admission Portal',
  placement: 'Placement & Career',
  scholarship: 'Scholarship Management',
  health: 'Health & Medical',
  lab: 'Lab Management',
  library: 'Library Management',
  transport: 'Transport Management',
  hostel: 'Hostel & Residence',
  alumni: 'Alumni Network',
  hr: 'HR & Payroll',
  inventory: 'Inventory & Assets',
  settings: 'Settings',
  owner: 'ERP Owner Hub',
}

function ModuleContent({ module }: { module: AppModule }) {
  switch (module) {
    case 'dashboard': return <DashboardModule />
    case 'students': return <StudentsModule />
    case 'teachers': return <TeachersModule />
    case 'attendance': return <AttendanceModule />
    case 'exams': return <ExamsModule />
    case 'fees': return <FeesModule />
    case 'communication': return <CommunicationModule />
    case 'ai': return <AiModule />
    case 'lms': return <LmsModule />
    case 'admission': return <AdmissionModule />
    case 'placement': return <PlacementModule />
    case 'scholarship': return <ScholarshipModule />
    case 'health': return <HealthModule />
    case 'lab': return <LabModule />
    case 'library': return <LibraryModule />
    case 'transport': return <TransportModule />
    case 'hostel': return <HostelModule />
    case 'alumni': return <AlumniModule />
    case 'hr': return <HrModule />
    case 'inventory': return <InventoryModule />
    case 'settings': return <SettingsModule />
    case 'owner': return <OwnerModule />
    default: return <DashboardModule />
  }
}

function NavSection({ items, currentModule, onNavigate }: { items: NavItem[], currentModule: AppModule, onNavigate: (m: AppModule) => void }) {
  return (
    <>
      {items.map((item) => {
        const isActive = currentModule === item.module
        return (
          <SidebarMenuItem key={item.module}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  isActive={isActive}
                  onClick={() => onNavigate(item.module)}
                  className={`
                    group relative rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold shadow-sm'
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-emerald-500 dark:bg-emerald-400" />
                  )}
                  <item.icon className={`size-4 transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  <span className="group-data-[collapsible=icon]:hidden text-[13px]">{item.label}</span>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        )
      })}
    </>
  )
}

function AppSidebar() {
  const { module, setModule, user, logout } = useAppStore()
  const userInitials = !user?.name ? 'U' : user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="px-4 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent">
              <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/30">
                <GraduationCap className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-foreground">EduFlow OS</span>
                <span className="truncate text-[10px] text-muted-foreground">Education Platform</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <Separator className="mx-4 w-auto opacity-50" />

      <SidebarContent className="px-3 py-2 overflow-y-auto">
        {/* Core Modules */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 px-2 mb-0.5">
            Core
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <NavSection items={coreNavItems} currentModule={module} onNavigate={setModule} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Academic Modules */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 px-2 mb-0.5 mt-1">
            Academic
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <NavSection items={academicNavItems} currentModule={module} onNavigate={setModule} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations Modules */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 px-2 mb-0.5 mt-1">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <NavSection items={operationsNavItems} currentModule={module} onNavigate={setModule} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Business */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400 px-2 mb-0.5 mt-1">
            Business
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <NavSection items={businessNavItems} currentModule={module} onNavigate={setModule} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Intelligence */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 px-2 mb-0.5 mt-1">
            Intelligence
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <NavSection items={intelligenceNavItems} currentModule={module} onNavigate={setModule} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <Separator className="mx-4 w-auto opacity-50" />

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="rounded-lg hover:bg-accent data-[state=open]:bg-accent">
                  <Avatar className="h-8 w-8 rounded-lg border border-border/50">
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold text-foreground">{user?.name || 'Admin User'}</span>
                    <span className="truncate text-[11px] text-muted-foreground">{user?.role || 'Administrator'}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl shadow-lg" side="top" align="start" sideOffset={4}>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || 'admin@eduflow.io'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => setModule('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function AppHeader() {
  const { module } = useAppStore()

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border/50 bg-background/80 backdrop-blur-sm px-4 sticky top-0 z-30">
      <SidebarTrigger className="-ml-1 hover:bg-accent rounded-lg" />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold text-foreground">{moduleLabels[module]}</h1>
        {module === 'dashboard' && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            Live
          </Badge>
        )}
      </div>
      <div className="flex-1" />
      <div className="hidden md:flex items-center relative max-w-xs w-full">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search students, teachers..." className="pl-8 h-8 text-xs bg-muted/50 border-transparent focus:border-border focus:bg-background transition-colors rounded-lg" />
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg hover:bg-accent">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background">3</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>3 new notifications</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </header>
  )
}

export function AppShell() {
  const { module, isViewOnly } = useAppStore()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <AppHeader />
        {isViewOnly && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Demo Mode — View Only Access</span>
          </div>
        )}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={module}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="p-4 md:p-6"
            >
              <ModuleContent module={module} />
            </motion.div>
          </AnimatePresence>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
