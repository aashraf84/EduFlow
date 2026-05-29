'use client'

import { useAppStore } from '@/lib/store'
import { LoginPage } from '@/components/landing/login-page'
import { AppShell } from '@/components/shared/app-shell'

export default function Home() {
  const { view, isAuthenticated } = useAppStore()

  return (
    <main className="min-h-screen">
      {!isAuthenticated && <LoginPage />}
      {isAuthenticated && <AppShell />}
    </main>
  )
}
