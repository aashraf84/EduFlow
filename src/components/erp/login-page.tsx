'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { School, Shield, Key, Monitor, CheckCircle2, AlertCircle, Loader2, Fingerprint } from 'lucide-react'
import type { AuthUser } from '@/store/erp-store'

interface LoginPageProps {
  onLogin: (user: AuthUser) => void
  isSeeding?: boolean
}

type Step = 'activation' | 'login'

export default function LoginPage({ onLogin, isSeeding }: LoginPageProps) {
  const [step, setStep] = useState<Step>('activation')
  const [serialKey, setSerialKey] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [isActivated, setIsActivated] = useState(false)
  const [isCheckingDevice, setIsCheckingDevice] = useState(true)

  // Check if device is already activated
  useEffect(() => {
    const checkActivation = () => {
      try {
        const activated = localStorage.getItem('eduflow_activated')
        const storedDeviceId = localStorage.getItem('eduflow_device_id')
        const storedSerialKey = localStorage.getItem('eduflow_serial_key')

        if (activated === 'true' && storedDeviceId && storedSerialKey) {
          setIsActivated(true)
          setDeviceId(storedDeviceId)
          setSerialKey(storedSerialKey)
          setStep('login')
        }
      } catch {
        // localStorage not available
      }
      setIsCheckingDevice(false)
    }

    // Small delay for smooth UX
    const timer = setTimeout(checkActivation, 300)
    return () => clearTimeout(timer)
  }, [])

  const generateDeviceId = useCallback(() => {
    const nav = navigator as Record<string, unknown>
    const platform = (nav.userAgent as string || '').replace(/[^a-zA-Z]/g, '').slice(0, 10).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `EDU-${platform}-${random}`
  }, [])

  const handleActivation = useCallback(async () => {
    if (!serialKey.trim()) {
      setError('Please enter a serial key')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialKey: serialKey.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Activation failed')
        return
      }

      const newDeviceId = generateDeviceId()
      setDeviceId(newDeviceId)

      // Store activation state in localStorage
      localStorage.setItem('eduflow_activated', 'true')
      localStorage.setItem('eduflow_device_id', newDeviceId)
      localStorage.setItem('eduflow_serial_key', serialKey.trim())

      setIsActivated(true)
      setStep('login')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [serialKey, generateDeviceId])

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      onLogin(data.user)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [email, password, onLogin])

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
            <p className="text-sm text-muted-foreground">Checking activation status...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 flex items-center justify-center mb-4">
            <School className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">EduFlow</h1>
          <p className="text-sm text-muted-foreground mt-1">Intelligent Education OS</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'activation' ? (
            <motion.div
              key="activation"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-xl shadow-black/5 bg-background/80 backdrop-blur-xl">
                <CardHeader className="text-center pb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/20 flex items-center justify-center mx-auto mb-3">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Activate Your ERP</h2>
                  <CardDescription>Enter your serial key to activate EduFlow on this device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isActivated && deviceId && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">Device already activated: {deviceId}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Serial Key</label>
                    <div className="relative">
                      <Input
                        placeholder="EF-XXXX-XXXX-XXXX"
                        value={serialKey}
                        onChange={(e) => { setSerialKey(e.target.value.toUpperCase()); setError('') }}
                        className="h-11 text-center font-mono tracking-wider uppercase"
                        onKeyDown={(e) => e.key === 'Enter' && handleActivation()}
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-400/10 border border-rose-200 dark:border-rose-400/20"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                      <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>
                    </motion.div>
                  )}

                  <Button
                    className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md shadow-teal-500/20"
                    onClick={handleActivation}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Fingerprint className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Activating...' : 'Activate Device'}
                  </Button>

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                    <Monitor className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Device ID: {deviceId || 'Will be generated on activation'}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-xl shadow-black/5 bg-background/80 backdrop-blur-xl">
                <CardHeader className="text-center pb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-md shadow-teal-500/20 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Sign In</h2>
                  <CardDescription>Enter your credentials to access EduFlow</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      placeholder="admin@eduflow.cloud"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      className="h-11"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                      className="h-11"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-400/10 border border-rose-200 dark:border-rose-400/20"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                      <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>
                    </motion.div>
                  )}

                  <Button
                    className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md shadow-teal-500/20"
                    onClick={handleLogin}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Device activated
                    </div>
                    <button
                      onClick={() => setStep('activation')}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      Change device
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px] px-1.5 border-0 bg-foreground/5">v2.1</Badge>
            <span>Protected by EduFlow Security</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
