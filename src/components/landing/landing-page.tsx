'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, ArrowRight, Sparkles, BarChart3, Users, Brain } from 'lucide-react'

export function LandingPage() {
  const { setView, login } = useAppStore()

  const handleGetStarted = () => {
    // Auto-login as demo admin for now
    login({
      id: 'demo-admin',
      name: 'Admin User',
      email: 'admin@eduflow.io',
      role: 'admin',
      schoolId: '',
      schoolName: 'Demo School',
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 dark:from-gray-950 dark:via-emerald-950/20 dark:to-teal-950/10">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="font-bold text-lg text-foreground">EduFlow OS</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('login')}>
            Sign In
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            onClick={handleGetStarted}
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-3xl text-center space-y-6">
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs px-3 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered Education Platform
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            The Operating System for{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Modern Schools
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Replace spreadsheets, manual administration, and fragmented tools with one
            intelligent platform that adapts to your school&apos;s needs.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl px-8 h-12 text-base"
              onClick={handleGetStarted}
            >
              Launch Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12">
            {[
              {
                icon: Brain,
                title: 'AI Insights',
                desc: 'Predictive analytics for student performance and risk detection',
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-950/30',
              },
              {
                icon: BarChart3,
                title: 'Real-time Dashboard',
                desc: 'Live attendance, fee tracking, and performance monitoring',
                color: 'text-teal-600 dark:text-teal-400',
                bg: 'bg-teal-50 dark:bg-teal-950/30',
              },
              {
                icon: Users,
                title: 'All-in-One Platform',
                desc: 'Students, teachers, exams, fees, and communication unified',
                color: 'text-sky-600 dark:text-sky-400',
                bg: 'bg-sky-50 dark:bg-sky-950/30',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`${feature.bg} rounded-xl p-5 text-left border border-border/30`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color} mb-3`} />
                <h3 className="font-semibold text-sm text-foreground">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-muted-foreground border-t border-border/30">
        EduFlow OS &copy; 2026 &mdash; AI-Powered Education Operating System
      </footer>
    </div>
  )
}
