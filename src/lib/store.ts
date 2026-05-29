import { create } from 'zustand'

export type AppView = 'landing' | 'login' | 'app'
export type AppModule = 'dashboard' | 'students' | 'teachers' | 'attendance' | 'exams' | 'fees' | 'communication' | 'ai' | 'settings'

export interface User {
  id: string
  name: string
  email: string
  role: string
  schoolId: string
  schoolName: string
  avatar?: string
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
  login: (user: User) => void
  logout: () => void

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
  login: (user) => set({ user, isAuthenticated: true, view: 'app', module: 'dashboard' }),
  logout: () => set({ user: null, isAuthenticated: false, view: 'landing', module: 'dashboard' }),

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Real-time
  onlineUsers: 0,
  setOnlineUsers: (count) => set({ onlineUsers: count }),
}))
