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
import { motion, AnimatePresence } from 'framer-motion'


const navItems: { module: AppModule; label: string; icon: React.ElementType }[] = [
  { module: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { module: 'students', label: 'Students', icon: GraduationCap },
  { module: 'teachers', label: 'Teachers', icon: Users },
  { module: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { module: 'exams', label: 'Exams', icon: FileText },
  { module: 'fees', label: 'Fees', icon: DollarSign },
  { module: 'communication', label: 'Communication', icon: MessageSquare },
  { module: 'ai', label: 'AI Insights', icon: Brain },
  { module: 'settings', label: 'Settings', icon: Settings },
]

const moduleLabels: Record<AppModule, string> = {
  dashboard: 'Dashboard',
  students: 'Students',
  teachers: 'Teachers',
  attendance: 'Attendance',
  exams: 'Exams',
  fees: 'Fees',
  communication: 'Communication',
  ai: 'AI Insights',
  settings: 'Settings',
}

function PlaceholderModule({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
          <GraduationCap className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{name}</h2>
        <p className="text-muted-foreground max-w-md">
          This module is under construction. The {name} section will be available soon with full functionality.
        </p>
        <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
      </div>
    </div>
  )
}

function ModuleContent({ module }: { module: AppModule }) {
  switch (module) {
    case 'dashboard':
      return <DashboardModule />
    case 'students':
      return <StudentsModule />
    case 'teachers':
      return <TeachersModule />
    case 'attendance':
      return <AttendanceModule />
    case 'exams':
      return <ExamsModule />
    case 'fees':
      return <FeesModule />
    case 'communication':
      return <CommunicationModule />
    case 'ai':
      return <AiModule />
    case 'settings':
      return <SettingsModule />
    default:
      return <DashboardModule />
  }
}

function AppSidebar() {
  const { module, setModule, user, logout } = useAppStore()

  const userName = user?.name
  const userInitials = !userName
    ? 'U'
    : userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="px-4 py-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent">
              <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/30">
                <GraduationCap className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-foreground">EduFlow OS</span>
                <span className="truncate text-[11px] text-muted-foreground">Education Platform</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <Separator className="mx-4 w-auto opacity-50" />

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 mb-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const isActive = module === item.module
                return (
                  <SidebarMenuItem key={item.module}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setModule(item.module)}
                          className={`
                            group relative rounded-lg transition-all duration-200
                            ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold shadow-sm'
                                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                            }
                          `}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-500 dark:bg-emerald-400" />
                          )}
                          <item.icon
                            className={`transition-colors ${
                              isActive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-muted-foreground group-hover:text-foreground'
                            }`}
                          />
                          <span className="group-data-[collapsible=icon]:hidden">
                            {item.label}
                          </span>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                )
              })}
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
                <SidebarMenuButton
                  size="lg"
                  className="rounded-lg hover:bg-accent data-[state=open]:bg-accent"
                >
                  <Avatar className="h-8 w-8 rounded-lg border border-border/50">
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold text-foreground">
                      {user?.name || 'Admin User'}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {user?.role || 'Administrator'}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-xl shadow-lg"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || 'admin@eduflow.io'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                  onClick={() => logout()}
                >
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
        <h1 className="text-base font-semibold text-foreground">
          {moduleLabels[module]}
        </h1>
        {module === 'dashboard' && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            Live
          </Badge>
        )}
      </div>

      <div className="flex-1" />

      <div className="hidden md:flex items-center relative max-w-xs w-full">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search students, teachers..."
          className="pl-8 h-8 text-xs bg-muted/50 border-transparent focus:border-border focus:bg-background transition-colors rounded-lg"
        />
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg hover:bg-accent">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background">
                3
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>3 new notifications</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </header>
  )
}

export function AppShell() {
  const { module } = useAppStore()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
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
