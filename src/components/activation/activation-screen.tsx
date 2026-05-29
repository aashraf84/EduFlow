'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Shield, GraduationCap, Monitor, Loader2, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

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

function formatSerialKey(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 25)
  const parts = []
  for (let i = 0; i < cleaned.length; i += 5) {
    parts.push(cleaned.slice(i, i + 5))
  }
  return parts.join('-')
}

export function ActivationScreen() {
  const { login, setActivated } = useAppStore()
  const [serialKey, setSerialKey] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [deviceInfo, setDeviceInfo] = useState({ browser: 'Detecting...', os: 'Detecting...' })

  useEffect(() => {
    setDeviceInfo(getDeviceInfo())
  }, [])

  const handleSerialKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSerialKey(e.target.value)
    setSerialKey(formatted)
    if (error) setError('')
  }

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialKey,
          schoolCode: schoolCode || undefined,
          deviceInfo,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Activation failed. Please check your serial key.')
        return
      }

      login({
        id: data.user?.id || 'activated-user',
        name: data.user?.name || 'Admin User',
        email: data.user?.email || 'admin@eduflow.io',
        role: data.user?.role || 'admin',
        schoolId: data.user?.schoolId || '',
        schoolName: data.user?.schoolName || 'EduFlow School',
      })
      setActivated(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoMode = () => {
    login({
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@eduflow.io',
      role: 'viewer',
      schoolId: 'demo-school',
      schoolName: 'Demo School',
      isDemo: true,
      isViewOnly: true,
    })
    setActivated(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-slate-700/50 bg-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/30">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="flex justify-center">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 border-2 border-emerald-500/50">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Activate Your EduFlow OS
              </CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                Enter your serial key to activate this device
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            <form onSubmit={handleActivate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serialKey" className="text-slate-300 text-sm font-medium">
                  Serial Key
                </Label>
                <Input
                  id="serialKey"
                  value={serialKey}
                  onChange={handleSerialKeyChange}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                  className="bg-slate-900/50 border-slate-600/50 text-white placeholder:text-slate-500 font-mono text-center tracking-widest uppercase rounded-lg h-12 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  maxLength={29}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolCode" className="text-slate-300 text-sm font-medium">
                  School Code <span className="text-slate-500">(optional)</span>
                </Label>
                <Input
                  id="schoolCode"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                  placeholder="Enter school code to link"
                  className="bg-slate-900/50 border-slate-600/50 text-white placeholder:text-slate-500 uppercase tracking-wider rounded-lg h-11 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  autoComplete="off"
                />
              </div>

              {/* Device Info */}
              <div className="bg-slate-900/40 rounded-lg border border-slate-700/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Detected Device</span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Browser</span>
                    <p className="text-sm text-slate-300 font-medium">{deviceInfo.browser}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">OS</span>
                    <p className="text-sm text-slate-300 font-medium">{deviceInfo.os}</p>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2"
                >
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading || serialKey.replace(/-/g, '').length < 20}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg h-11 font-semibold shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Activating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Activate Device</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-800 px-3 text-slate-500">or</span>
              </div>
            </div>

            <div className="text-center space-y-3">
              <Button
                variant="ghost"
                onClick={handleDemoMode}
                className="w-full border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg h-10"
              >
                <Eye className="h-4 w-4 mr-2 text-amber-400" />
                Enter Demo Mode
              </Button>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Demo mode provides read-only access to explore the system
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-6">
          EduFlow OS v2.0 — Licensed Education Platform
        </p>
      </motion.div>
    </div>
  )
}
