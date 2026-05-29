'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  GraduationCap, ArrowRight, Sparkles, BarChart3, Users, Brain, 
  BookOpen, Bus, Building2, Briefcase, Award, Heart, FlaskConical,
  Library, MonitorPlay, Package, ClipboardList, Stethoscope, Check, Star
} from 'lucide-react'

export function LandingPage() {
  const { setView, login } = useAppStore()

  const handleGetStarted = () => {
    login({
      id: 'demo-admin',
      name: 'Admin User',
      email: 'admin@eduflow.io',
      role: 'admin',
      schoolId: '',
      schoolName: 'Demo School',
    })
  }

  const allModules = [
    { icon: GraduationCap, title: 'Student Intelligence', desc: 'Complete student lifecycle from admission to alumni tracking', category: 'Core' },
    { icon: Users, title: 'Teacher Management', desc: 'Profiles, assignments, performance tracking & payroll', category: 'Core' },
    { icon: BarChart3, title: 'Control Tower', desc: 'Real-time dashboard with school-wide KPIs & alerts', category: 'Core' },
    { icon: BookOpen, title: 'Attendance & Discipline', desc: 'Daily tracking, late/absent alerts, behavior logs', category: 'Core' },
    { icon: ClipboardList, title: 'Exams & Grading', desc: 'Exam creation, marks entry, grade calculation, report cards', category: 'Core' },
    { icon: Award, title: 'Fees & Finance', desc: 'Billing, payment tracking, automated reminders', category: 'Core' },
    { icon: MonitorPlay, title: 'LMS / eLearning', desc: 'Online courses, materials, student progress tracking', category: 'Academic' },
    { icon: ClipboardList, title: 'Admission Portal', desc: 'Online applications, merit lists, document verification', category: 'Academic' },
    { icon: Library, title: 'Library Management', desc: 'Book cataloging, issue/return, fines, digital resources', category: 'Academic' },
    { icon: FlaskConical, title: 'Lab Management', desc: 'Lab scheduling, equipment tracking, safety protocols', category: 'Academic' },
    { icon: Award, title: 'Scholarships', desc: 'Scholarship programs, eligibility, applications', category: 'Academic' },
    { icon: Briefcase, title: 'Placement & Career', desc: 'Job placements, internships, career counseling', category: 'Academic' },
    { icon: Bus, title: 'Transport', desc: 'Bus routes, vehicle tracking, driver management', category: 'Operations' },
    { icon: Building2, title: 'Hostel & Residence', desc: 'Room allocation, mess management, complaints', category: 'Operations' },
    { icon: Stethoscope, title: 'Health Records', desc: 'Student health data, medical emergencies, checkups', category: 'Operations' },
    { icon: Briefcase, title: 'HR & Payroll', desc: 'Staff management, salary processing, leave management', category: 'Operations' },
    { icon: Package, title: 'Inventory & Assets', desc: 'Asset tracking, procurement, maintenance scheduling', category: 'Operations' },
    { icon: GraduationCap, title: 'Alumni Network', desc: 'Alumni directory, events, donations, mentorship', category: 'Operations' },
    { icon: Brain, title: 'AI Intelligence', desc: 'Risk detection, performance insights, auto-reports', category: 'AI' },
  ]

  const institutionTypes = [
    { type: 'Schools', desc: 'K-12 schools with complete academic & admin management', icon: '🏫' },
    { type: 'Colleges', desc: 'Higher education with departments, courses & placements', icon: '🎓' },
    { type: 'Universities', desc: 'Multi-campus universities with research & accreditation', icon: '🏛️' },
    { type: 'Academies', desc: 'Training academies with certification & skill tracking', icon: '📚' },
  ]

  const stats = [
    { value: '21+', label: 'Integrated Modules' },
    { value: '4', label: 'Institution Types' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' },
  ]

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$49',
      period: '/month',
      desc: 'For small schools & academies',
      features: ['Up to 200 students', 'Core modules', 'Email support', 'Basic analytics'],
      popular: false,
    },
    {
      name: 'Growth',
      price: '$99',
      period: '/month',
      desc: 'For growing schools & colleges',
      features: ['Up to 1,000 students', 'All 21+ modules', 'AI Intelligence', 'Priority support', 'Custom branding'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      desc: 'For universities & multi-campus',
      features: ['Unlimited students', 'Multi-campus support', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'On-premise option'],
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 dark:from-gray-950 dark:via-emerald-950/20 dark:to-teal-950/10">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="font-bold text-lg text-foreground">EduFlow OS</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => setView('login')}>
            Sign In
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            onClick={handleGetStarted}
          >
            Get Started Free
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="px-6 py-16 md:py-24 max-w-5xl mx-auto text-center">
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs px-3 py-1 mb-6">
            <Sparkles className="h-3 w-3 mr-1" />
            Complete Education Operating System
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            The Operating System for{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Every Institution
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            From K-12 schools to universities — manage students, academics, operations, 
            finance, and AI-powered intelligence in one unified platform.
          </p>
          <div className="flex items-center justify-center gap-4 mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl px-8 h-12 text-base"
              onClick={handleGetStarted}
            >
              Launch Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="rounded-xl h-12 px-8" onClick={() => setView('login')}>
              Sign In
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Institution Types */}
        <section className="px-6 py-12 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Built for Every Education Institution</h2>
            <p className="text-muted-foreground mb-8">One platform that adapts to your institution type</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {institutionTypes.map((inst) => (
                <div key={inst.type} className="bg-background rounded-xl p-5 border border-border/50 text-center hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-2">{inst.icon}</div>
                  <h3 className="font-semibold text-foreground">{inst.type}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{inst.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All Modules Grid */}
        <section className="px-6 py-16 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">21+ Integrated Modules</h2>
            <p className="text-muted-foreground">Everything your institution needs, connected and intelligent</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allModules.map((mod) => (
              <div key={mod.title} className="rounded-xl border border-border/50 bg-card p-4 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 shrink-0">
                    <mod.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground">{mod.title}</h3>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{mod.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{mod.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground mb-10">Start free, scale as you grow</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {pricingPlans.map((plan) => (
                <Card key={plan.name} className={`relative ${plan.popular ? 'border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-emerald-950/50' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-500 text-white border-0 px-3">
                        <Star className="h-3 w-3 mr-1" /> Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className={`w-full ${plan.popular ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : ''}`} onClick={handleGetStarted}>
                      {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Ready to Transform Your Institution?</h2>
            <p className="text-muted-foreground mb-8">Join thousands of schools, colleges, and universities using EduFlow OS</p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl px-8 h-12 text-base"
              onClick={handleGetStarted}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border/30 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <GraduationCap className="h-3 w-3" />
              </div>
              <span className="font-semibold text-sm">EduFlow OS</span>
            </div>
            <div className="flex gap-6 text-xs text-muted-foreground">
              <span>Features</span>
              <span>Pricing</span>
              <span>Documentation</span>
              <span>Support</span>
              <span>Privacy</span>
            </div>
            <div className="text-xs text-muted-foreground">
              &copy; 2026 EduFlow OS &mdash; AI-Powered Education Operating System
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
