"use client"

import { useEffect, useState } from "react"
import { authService } from "@/lib/auth-service"
import type { User } from "firebase/auth"
import LoginForm from "@/components/login-form"
import Dashboard from "@/components/dashboard"
import SplashScreen from "@/components/splash-screen"
import { Loader2 } from 'lucide-react'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading PhysioManager...</p>
        </div>
      </div>
    )
  }

  return user ? <Dashboard user={user} /> : <LoginForm />
}
