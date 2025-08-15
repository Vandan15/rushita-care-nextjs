"use client"

import { useEffect, useState } from "react"
import { Stethoscope, Heart, Activity } from "lucide-react"

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 300) // Small delay before transitioning
          return 100
        }
        return prev + 2
      })
    }, 30)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-cyan-500/90 to-teal-500/90"></div>

      <div className="relative z-10 text-center text-white">
        {/* Logo Animation */}
        <div className="mb-8 relative">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-2xl animate-pulse">
            <Stethoscope className="h-12 w-12 text-white" />
          </div>

          {/* Floating Icons */}
          <div className="absolute -top-4 -right-4 animate-bounce delay-100">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
          </div>

          <div className="absolute -bottom-4 -left-4 animate-bounce delay-300">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Activity className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-bold mb-2 animate-fade-in">RushitaCare</h1>

        <p className="text-xl text-white/90 mb-8 animate-fade-in delay-200">Professional Patient Care</p>

        {/* Progress Bar */}
        <div className="w-64 mx-auto">
          <div className="w-full bg-white/20 rounded-full h-2 mb-4">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-white/80">Loading your dashboard...</p>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-white rounded-full animate-spin-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 border border-white rounded-full animate-spin-slow delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-16 h-16 border border-white rounded-full animate-spin-slow delay-500"></div>
      </div>
    </div>
  )
}
