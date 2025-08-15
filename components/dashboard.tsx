"use client"

import { useState, useEffect } from "react"
import type { User } from "firebase/auth"
import { subscribeToPatients } from "@/lib/firebase-operations"
import Header from "@/components/header"
import PatientList from "@/components/patient-list"
import AddPatientPage from "@/components/add-patient-page"
import PatientDetailsPage from "@/components/patient-details-page"
import AttendanceAnalytics from "@/components/attendance-analytics"
import ProfilePage from "@/components/profile-page"
import MobileNavigation from "@/components/mobile-navigation"
import type { Patient } from "@/types/patient"
import { AnimatePresence, motion } from "framer-motion"

interface DashboardProps {
  user: User
}

export type PageType = "patients" | "analytics" | "profile" | "patient-details" | "add-patient" | "edit-patient"

export default function Dashboard({ user }: DashboardProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<PageType>("patients")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToPatients((patientsData) => {
      setPatients(patientsData)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleViewPatientDetails = (patient: Patient) => {
    setSelectedPatient(patient)
    setCurrentPage("patient-details")
  }

  const handleViewAnalytics = () => {
    setCurrentPage("analytics")
  }

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setCurrentPage("edit-patient")
  }

  const handleBackToPatients = () => {
    setCurrentPage("patients")
    setSelectedPatient(null)
  }

  const handleAddPatient = () => {
    setCurrentPage("add-patient")
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "patients":
        return (
          <PatientList
            patients={patients}
            loading={loading}
            onEdit={handleEditPatient}
            onViewDetails={handleViewPatientDetails}
            onAddPatient={handleAddPatient}
            onViewAnalytics={handleViewAnalytics}
          />
        )
      case "analytics":
        return <AttendanceAnalytics patients={patients} />
      case "profile":
        return <ProfilePage user={user} />
      case "patient-details":
        return selectedPatient ? (
          <PatientDetailsPage patient={selectedPatient} onBack={handleBackToPatients} onEdit={handleEditPatient} />
        ) : null
      case "add-patient":
        return <AddPatientPage onBack={handleBackToPatients} />
      case "edit-patient":
        return selectedPatient ? (
          <AddPatientPage patient={selectedPatient} onBack={() => setCurrentPage("patient-details")} />
        ) : null
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <Header user={user} currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage} // Key changes on page change, triggering animation
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderCurrentPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      <MobileNavigation currentPage={currentPage} onPageChange={setCurrentPage} onAddPatient={handleAddPatient} />
    </div>
  )
}
