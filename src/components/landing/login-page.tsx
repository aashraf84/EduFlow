'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  GraduationCap, Shield, Loader2, Building2, Key,
  Brain, BarChart3, Users, BookOpen, Sparkles, Check
} from 'lucide-react'
import { useState } from 'react'

const highlights = [
  { icon: GraduationCap, title: 'Student Intelligence', desc: 'Full lifecycle from admission to alumni' },
  { icon: Users, title: 'Teacher Management', desc: 'Profiles, performance & payroll' },
  { icon: BarChart3, title: 'Control Tower', desc: 'Real-time KPIs & smart alerts' },
  { icon: BookOpen, title: '21+ Modules', desc: 'Attendance, exams, fees, LMS & more' },
  { icon: Brain, title: 'AI-Powered', desc: 'Risk detection & auto-insights' },
  { icon: Sparkles, title: 'Multi-Tenant', desc: 'Isolated DB per institution' },
]

export function LoginPage() {
  const { login, setActivated } = useAppStore()
  const [schoolCode, setSchoolCode] = useState('GIA-001')
  const [email, setEmail] = useState('admin@greenfieldacademy.edu')
  const [password, setPassword] = useState('admin123')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, schoolCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed. Please check your credentials.')
        return
      }

      const userData = data.data?.user
      const tenantCode = data.data?.tenantCode || schoolCode
      const isOwner = data.data?.isOwner || false
      const isDemo = data.data?.isDemo || false

      login({
        id: userData?.id || 'user',
        name: userData?.name || 'User',
        email: userData?.email || email,
        role: isOwner ? 'owner' : (userData?.role || 'admin'),
        schoolId: userData?.schoolId || userData?.school?.id || '',
        schoolName: userData?.school?.name || 'EduFlow School',
        isDemo,
        isViewOnly: isDemo,
        isOwner,
        tenantCode,
      })

      setActivated(true)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'demo@greenfieldacademy.edu',
          password: 'demo123',
          schoolCode: 'GIA-001',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        login({
          id: 'demo-user',
          name: 'Demo Viewer',
          email: 'demo@greenfieldacademy.edu',
          role: 'viewer',
          schoolId: 'demo-school',
          schoolName: 'Greenfield International Academy (Demo)',
          isDemo: true,
          isViewOnly: true,
          tenantCode: 'GIA-001',
        })
        setActivated(true)
        return
      }

      const userData = data.data?.user
      login({
        id: userData?.id || 'demo-user',
        name: userData?.name || 'Demo Viewer',
        email: userData?.email || 'demo@greenfieldacademy.edu',
        role: userData?.role || 'viewer',
        schoolId: userData?.schoolId || '',
        schoolName: userData?.school?.name || 'Greenfield International Academy',
        isDemo: true,
        isViewOnly: true,
        tenantCode: data.data?.tenantCode || 'GIA-001',
      })
      setActivated(true)
    } catch {
      login({
        id: 'demo-user',
        name: 'Demo Viewer',
        email: 'demo@greenfieldacademy.edu',
        role: 'viewer',
        schoolId: 'demo-school',
        schoolName: 'Greenfield International Academy (Demo)',
        isDemo: true,
        isViewOnly: true,
        tenantCode: 'GIA-001',
      })
      setActivated(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOwnerLogin = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@eduflow.io',
          password: 'owner123',
          schoolCode: 'OWNER',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Owner login failed.')
        return
      }

      const userData = data.data?.user
      login({
        id: userData?.id || 'owner',
        name: userData?.name || 'EduFlow Owner',
        email: userData?.email || 'owner@eduflow.io',
        role: 'owner',
        schoolId: '',
        schoolName: 'EduFlow OS Platform',
        isOwner: true,
        tenantCode: 'OWNER',
      })
      setActivated(true)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side — Intro */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 relative overflow-hidden flex-col">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-emerald-300/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 h-full">
          {/* Top — Branding */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">EduFlow OS</span>
            </div>
            <p className="text-emerald-200/70 text-sm ml-[52px]">AI-Powered Education Operating System</p>
          </div>

          {/* Center — Headline */}
          <div className="space-y-6">
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight">
              The Operating System<br />
              for <span className="text-emerald-200">Every Institution</span>
            </h1>
            <p className="text-emerald-100/70 text-base max-w-md leading-relaxed">
              From K-12 schools to universities — manage students, academics, operations,
              finance, and AI-powered intelligence in one unified platform.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start gap-2.5 bg-white/8 backdrop-blur-sm rounded-lg p-3 border border-white/8">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/12 shrink-0 mt-0.5">
                    <item.icon className="h-3.5 w-3.5 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">{item.title}</p>
                    <p className="text-emerald-200/60 text-[11px] leading-tight mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom — Stats + Trust */}
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              {[
                { value: '21+', label: 'Modules' },
                { value: '4', label: 'Institution Types' },
                { value: '99.9%', label: 'Uptime' },
                { value: '24/7', label: 'Support' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-lg font-bold text-white">{stat.value}</div>
                  <div className="text-[10px] text-emerald-200/60 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-emerald-200/50 text-xs">
              <Check className="h-3 w-3" />
              <span>SOC 2 Compliant</span>
              <span className="mx-1">·</span>
              <Check className="h-3 w-3" />
              <span>GDPR Ready</span>
              <span className="mx-1">·</span>
              <Check className="h-3 w-3" />
              <span>End-to-End Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950 px-6 py-8">
        <div className="w-full max-w-[380px] space-y-7">
          {/* Mobile Branding */}
          <div className="lg:hidden text-center space-y-2">
            <div className="flex justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-foreground">EduFlow OS</h1>
          </div>

          {/* Welcome */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your institution&apos;s dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="schoolCode">
                School Code
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  id="schoolCode"
                  type="text"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                  placeholder="e.g. GIA-001"
                  className="rounded-lg pl-9 h-10 uppercase text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.edu"
                className="rounded-lg h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="password">
                  Password
                </label>
                <button type="button" className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline">
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="rounded-lg h-10 text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg h-10 text-sm font-semibold shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/30"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-white dark:bg-gray-950 px-3 text-muted-foreground uppercase tracking-wider">Quick Access</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <Button
              variant="outline"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full rounded-lg h-9 text-sm border-dashed"
            >
              <Shield className="h-3.5 w-3.5 mr-2 text-amber-500" />
              Demo Login (View Only)
            </Button>

            <Button
              variant="outline"
              onClick={handleOwnerLogin}
              disabled={isLoading}
              className="w-full rounded-lg h-9 text-sm border-dashed"
            >
              <Building2 className="h-3.5 w-3.5 mr-2 text-purple-500" />
              Platform Owner
            </Button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/60 leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            <br />
            Demo mode provides read-only access · Owner login manages the platform.
          </p>
        </div>
      </div>
    </div>
  )
}
