'use client'

import { useAppStore } from '@/lib/store'
import { LandingPage } from '@/components/landing/landing-page'
import { LoginPage } from '@/components/landing/login-page'
import { AppShell } from '@/components/shared/app-shell'

export default function Home() {
  const { view } = useAppStore()

  return (
    <main className="min-h-screen">
      {view === 'landing' && <LandingPage />}
      {view === 'login' && <LoginPage />}
      {view === 'app' && <AppShell />}
    </main>
  )
}
