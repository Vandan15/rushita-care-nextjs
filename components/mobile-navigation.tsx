"use client"

import { Button } from "@/components/ui/button"
import { Users, BarChart3, User, Plus } from "lucide-react"
import type { PageType } from "./dashboard"

interface MobileNavigationProps {
  currentPage: PageType
  onPageChange: (page: PageType) => void
  onAddPatient: () => void
}

export default function MobileNavigation({ currentPage, onPageChange, onAddPatient }: MobileNavigationProps) {
  console.log(currentPage)
  const navItems = [
    { id: "patients" as PageType, icon: Users, label: "Patients" },
    { id: "analytics" as PageType, icon: BarChart3, label: "Analytics" },
    { id: "profile" as PageType, icon: User, label: "Profile" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 sm:hidden z-50 safe-area-pb shadow-lg">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 min-w-0 flex-1 ${
                isActive ? "text-blue-600 bg-blue-50 hover:text-blue-600 hover:bg-blue-50" : "text-slate-600 hover:text-blue-600 hover:bg-blue-50 focus:text-blue-600 focus:bg-blue-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          )
        })}

        <Button
          onClick={onAddPatient}
          size="sm"
          className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 min-w-0 flex-1 ${
            currentPage === "add-patient" ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
          }`}
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-medium">Add</span>
        </Button>
      </div>
    </div>
  )
}
