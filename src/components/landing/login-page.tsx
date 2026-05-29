'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GraduationCap, Shield, Loader2, Building2, Key } from 'lucide-react'
import { useState } from 'react'

export function LoginPage() {
  const { setView, login, setActivated } = useAppStore()
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
        // Fallback to local demo if API fails
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
      // Fallback
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 dark:from-gray-950 dark:via-emerald-950/20 dark:to-teal-950/10 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your EduFlow OS account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="schoolCode">
              <div className="flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                School Code
              </div>
            </label>
            <Input
              id="schoolCode"
              type="text"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
              placeholder="e.g. GIA-001"
              className="rounded-lg uppercase"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@school.edu"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="rounded-lg"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg h-10"
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
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-3 text-muted-foreground">or</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full rounded-lg h-10 border-dashed"
          >
            <Shield className="h-4 w-4 mr-2 text-amber-500" />
            Demo Login (View Only)
          </Button>

          <Button
            variant="outline"
            onClick={handleOwnerLogin}
            disabled={isLoading}
            className="w-full rounded-lg h-10 border-dashed"
          >
            <Building2 className="h-4 w-4 mr-2 text-purple-500" />
            Owner Login
          </Button>

          <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
            Demo mode provides read-only access · Owner login manages the platform
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <button
            onClick={() => setView('landing')}
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Back to home
          </button>
        </p>
      </div>
    </div>
  )
}
