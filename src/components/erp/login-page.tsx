'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { School, Shield, Key, Monitor, CheckCircle2, AlertCircle, Loader2, GraduationCap, ArrowRight, ArrowLeft, Check, Brain, BarChart3, Users, BookOpen, Sparkles } from 'lucide-react'
import type { AuthUser } from '@/store/erp-store'

interface LoginPageProps {
  onLogin: (user: AuthUser) => void
  isSeeding?: boolean
}

type Step = 'activation' | 'login'

// Device info helper
function getDeviceInfo() {
  if (typeof window === 'undefined') return { browser: 'Unknown', os: 'Unknown' }
  const ua = navigator.userAgent
  let browser = 'Unknown'
  let os = 'Unknown'

  if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Safari')) browser = 'Safari'

  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS'

  return { browser, os }
}

// Generate a stable device fingerprint
function generateDeviceFingerprint() {
  if (typeof window === 'undefined') return ''
  const { browser, os } = getDeviceInfo()
  const screen = `${window.screen.width}x${window.screen.height}`
  const lang = navigator.language
  const raw = `${browser}|${os}|${screen}|${lang}`
  // Simple hash
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `fp-${Math.abs(hash).toString(36)}-${browser.toLowerCase().replace(/\s/g, '')}-${os.toLowerCase().replace(/\s/g, '')}`
}

// Format serial key - preserve natural dash positions
function formatSerialKey(value: string, isPaste: boolean = false): string {
  if (isPaste) return value.toUpperCase().trim()
  // Allow alphanumeric and dashes, uppercase, trim to reasonable length
  return value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().slice(0, 30)
}

// localStorage helpers for device activation persistence
const DEVICE_STORAGE_KEY = 'eduflow_device_activation'

interface StoredActivation {
  fingerprint: string
  schoolCode: string
  serialKey: string
  tenantName: string
  activatedAt: string
}

function getStoredActivation(): StoredActivation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DEVICE_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredActivation
  } catch {
    return null
  }
}

function saveStoredActivation(data: StoredActivation) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(data))
  } catch { /* Ignore */ }
}

function clearStoredActivation() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(DEVICE_STORAGE_KEY)
  } catch { /* Ignore */ }
}

const highlights = [
  { icon: GraduationCap, title: 'Student Intelligence', desc: 'Full lifecycle from admission to alumni' },
  { icon: Users, title: 'Teacher Management', desc: 'Profiles, performance & payroll' },
  { icon: BarChart3, title: 'Control Tower', desc: 'Real-time KPIs & smart alerts' },
  { icon: BookOpen, title: '21+ Modules', desc: 'Attendance, exams, fees, LMS & more' },
  { icon: Brain, title: 'AI-Powered', desc: 'Risk detection & auto-insights' },
  { icon: Sparkles, title: 'Multi-Tenant', desc: 'Isolated DB per institution' },
]

