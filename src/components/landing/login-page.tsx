'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GraduationCap } from 'lucide-react'
import { useState } from 'react'

export function LoginPage() {
  const { setView, login } = useAppStore()
  const [email, setEmail] = useState('admin@eduflow.io')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login({
      id: 'demo-admin',
      name: 'Admin User',
      email: email || 'admin@eduflow.io',
      role: 'admin',
      schoolId: '',
      schoolName: 'Demo School',
    })
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
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@eduflow.io"
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
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg h-10"
          >
            Sign In
          </Button>
        </form>

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
