'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  GraduationCap, Shield, Loader2, Key, Monitor, CheckCircle2,
  Brain, BarChart3, Users, BookOpen, Sparkles, Check, ArrowRight, ArrowLeft,
  Crown
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const highlights = [
  { icon: GraduationCap, title: 'Student Intelligence', desc: 'Full lifecycle from admission to alumni' },
  { icon: Users, title: 'Teacher Management', desc: 'Profiles, performance & payroll' },
  { icon: BarChart3, title: 'Control Tower', desc: 'Real-time KPIs & smart alerts' },
  { icon: BookOpen, title: '21+ Modules', desc: 'Attendance, exams, fees, LMS & more' },
  { icon: Brain, title: 'AI-Powered', desc: 'Risk detection & auto-insights' },
  { icon: Sparkles, title: 'Multi-Tenant', desc: 'Isolated DB per institution' },
]

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

// Format serial key with dashes
function formatSerialKey(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 25)
  const parts = []
  for (let i = 0; i < cleaned.length; i += 5) {
    parts.push(cleaned.slice(i, i + 5))
  }
  return parts.join('-')
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
  } catch {
    // Ignore storage errors
  }
}

function clearStoredActivation() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(DEVICE_STORAGE_KEY)
  } catch {
    // Ignore
  }
}

export function LoginPage() {
  const { login, setActivated } = useAppStore()

  // Step management: 'activation' | 'login'
  const [step, setStep] = useState<'activation' | 'login'>('activation')
  const [isCheckingDevice, setIsCheckingDevice] = useState(true)

  // Activation step state
  const [serialKey, setSerialKey] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
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
      // Device is already activated — skip to login
      setSchoolCode(stored.schoolCode)
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
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
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
      setSchoolCode(tenantCode)
      setStep('login')
    } catch {
      setActivationError('Network error. Please check your connection and try again.')
    } finally {
      setIsActivating(false)
    }
  }

  // ============================================
  // LOGIN HANDLER
  // ============================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          schoolCode: activationData?.schoolCode || schoolCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setLoginError(data.error || 'Login failed. Please check your credentials.')
        return
      }

      const userData = data.data?.user
      const tenantCode = data.data?.tenantCode || activationData?.schoolCode || schoolCode
      const isOwner = data.data?.isOwner || false
      const isDemo = data.data?.isDemo || false

      login({
        id: userData?.id || 'user',
        name: userData?.name || 'User',
        email: userData?.email || email,
        role: isOwner ? 'owner' : (userData?.role || 'admin'),
        schoolId: userData?.schoolId || userData?.school?.id || '',
        schoolName: userData?.school?.name || activationData?.tenantName || 'EduFlow School',
        isDemo,
        isViewOnly: isDemo,
        isOwner,
        tenantCode,
      })

      setActivated(true)
    } catch {
      setLoginError('Network error. Please check your connection.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  // ============================================
  // DEMO LOGIN HANDLER
  // ============================================
  const handleDemoLogin = async () => {
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
      setIsLoggingIn(false)
    }
  }

  // ============================================
  // OWNER LOGIN HANDLER
  // ============================================
  const handleOwnerLogin = async () => {
    setIsLoggingIn(true)
    setActivationError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@apexflow.ai',
          password: 'Admin@180H',
          schoolCode: 'OWNER',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setActivationError(data.error || 'Owner login failed.')
        return
      }

      login({
        id: data.data?.user?.id || 'owner',
        name: data.data?.user?.name || 'EduFlow Owner',
        email: data.data?.user?.email || 'admin@apexflow.ai',
        role: 'owner',
        schoolId: '',
        schoolName: 'EduFlow OS Platform',
        isOwner: true,
        tenantCode: 'OWNER',
      })
      setActivated(true)
    } catch {
      setActivationError('Network error. Please check your connection.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Go back to activation step
  const handleBackToActivation = () => {
    clearStoredActivation()
    setActivationData(null)
    setStep('activation')
    setEmail('')
    setPassword('')
    setLoginError('')
  }

  // ============================================
  // RENDER
  // ============================================
  if (isCheckingDevice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Checking device...</span>
        </div>
      </div>
    )
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

      {/* Right Side — Form Area */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950 px-6 py-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile Branding */}
          <div className="lg:hidden text-center space-y-2 mb-8">
            <div className="flex justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-foreground">EduFlow OS</h1>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'activation' ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === 'activation' ? 'bg-emerald-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {step === 'login' ? <CheckCircle2 className="h-3 w-3" /> : '1'}
              </div>
              <span>Activate</span>
            </div>
            <div className={`flex-1 h-px ${step === 'login' ? 'bg-emerald-400' : 'bg-border'}`} />
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'login' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
              <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === 'login' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
              <span>Sign In</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'activation' ? (
              /* ============================================
                 STEP 1: ACTIVATION
                 ============================================ */
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
                        placeholder="EDUF-XXXXX-XXXXX-XXXXX-XXXXX"
                        className="rounded-lg pl-9 h-11 uppercase text-sm font-mono tracking-wider"
                        maxLength={29}
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
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-600 dark:text-red-400">{activationError}</p>
                    </div>
                  )}

                  {/* Activate Button */}
                  <Button
                    type="submit"
                    disabled={isActivating || serialKey.replace(/-/g, '').length < 20}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg h-11 text-sm font-semibold shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                    <span className="bg-white dark:bg-gray-950 px-3 text-muted-foreground uppercase tracking-wider">or explore</span>
                  </div>
                </div>

                {/* Owner Login */}
                <Button
                  variant="outline"
                  onClick={handleOwnerLogin}
                  disabled={isLoggingIn}
                  className="w-full rounded-lg h-9 text-sm border-dashed"
                >
                  <Crown className="h-3.5 w-3.5 mr-2 text-purple-500" />
                  {isLoggingIn ? 'Signing in...' : 'Owner Login'}
                </Button>

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
                  <br />
                  Owner login provides full platform management access.
                </p>
              </motion.div>
            ) : (
              /* ============================================
                 STEP 2: LOGIN
                 ============================================ */
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
                    Sign in to <span className="font-medium text-emerald-600 dark:text-emerald-400">{activationData?.tenantName || schoolCode}</span>
                  </p>
                </div>

                {/* Activated Device Badge */}
                <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Device Activated</p>
                    <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 truncate">
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
                      placeholder="admin@school.edu"
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
                      <button type="button" className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline">
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
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-600 dark:text-red-400">{loginError}</p>
                    </div>
                  )}

                  {/* Sign In Button */}
                  <Button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg h-10 text-sm font-semibold shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/30"
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
                    <span className="bg-white dark:bg-gray-950 px-3 text-muted-foreground uppercase tracking-wider">Quick Access</span>
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
