"use client"

import type { User } from "firebase/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Stethoscope } from "lucide-react"
import type { PageType } from "./dashboard"

interface HeaderProps {
  user: User
  currentPage: PageType
  onPageChange: (page: PageType) => void
}

export default function Header({ user, currentPage, onPageChange }: HeaderProps) {
  const getPageTitle = () => {
    switch (currentPage) {
      case "patients":
        return "Patients"
      case "analytics":
        return "Analytics"
      case "profile":
        return "Profile"
      case "patient-details":
        return "Patient Details"
      case "add-patient":
        return "Add Patient"
      case "edit-patient":
        return "Edit Patient"
      default:
        return "RushitaCare"
    }
  }

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {getPageTitle()}
              </h1>
              <p className="text-sm text-slate-500">RushitaCare</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onPageChange("profile")}
              className="hidden sm:flex items-center space-x-3 px-3 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Avatar className="h-8 w-8 ring-2 ring-blue-200">
                <AvatarImage src={user.photoURL || "/placeholder.svg"} alt={user.displayName || "User"} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold">
                  {(user.displayName || user.email)?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <div className="font-medium text-slate-700">Dr. {user.displayName || user.email?.split("@")[0]}</div>
                <div className="text-slate-500">Physiotherapist</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
