"use client"

import { useState, useEffect } from "react"
import type { User } from "firebase/auth"
import type { Patient, AttendanceRecord } from "@/types/patient"
import type { Invoice, InvoiceSession } from "@/types/invoice"
import type { UserProfile } from "@/types/user-profile"
import { getPatientAttendance } from "@/lib/firebase-operations"
import { createInvoice } from "@/lib/invoice-operations"
import { generateInvoicePDF } from "@/lib/pdf-generator"
import { getUserProfile } from "@/lib/user-profile-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowRight, ArrowLeft, CheckCircle, FileText, TrendingUp } from "lucide-react"
import DatePicker from "react-datepicker"
import { format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns"

interface InvoiceGenerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: Patient
  user: User
  onInvoiceCreated: (invoice: Invoice) => void
}

export default function InvoiceGenerationDialog({
  open,
  onOpenChange,
  patient,
  user,
  onInvoiceCreated,
}: InvoiceGenerationDialogProps) {
  // Multi-step state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Form data
  const [dateRangeType, setDateRangeType] = useState<"thisMonth" | "custom">("thisMonth")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [patientFullName, setPatientFullName] = useState<string>("")
  const [perSessionRate, setPerSessionRate] = useState<number>(0)

  // Session data
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([])
  const [filteredSessions, setFilteredSessions] = useState<AttendanceRecord[]>([])

  // User profile data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Loading and error states
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load attendance records and user profile when dialog opens
  useEffect(() => {
    if (open) {
      loadAttendanceRecords()
      loadUserProfile()
      // Pre-populate patient name
      setPatientFullName(patient.name || "")
      // Set default dates for "this month"
      const now = new Date()
      setStartDate(startOfMonth(now))
      setEndDate(endOfMonth(now))
    } else {
      // Reset form when dialog closes
      resetForm()
    }
  }, [open, patient.id])

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile(user.uid)
      setUserProfile(profile)
    } catch (err) {
      console.error("Error loading user profile:", err)
    }
  }

  // Filter sessions when date range changes
  useEffect(() => {
    if (startDate && endDate) {
      const filtered = allAttendance.filter((record) => {
        const recordDate = parseISO(record.timestamp)
        return recordDate >= startOfDay(startDate) && recordDate <= endOfDay(endDate)
      })
      setFilteredSessions(filtered)
    } else {
      setFilteredSessions([])
    }
  }, [startDate, endDate, allAttendance])

  const loadAttendanceRecords = async () => {
    setLoadingAttendance(true)
    setError(null)
    try {
      const records = await getPatientAttendance(patient.id)
      setAllAttendance(records)
    } catch (err) {
      console.error("Error loading attendance:", err)
      setError("Failed to load attendance records")
    } finally {
      setLoadingAttendance(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setDateRangeType("thisMonth")
    setStartDate(null)
    setEndDate(null)
    setPatientFullName("")
    setPerSessionRate(0)
    setFilteredSessions([])
    setError(null)
  }

  // Auto-set dates when "This Month" is selected
  useEffect(() => {
    if (dateRangeType === "thisMonth") {
      const now = new Date()
      setStartDate(startOfMonth(now))
      setEndDate(endOfMonth(now))
    }
  }, [dateRangeType])

  const canProceedStep1 = (): boolean => {
    if (!startDate || !endDate) return false
    if (endDate < startDate) return false
    if (filteredSessions.filter((s) => s.status === "present").length === 0) return false
    return true
  }

  const canProceedStep2 = (): boolean => {
    return patientFullName.trim().length > 0
  }

  const canProceedStep3 = (): boolean => {
    return perSessionRate > 0
  }

  const handleNext = () => {
    if (step === 1 && canProceedStep1()) {
      setStep(2)
    } else if (step === 2 && canProceedStep2()) {
      setStep(3)
    } else if (step === 3 && canProceedStep3()) {
      setStep(4)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as 1 | 2 | 3 | 4)
    }
  }

  const handleGenerate = async () => {
    if (!startDate || !endDate) return

    setGenerating(true)
    setError(null)

    try {
      // Get current user for therapist info
      const therapistName = user.displayName || user.email?.split("@")[0] || ""
      const therapistEmail = user.email || ""

      // Calculate financial details
      const presentSessions = filteredSessions.filter((s) => s.status === "present").length
      const totalAmount = presentSessions * perSessionRate

      // Prepare invoice sessions (only present sessions)
      const invoiceSessions: InvoiceSession[] = filteredSessions
        .filter((record) => record.status === "present")
        .map((record) => ({
          date: record.timestamp,
          status: record.status,
          timestamp: record.timestamp,
        }))

      // Create invoice data
      const invoiceData: Omit<Invoice, "id" | "invoiceNumber" | "createdAt"> = {
        patientId: patient.id,
        patientName: patient.name,
        patientFullName: patientFullName.trim(),
        patientContact: patient.contact,
        patientAddress: patient.address,
        therapistName,
        therapistEmail,
        therapistRegistrationNumber: userProfile?.registrationNumber || "",
        therapistAddress: userProfile?.address || "",
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        sessions: invoiceSessions,
        perSessionRate,
        totalSessions: filteredSessions.length,
        presentSessions,
        totalAmount,
        isPaid: false,
        createdBy: user.uid || "demo-user",
      }

      // Save invoice to database and get the created invoice back
      const savedInvoice = await createInvoice(invoiceData)

      // Generate and download PDF
      await generateInvoicePDF(savedInvoice)

      // Success - close dialog and refresh list
      onInvoiceCreated(savedInvoice)
      onOpenChange(false)
      resetForm()
    } catch (err) {
      console.error("Error generating invoice:", err)
      setError("Failed to generate invoice. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const presentCount = filteredSessions.filter((s) => s.status === "present").length
  const absentCount = filteredSessions.filter((s) => s.status === "absent").length
  const totalSessions = filteredSessions.length
  const calculatedAmount = presentCount * perSessionRate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[85svh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center text-xl">
            <FileText className="h-5 w-5 mr-2 text-blue-600 shrink-0" />
            <p className="text-lg text-left">
            Generate Invoice for {patient.name}
            </p>
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-1 mb-6 shrink-0">
          <StepIndicator number={1} active={step === 1} completed={step > 1} label="Date" />
          <div className="w-6 h-0.5 bg-slate-200"></div>
          <StepIndicator number={2} active={step === 2} completed={step > 2} label="Name" />
          <div className="w-6 h-0.5 bg-slate-200"></div>
          <StepIndicator number={3} active={step === 3} completed={step > 3} label="Rate" />
          <div className="w-6 h-0.5 bg-slate-200"></div>
          <StepIndicator number={4} active={step === 4} completed={false} label="Preview" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 shrink-0">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
        {/* Step 1: Date Range Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-800 mb-3">Select Invoice Period</h3>

              {/* Radio Buttons for Date Range Type */}
              <div className="mb-4 space-y-3">
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors border-blue-200 bg-blue-50">
                  <input
                    type="radio"
                    name="dateRangeType"
                    value="thisMonth"
                    checked={dateRangeType === "thisMonth"}
                    onChange={(e) => setDateRangeType(e.target.value as "thisMonth" | "custom")}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="font-medium text-slate-800">This Month</span>
                    </div>
                    <p className="text-xs text-slate-600 ml-6">
                      {format(startOfMonth(new Date()), "MMM dd")} -{" "}
                      {format(endOfMonth(new Date()), "MMM dd, yyyy")}
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="dateRangeType"
                    value="custom"
                    checked={dateRangeType === "custom"}
                    onChange={(e) => setDateRangeType(e.target.value as "thisMonth" | "custom")}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-slate-800">Custom Date Range</span>
                    <p className="text-xs text-slate-600">Select specific start and end dates</p>
                  </div>
                </label>
              </div>

              {/* Date Pickers - Only show for custom range */}
              {dateRangeType === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Date
                    </label>
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      maxDate={new Date()}
                      placeholderText="Select start date"
                      className="w-full"
                      dateFormat="MMM dd, yyyy"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate || undefined}
                      maxDate={new Date()}
                      placeholderText="Select end date"
                      className="w-full"
                      dateFormat="MMM dd, yyyy"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Session Preview */}
            {startDate && endDate && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-sm font-medium text-slate-700 mb-2">
                  Sessions in selected period:
                </div>
                {loadingAttendance ? (
                  <div className="text-sm text-slate-500">Loading sessions...</div>
                ) : totalSessions === 0 ? (
                  <div className="text-sm text-amber-600">
                    ⚠️ No sessions found in this date range
                  </div>
                ) : (
                  <div className="flex items-center space-x-4 text-sm">
                    <div>
                      <span className="font-semibold text-blue-600">{totalSessions}</span>{" "}
                      <span className="text-slate-600">total</span>
                    </div>
                    <div>
                      <span className="font-semibold text-green-600">{presentCount}</span>{" "}
                      <span className="text-slate-600">present</span>
                    </div>
                    <div>
                      <span className="font-semibold text-red-600">{absentCount}</span>{" "}
                      <span className="text-slate-600">absent</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Patient Full Name */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-800 mb-3">Patient Full Name</h3>
              <p className="text-sm text-slate-600 mb-4">
                Enter the patient's full name as it should appear on the invoice/certificate
              </p>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name *
              </label>
              <Input
                type="text"
                value={patientFullName}
                onChange={(e) => setPatientFullName(e.target.value)}
                placeholder="Enter patient's full legal name"
                className="text-base"
              />
              {patientFullName.trim() && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Preview:</strong> {patientFullName}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Rate Input */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-800 mb-3">Set Session Rate</h3>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rate per Session (₹)
              </label>
              <Input
                type="number"
                value={perSessionRate || ""}
                onChange={(e) => setPerSessionRate(Number(e.target.value))}
                placeholder="Enter amount"
                className="text-lg"
                min="0"
                step="50"
              />
            </div>

            {/* Calculation Preview */}
            {perSessionRate > 0 && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Calculation:</span>
                </div>
                <div className="text-sm text-slate-600 space-y-1">
                  <div>
                    {presentCount} present session{presentCount !== 1 ? "s" : ""} × ₹
                    {perSessionRate.toLocaleString("en-IN")}
                  </div>
                  <div className="text-2xl font-bold text-green-600 mt-2">
                    = ₹{calculatedAmount.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            )}

            {presentCount === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700">
                  ⚠️ No present sessions in this period. Invoice amount will be ₹0.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Preview & Generate */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-800 mb-3">Invoice Summary</h3>

              {/* Patient Info */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-3">
                <div className="text-xs font-medium text-slate-500 mb-2">PATIENT</div>
                <div className="font-semibold text-slate-800">{patient.name}</div>
                <div className="text-sm text-slate-600">{patient.contact}</div>
              </div>

              {/* Period */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-3">
                <div className="text-xs font-medium text-blue-700 mb-2">PERIOD</div>
                <div className="text-sm font-semibold text-slate-800">
                  {startDate && format(startDate, "MMM dd, yyyy")} -{" "}
                  {endDate && format(endDate, "MMM dd, yyyy")}
                </div>
              </div>

              {/* Financial Details */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-xs font-medium text-green-700 mb-3">FINANCIAL DETAILS</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Sessions:</span>
                    <span className="font-semibold text-slate-800">{totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Present Sessions:</span>
                    <span className="font-semibold text-green-600">{presentCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Rate per Session:</span>
                    <span className="font-semibold text-slate-800">
                      ₹{perSessionRate.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="border-t border-green-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">TOTAL AMOUNT:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ₹{calculatedAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-slate-200 shrink-0">
          <div>
            {step > 1 && (
              <Button onClick={handleBack} variant="outline" disabled={generating}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && !canProceedStep1()) ||
                  (step === 2 && !canProceedStep2()) ||
                  (step === 3 && !canProceedStep3())
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {generating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Generate Invoice
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step Indicator Component
function StepIndicator({
  number,
  active,
  completed,
  label,
}: {
  number: number
  active: boolean
  completed: boolean
  label: string
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
          completed
            ? "bg-green-500 text-white"
            : active
              ? "bg-blue-600 text-white"
              : "bg-slate-200 text-slate-500"
        }`}
      >
        {completed ? <CheckCircle className="h-4 w-4" /> : number}
      </div>
      <div
        className={`text-xs mt-1 font-medium ${active ? "text-blue-600" : "text-slate-500"}`}
      >
        {label}
      </div>
    </div>
  )
}
