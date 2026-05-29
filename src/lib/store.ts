import { create } from 'zustand'

export type AppView = 'landing' | 'login' | 'app'
export type AppModule = 
  | 'dashboard' | 'students' | 'teachers' | 'attendance' | 'exams' | 'fees' 
  | 'communication' | 'ai' | 'settings'
  | 'library' | 'transport' | 'hostel' | 'alumni' | 'hr' | 'inventory' 
  | 'lms' | 'admission' | 'placement' | 'scholarship' | 'health' | 'lab'
  | 'owner'

export interface User {
  id: string
  name: string
  email: string
  role: string
  schoolId: string
  schoolName: string
  avatar?: string
  isDemo?: boolean
  isViewOnly?: boolean
}

interface AppState {
  // Navigation
  view: AppView
  module: AppModule
  setView: (view: AppView) => void
  setModule: (module: AppModule) => void

  // Auth
  user: User | null
  isAuthenticated: boolean
  isDemo: boolean
  isViewOnly: boolean
  isActivated: boolean
  login: (user: User) => void
  logout: () => void
  setActivated: (v: boolean) => void

  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Real-time
  onlineUsers: number
  setOnlineUsers: (count: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  view: 'landing',
  module: 'dashboard',
  setView: (view) => set({ view }),
  setModule: (module) => set({ module }),

  // Auth
  user: null,
  isAuthenticated: false,
  isDemo: false,
  isViewOnly: false,
  isActivated: false,
  login: (user) => set({ 
    user, 
    isAuthenticated: true, 
    view: 'app', 
    module: 'dashboard',
    isDemo: user.isDemo ?? false,
    isViewOnly: user.isViewOnly ?? false,
  }),
  logout: () => set({ 
    user: null, 
    isAuthenticated: false, 
    view: 'landing', 
    module: 'dashboard',
    isDemo: false,
    isViewOnly: false,
    isActivated: false,
  }),
  setActivated: (v) => set({ isActivated: v }),

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Real-time
  onlineUsers: 0,
  setOnlineUsers: (count) => set({ onlineUsers: count }),
}))