export default function LoginPage({ onLogin, isSeeding }: LoginPageProps) {
  const [step, setStep] = useState<Step>('activation')
  const [isCheckingDevice, setIsCheckingDevice] = useState(true)

  // Activation step state
  const [serialKey, setSerialKey] = useState('')
  const [activationError, setActivationError] = useState('')
  const [isActivating, setIsActivating] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState({ browser: 'Detecting...', os: 'Detecting...' })
  const [activationData, setActivationData] = useState<{
    tenantName: string
    schoolCode: string
    serialKey: string
  } | null>(null)

  // Login step state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Check if device is already activated on mount
  useEffect(() => {
    const stored = getStoredActivation()
    const fingerprint = generateDeviceFingerprint()

    setDeviceInfo(getDeviceInfo())

    if (stored && stored.fingerprint === fingerprint) {
      setActivationData({
        tenantName: stored.tenantName,
        schoolCode: stored.schoolCode,
        serialKey: stored.serialKey,
      })
      setStep('login')
    }

    setIsCheckingDevice(false)
  }, [])

  // ============================================
  // ACTIVATION HANDLER
  // ============================================
  const handleActivate = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    setIsActivating(true)
    setActivationError('')

    const fingerprint = generateDeviceFingerprint()
    const currentDeviceInfo = getDeviceInfo()

    try {
      const res = await fetch('/api/activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialKey,
          deviceInfo: currentDeviceInfo,
          fingerprint,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setActivationError(data.error || 'Activation failed. Please check your serial key.')
        return
      }

      // Derive school code and tenant name from activation response
      const tenantCode = data.data?.tenant?.code || ''
      const tenantName = data.data?.tenant?.name || 'EduFlow School'
      saveStoredActivation({
        fingerprint,
        schoolCode: tenantCode,
        serialKey,
        tenantName,
        activatedAt: new Date().toISOString(),
      })

      setActivationData({ tenantName, schoolCode: tenantCode, serialKey })
      setStep('login')
    } catch {
      setActivationError('Network error. Please check your connection and try again.')
    } finally {
      setIsActivating(false)
    }
  }, [serialKey])

  // ============================================
  // LOGIN HANDLER
  // ============================================
  const handleLogin = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    setIsLoggingIn(true)
    setLoginError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          schoolCode: activationData?.schoolCode || '',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setLoginError(data.error || 'Login failed. Please check your credentials.')
        return
      }

      const userData = data.data?.user
      const tenantCode = data.data?.tenantCode || activationData?.schoolCode || ''
      const isOwner = data.data?.isOwner || false
      const isDemo = data.data?.isDemo || false

      onLogin({
        id: userData?.id || 'user',
        email: userData?.email || email,
        name: userData?.name || 'User',
        role: isOwner ? 'owner' : (userData?.role || 'admin'),
        avatar: userData?.avatar || null,
        tenantCode,
        schoolId: userData?.school?.id || '',
      })
    } catch {
      setLoginError('Network error. Please check your connection.')
    } finally {
      setIsLoggingIn(false)
    }
  }, [email, password, activationData, onLogin])

  // ============================================
  // DEMO LOGIN HANDLER
  // ============================================
  const handleDemoLogin = useCallback(async () => {
    setIsLoggingIn(true)
    setLoginError('')
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
        // Fallback demo login even if API fails
        onLogin({
          id: 'demo-user',
          email: 'demo@greenfieldacademy.edu',
          name: 'Demo Viewer',
          role: 'viewer',
          avatar: null,
          tenantCode: 'GIA-001',
          schoolId: '',
        })
        return
      }

      const userData = data.data?.user
      const tenantCode = data.data?.tenantCode || 'GIA-001'
      onLogin({
        id: userData?.id || 'demo-user',
        email: userData?.email || 'demo@greenfieldacademy.edu',
        name: userData?.name || 'Demo Viewer',
        role: 'viewer',
        avatar: userData?.avatar || null,
        tenantCode,
        schoolId: userData?.school?.id || '',
      })
    } catch {
      onLogin({
        id: 'demo-user',
        email: 'demo@greenfieldacademy.edu',
        name: 'Demo Viewer',
        role: 'viewer',
        avatar: null,
        tenantCode: 'GIA-001',
        schoolId: '',
      })
    } finally {
      setIsLoggingIn(false)
    }
  }, [onLogin])

  // Go back to activation step
  const handleBackToActivation = () => {
    clearStoredActivation()
    setActivationData(null)
    setStep('activation')
    setEmail('')
    setPassword('')
    setLoginError('')
  }

  // Checking device state
  if (isCheckingDevice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 flex items-center justify-center animate-pulse">
            <School className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
            <p className="text-sm text-muted-foreground">Checking device...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side — Intro */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 relative overflow-hidden flex-col">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-teal-300/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 h-full">
          {/* Top — Branding */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
                <School className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">EduFlow OS</span>
            </div>
            <p className="text-teal-200/70 text-sm ml-[52px]">AI-Powered Education Operating System</p>
          </div>

          {/* Center — Headline */}
          <div className="space-y-6">
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight">
              The Operating System<br />
              for <span className="text-teal-200">Every Institution</span>
            </h1>
            <p className="text-teal-100/70 text-base max-w-md leading-relaxed">
              From K-12 schools to universities — manage students, academics, operations,
              finance, and AI-powered intelligence in one unified platform.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start gap-2.5 bg-white/8 backdrop-blur-sm rounded-lg p-3 border border-white/8">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/12 shrink-0 mt-0.5">
                    <item.icon className="h-3.5 w-3.5 text-teal-200" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">{item.title}</p>
                    <p className="text-teal-200/60 text-[11px] leading-tight mt-0.5">{item.desc}</p>
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
                  <div className="text-[10px] text-teal-200/60 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-teal-200/50 text-xs">
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

      {/* Right Side — Form Area */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile Branding */}
          <div className="lg:hidden text-center space-y-2 mb-8">
            <div className="flex justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/30">
                <School className="h-5 w-5" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-foreground">EduFlow OS</h1>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400">
              <div className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold bg-teal-500 text-white">
                {step === 'login' ? <CheckCircle2 className="h-3 w-3" /> : '1'}
              </div>
              <span>Activate</span>
            </div>
            <div className={cn('flex-1 h-px', step === 'login' ? 'bg-teal-400' : 'bg-border')} />
            <div className={cn('flex items-center gap-1.5 text-xs font-medium', step === 'login' ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground')}>
              <div className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold', step === 'login' ? 'bg-teal-500 text-white' : 'bg-muted text-muted-foreground')}>
                2
              </div>
              <span>Sign In</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'activation' ? (
              /* STEP 1: ACTIVATION */
              <motion.div
                key="activation"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Activate Device</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your serial key to activate this device
                  </p>
                </div>

                <form onSubmit={handleActivate} className="space-y-4">
                  {/* Serial Key */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="serialKey">
                      Serial Key
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input
                        id="serialKey"
                        value={serialKey}
                        onChange={(e) => {
                          setSerialKey(formatSerialKey(e.target.value))
                          if (activationError) setActivationError('')
                        }}
                        onPaste={(e) => {
                          e.preventDefault()
                          const pasted = e.clipboardData.getData('text')
                          setSerialKey(formatSerialKey(pasted, true))
                          if (activationError) setActivationError('')
                        }}
                        placeholder="EF-XXXX-XXXX-XXXX"
                        className="rounded-lg pl-9 h-11 uppercase text-sm font-mono tracking-wider"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Device Info Card */}
                  <div className="bg-muted/50 rounded-lg border border-border/50 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Detected Device</span>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Browser</span>
                        <p className="text-xs font-medium text-foreground">{deviceInfo.browser}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">OS</span>
                        <p className="text-xs font-medium text-foreground">{deviceInfo.os}</p>
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {activationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2"
                    >
                      <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <p className="text-xs text-rose-600 dark:text-rose-400">{activationError}</p>
                    </motion.div>
                  )}

                  {/* Activate Button */}
                  <Button
                    type="submit"
                    disabled={isActivating || serialKey.replace(/-/g, '').length < 10}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg h-11 text-sm font-semibold shadow-md shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isActivating ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Activating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Activate & Continue</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="bg-background px-3 text-muted-foreground uppercase tracking-wider">or explore</span>
                  </div>
                </div>

                {/* Demo Login */}
                <Button
                  variant="outline"
                  onClick={handleDemoLogin}
                  disabled={isLoggingIn}
                  className="w-full rounded-lg h-9 text-sm border-dashed"
                >
                  <Shield className="h-3.5 w-3.5 mr-2 text-amber-500" />
                  Demo Mode (View Only)
                </Button>

                <p className="text-center text-[10px] text-muted-foreground/60 leading-relaxed">
                  New devices require a valid serial key for activation.
                </p>
              </motion.div>
            ) : (
              /* STEP 2: LOGIN */
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sign in to <span className="font-medium text-teal-600 dark:text-teal-400">{activationData?.tenantName || 'EduFlow'}</span>
                  </p>
                </div>

                {/* Activated Device Badge */}
                <div className="flex items-center gap-2.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-teal-700 dark:text-teal-300">Device Activated</p>
                    <p className="text-[10px] text-teal-600/70 dark:text-teal-400/70 truncate">
                      {deviceInfo.browser} on {deviceInfo.os} · Key: {activationData?.serialKey?.slice(0, 16)}...
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToActivation}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="email">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (loginError) setLoginError('')
                      }}
                      placeholder="admin@eduflow.cloud"
                      className="rounded-lg h-10 text-sm"
                      autoFocus
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground" htmlFor="password">
                        Password
                      </label>
                      <button type="button" className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (loginError) setLoginError('')
                      }}
                      placeholder="Enter your password"
                      className="rounded-lg h-10 text-sm"
                    />
                  </div>

                  {/* Error */}
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2"
                    >
                      <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <p className="text-xs text-rose-600 dark:text-rose-400">{loginError}</p>
                    </motion.div>
                  )}

                  {/* Sign In Button */}
                  <Button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg h-10 text-sm font-semibold shadow-md shadow-teal-500/20"
                  >
                    {isLoggingIn ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="bg-background px-3 text-muted-foreground uppercase tracking-wider">Quick Access</span>
                  </div>
                </div>

                {/* Demo + Back */}
                <div className="space-y-2.5">
                  <Button
                    variant="outline"
                    onClick={handleDemoLogin}
                    disabled={isLoggingIn}
                    className="w-full rounded-lg h-9 text-sm border-dashed"
                  >
                    <Shield className="h-3.5 w-3.5 mr-2 text-amber-500" />
                    Demo Login (View Only)
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleBackToActivation}
                    className="w-full rounded-lg h-9 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                    Use Different Serial Key
                  </Button>
                </div>

                <p className="text-center text-[10px] text-muted-foreground/60 leading-relaxed">
                  By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
