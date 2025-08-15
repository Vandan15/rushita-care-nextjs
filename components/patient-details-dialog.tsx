"use client"

import { useState, useEffect } from "react"
import type { Patient, AttendanceRecord } from "@/types/patient"
import { getPatientAttendance, markAttendance } from "@/lib/firebase-operations"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Phone, MapPin, Calendar, CheckCircle, XCircle, Clock, TrendingUp, Activity } from "lucide-react"
import { format } from "date-fns"

interface PatientDetailsDialogProps {
  patient: Patient | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PatientDetailsDialog({ patient, open, onOpenChange }: PatientDetailsDialogProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [markingAttendance, setMarkingAttendance] = useState<string | null>(null)

  useEffect(() => {
    if (patient && open) {
      loadAttendanceHistory()
    }
  }, [patient, open])

  const loadAttendanceHistory = async () => {
    if (!patient) return

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
    if (!patient) return

    setMarkingAttendance(status)
    try {
      await markAttendance(patient.id, status)
      await loadAttendanceHistory() // Refresh the data
    } catch (error) {
      console.error("Error marking attendance:", error)
    } finally {
      setMarkingAttendance(null)
    }
  }

  if (!patient) return null

  const presentCount = attendanceRecords.filter((r) => r.status === "present").length
  const absentCount = attendanceRecords.filter((r) => r.status === "absent").length
  const totalSessions = attendanceRecords.length
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col bg-white">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-800">Patient Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              {/* Patient Profile */}
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 ring-4 ring-blue-100">
                        <AvatarImage src={patient.profileImage || "/placeholder.svg"} alt={patient.name} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-2xl font-bold">
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-white"></div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800 mb-2">{patient.name}</h2>
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-4">
                            Patient ID: {patient.patientId}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Phone className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-slate-500">Phone</div>
                            <div className="font-medium text-slate-700">{patient.contact}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="text-slate-500">Registered</div>
                            <div className="font-medium text-slate-700">
                              {format(new Date(patient.createdAt), "MMM dd, yyyy")}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 md:col-span-2">
                          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mt-1">
                            <MapPin className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-slate-500">Address</div>
                            <div className="font-medium text-slate-700">{patient.address}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Actions */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Activity className="h-5 w-5 mr-2 text-blue-600" />
                    Mark Today's Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleMarkAttendance("present")}
                      disabled={markingAttendance !== null}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {markingAttendance === "present" ? "Marking..." : "Mark Present"}
                    </Button>
                    <Button
                      onClick={() => handleMarkAttendance("absent")}
                      disabled={markingAttendance !== null}
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {markingAttendance === "absent" ? "Marking..." : "Mark Absent"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Summary */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Attendance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{totalSessions}</div>
                      <div className="text-sm text-slate-600">Total Sessions</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                      <div className="text-sm text-slate-600">Present</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                      <div className="text-sm text-slate-600">Absent</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{attendanceRate}%</div>
                      <div className="text-sm text-slate-600">Attendance</div>
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
                </CardContent>
              </Card>

              {/* Attendance History */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Session History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-slate-500">Loading session history...</div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No session records found</div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {attendanceRecords.slice(0, 15).map((record, index) => (
                        <div key={record.id}>
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  record.status === "present"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {record.status === "present" ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <XCircle className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-slate-700 capitalize">{record.status}</div>
                                <div className="text-sm text-slate-500">
                                  {format(new Date(record.timestamp), "EEEE, MMM dd, yyyy")}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-slate-500">{format(new Date(record.timestamp), "h:mm a")}</div>
                          </div>
                          {index < attendanceRecords.slice(0, 15).length - 1 && <Separator className="my-2" />}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button onClick={() => onOpenChange(false)} className="bg-slate-600 hover:bg-slate-700">
            Close Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
