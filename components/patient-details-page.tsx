"use client"

import { useState, useEffect } from "react"
import type { User } from "firebase/auth"
import type { Patient, AttendanceRecord } from "@/types/patient"
import type { Invoice } from "@/types/invoice"
import { getPatientAttendance, markAttendance, updateAttendance, deletePatient, deleteAttendance } from "@/lib/firebase-operations"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import DatePicker from "react-datepicker"
import {
  ArrowLeft,
  Phone,
  MapPin,
  CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  Filter,
  Edit,
  RotateCcw,
  Trash2,
  NotebookIcon,
  NotepadTextDashedIcon,
  PencilIcon,
  Copy,
  FileText,
} from "lucide-react"
import InvoiceGenerationDialog from "@/components/invoice-generation-dialog"
import InvoiceList from "@/components/invoice-list"
import { format, isToday, parseISO, startOfDay, endOfDay } from "date-fns"

interface PatientDetailsPageProps {
  patient: Patient
  onBack: () => void
  onEdit: (patient: Patient) => void
  user: User
}

export default function PatientDetailsPage({ patient, onBack, onEdit, user }: PatientDetailsPageProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [markingAttendance, setMarkingAttendance] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
  const [modifyingRecord, setModifyingRecord] = useState<string | null>(null)
  const [copiedPatientId, setCopiedPatientId] = useState(false)
  const [customDate, setCustomDate] = useState<Date | null>(null)
  const [markingCustomAttendance, setMarkingCustomAttendance] = useState<"present" | "absent" | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<string | null>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    loadAttendanceHistory()
  }, [patient])

  useEffect(() => {
    // Filter records based on date range
    if (startDate && endDate) {
      const filtered = attendanceRecords.filter((record) => {
        const recordDate = parseISO(record.timestamp)
        return recordDate >= startOfDay(startDate) && recordDate <= endOfDay(endDate)
      })
      setFilteredRecords(filtered)
    } else {
      setFilteredRecords(attendanceRecords)
    }
  }, [attendanceRecords, startDate, endDate])

  useEffect(() => {
    // Check if attendance is already marked for today
    const today = new Date().toDateString()
    const todayRecord = attendanceRecords.find((record) => {
      return new Date(record.timestamp).toDateString() === today
    })
    setTodayAttendance(todayRecord || null)
  }, [attendanceRecords])

  const loadAttendanceHistory = async () => {
    setLoading(true)
    try {
      const records = await getPatientAttendance(patient.id)
      setAttendanceRecords(records)
    } catch (error) {
      console.error("Error loading attendance:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAttendance = async (status: "present" | "absent") => {
    setMarkingAttendance(status)
    try {
      await markAttendance(patient.id, status)
      await loadAttendanceHistory()
    } catch (error) {
      console.error("Error marking attendance:", error)
    } finally {
      setMarkingAttendance(null)
    }
  }

  const handleMarkCustomDateAttendance = async (status: "present" | "absent") => {
    if (!customDate) return
    
    setMarkingCustomAttendance(status)
    try {
      // Format the date to start of day to avoid timezone issues
      const date = new Date(customDate)
      date.setHours(0, 0, 0, 0)
      
      await markAttendance(patient.id, status, date)
      await loadAttendanceHistory()
      setCustomDate(null)
    } catch (error) {
      console.error("Error marking custom date attendance:", error)
    } finally {
      setMarkingCustomAttendance(null)
    }
  }

  const handleModifyTodayAttendance = async (newStatus: "present" | "absent") => {
    if (!todayAttendance) return

    setModifyingRecord(newStatus)
    try {
      await updateAttendance(todayAttendance.id, newStatus)
      await loadAttendanceHistory()
    } catch (error) {
      console.error("Error modifying attendance:", error)
    } finally {
      setModifyingRecord(null)
    }
  }

  const clearDateFilter = () => {
    setStartDate(null)
    setEndDate(null)
  }

  const handleDeleteAttendance = async (attendanceId: string) => {
    if (window.confirm("Are you sure you want to delete this attendance record? This action cannot be undone.")) {
      setDeletingRecord(attendanceId)
      try {
        await deleteAttendance(attendanceId)
        await loadAttendanceHistory()
      } catch (error) {
        console.error("Error deleting attendance record:", error)
      } finally {
        setDeletingRecord(null)
      }
    }
  }

  const handleDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${patient.name}? This action cannot be undone and will remove all attendance records.`,
      )
    ) {
      try {
        await deletePatient(patient.id)
        onBack() // Navigate back to patients list
      } catch (error) {
        console.error("Error deleting patient:", error)
      }
    }
  }

  const handleCopyPatientId = () => {
    navigator.clipboard.writeText(patient.patientId)
    setCopiedPatientId(true)
    setTimeout(() => setCopiedPatientId(false), 2000)
  }

  const presentCount = filteredRecords.filter((r) => r.status === "present").length
  const absentCount = filteredRecords.filter((r) => r.status === "absent").length
  const totalSessions = filteredRecords.length
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Hide back button on mobile */}
      <div className="flex items-center justify-end sm:justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="hidden sm:flex items-center space-x-2 bg-white border-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Patients</span>
        </Button>
        {/* <div className="sm:hidden">
          <h1 className="text-xl font-bold text-gray-900">Patient Details</h1>
        </div> */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInvoiceDialog(true)}
            className="bg-white border-slate-200"
          >
            <FileText className="h-4 w-4" />
            <span>Invoice</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(patient)} className="bg-white border-slate-200">
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Patient Profile - Redesigned for mobile */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-blue-100">
                <AvatarImage src={patient.profileImage || "/placeholder.svg"} alt={patient?.name} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xl sm:text-2xl font-bold">
                  {patient?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 sm:border-3 border-white"></div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">{patient.name}</h2>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-4 cursor-pointer" onClick={handleCopyPatientId}>Patient ID: {patient.patientId}
                
                {copiedPatientId ? (
                  <CheckCircle className="h-4 w-4 ml-1 text-green-500" />
                ):<Copy className="h-4 w-4 ml-1" />}
                
              </Badge>
            </div>
          </div>

          {/* Contact Information - Redesigned Grid for mobile stacking */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Phone */}
            <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-blue-700 mb-0.5">Phone Number</div>
                <div className="text-slate-800 font-semibold truncate text-sm">{patient.contact}</div>
              </div>
            </div>

            {/* Registration Date */}
            <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-green-700 mb-0.5">Registered</div>
                <div className="text-slate-800 font-semibold text-sm">
                  {format(new Date(patient.createdAt), "MMM dd, yyyy")}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start p-4 bg-purple-50 rounded-xl border border-purple-100 md:col-span-1">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-purple-700 mb-0.5">Address</div>
                <div className="text-slate-800 font-semibold leading-snug text-sm">{patient.address}</div>
              </div>
            </div>

            {/* Notes */}
           {patient?.notes && <div className="flex items-start p-4 bg-yellow-50 rounded-xl border border-purple-100 md:col-span-1">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <PencilIcon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-yellow-700 mb-0.5">Notes</div>
                <div className="text-slate-800 font-semibold leading-snug text-sm">{patient?.notes}</div>
              </div>
            </div>}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Actions */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Today's Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAttendance ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {todayAttendance.status === "present" ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <div className="text-center sm:text-left">
                    <div className="font-medium text-slate-700">
                      Marked as <span className="capitalize font-bold">{todayAttendance.status}</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      at {format(new Date(todayAttendance.timestamp), "h:mm a")}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-4 flex-wrap">
                <Button
                  onClick={() => handleModifyTodayAttendance("present")}
                  disabled={modifyingRecord !== null || todayAttendance.status === "present"}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 text-sm"
                >
                  <CheckCircle className="h-4 w-4" />
                  {modifyingRecord === "present" ? "Updating..." : "Mark Present"}
                </Button>
                <Button
                  onClick={() => handleModifyTodayAttendance("absent")}
                  disabled={modifyingRecord !== null || todayAttendance.status === "absent"}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm bg-white"
                >
                  <XCircle className="h-4 w-4" />
                  {modifyingRecord === "absent" ? "Updating..." : "Mark Absent"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 sm:gap-4 flex-wrap">
              <Button
                onClick={() => handleMarkAttendance("present")}
                disabled={markingAttendance !== null}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm"
              >
                <CheckCircle className="h-4 w-4" />
                {markingAttendance === "present" ? "Marking..." : "Mark Present"}
              </Button>
              <Button
                onClick={() => handleMarkAttendance("absent")}
                disabled={markingAttendance !== null}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-sm bg-white"
              >
                <XCircle className="h-4 w-4" />
                {markingAttendance === "absent" ? "Marking..." : "Mark Absent"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Range Filter */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            <div className="flex items-center">
              <Filter className="h-5 w-5 mr-2 text-blue-600" />
              Filter Records
            </div>
            {(startDate || endDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearDateFilter}
                className="text-xs bg-white border-slate-200"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Select start date"
                className="w-full"
                dateFormat="MMM dd, yyyy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate!}
                placeholderText="Select end date"
                className="w-full"
                dateFormat="MMM dd, yyyy"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Attendance Overview
            {(startDate || endDate) && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Filtered
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalSessions}</div>
              <div className="text-xs sm:text-sm text-slate-600">Total</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{presentCount}</div>
              <div className="text-xs sm:text-sm text-slate-600">Present</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{absentCount}</div>
              <div className="text-xs sm:text-sm text-slate-600">Absent</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{attendanceRate}%</div>
              <div className="text-xs sm:text-sm text-slate-600">Rate</div>
            </div>
          </div>

          {totalSessions > 0 && (
            <div>
              <div className="flex justify-between text-sm text-slate-600 mb-2">
                <span>Attendance Rate</span>
                <span>{attendanceRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Custom Date Attendance */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Mark Attendance for Another Date</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <DatePicker
                  selected={customDate}
                  onChange={(date) => setCustomDate(date)}
                  maxDate={new Date()}
                  placeholderText="Select a past date"
                  className="w-full"
                  dateFormat="MMM dd, yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => customDate && handleMarkCustomDateAttendance("present")}
                  disabled={!customDate || markingCustomAttendance !== null}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm"
                  size="sm"
                >
                  {markingCustomAttendance === "present" ? "Marking..." : "Mark Present"}
                </Button>
                <Button
                  onClick={() => customDate && handleMarkCustomDateAttendance("absent")}
                  disabled={!customDate || markingCustomAttendance !== null}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-sm"
                  size="sm"
                >
                  {markingCustomAttendance === "absent" ? "Marking..." : "Mark Absent"}
                </Button>
              </div>
            </div>
            {customDate && customDate > new Date() && (
              <p className="mt-2 text-xs text-red-500">Cannot mark attendance for future dates</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Session History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading session history...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {startDate || endDate ? "No records found for selected date range" : "No session records found"}
            </div>
          ) : (
            <ScrollArea className="h-64 sm:h-96">
              <div className="space-y-3">
                {filteredRecords.map((record, index) => (
                  <div key={record.id}>
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                            record.status === "present" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          }`}
                        >
                          {record.status === "present" ? (
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                          ) : (
                            <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-700 capitalize flex items-center space-x-2">
                            <span className="text-sm sm:text-base">{record.status}</span>
                            {isToday(new Date(record.timestamp)) && (
                              <Badge variant="secondary" className="text-xs">
                                Today
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-500">
                            {format(new Date(record.timestamp), "EEEE, MMM dd, yyyy")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-xs sm:text-sm text-slate-500">
                          {format(new Date(record.timestamp), "h:mm a")}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteAttendance(record.id)
                          }}
                          disabled={deletingRecord === record.id}
                        >
                          {deletingRecord === record.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                    {index < filteredRecords.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Invoice Generation Dialog */}
      <InvoiceGenerationDialog
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
        patient={patient}
        user={user}
        onInvoiceCreated={(invoice) => {
          setLastCreatedInvoice(invoice)
        }}
      />

      {/* Invoices Section */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Generated Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceList patientId={patient.id} newInvoice={lastCreatedInvoice} />
        </CardContent>
      </Card>
    </div>
  )
}
