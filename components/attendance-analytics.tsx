"use client";

import { useState, useEffect } from "react";
import type { Patient } from "@/types/patient";
import { getPatientAttendance } from "@/lib/firebase-operations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, Filter, RotateCcw, ArrowLeft, FileText } from "lucide-react";
import AllInvoicesPage from "@/components/all-invoices-page";
import { format, startOfDay, endOfDay } from "date-fns";

interface AttendanceAnalyticsProps {
  patients: Patient[];
  onBack: () => void;
}

interface PatientAnalytics {
  patient: Patient;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  lastSession?: string;
}

export default function AttendanceAnalytics({
  patients,
  onBack,
}: AttendanceAnalyticsProps) {
  const [analytics, setAnalytics] = useState<PatientAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [patients, startDate, endDate]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const analyticsData: PatientAnalytics[] = [];

      for (const patient of patients) {
        const records = await getPatientAttendance(patient.id);

        // Filter records by date range if selected
        const filteredRecords =
          startDate && endDate
            ? records.filter((record) => {
                const recordDate = new Date(record.timestamp);
                return (
                  recordDate >= startOfDay(startDate) &&
                  recordDate <= endOfDay(endDate)
                );
              })
            : records;

        const presentCount = filteredRecords.filter(
          (r) => r.status === "present"
        ).length;
        const absentCount = filteredRecords.filter(
          (r) => r.status === "absent"
        ).length;
        const totalSessions = filteredRecords.length;
        const attendanceRate =
          totalSessions > 0
            ? Math.round((presentCount / totalSessions) * 100)
            : 0;
        const lastSession =
          filteredRecords.length > 0 ? filteredRecords[0].timestamp : undefined;

        analyticsData.push({
          patient,
          totalSessions,
          presentCount,
          absentCount,
          attendanceRate,
          lastSession,
        });
      }

      // Sort by attendance rate (lowest first to identify patients needing attention)
      analyticsData.sort((a, b) => a.attendanceRate - b.attendanceRate);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const overallStats = analytics.reduce(
    (acc, curr) => ({
      totalPatients: acc.totalPatients + 1,
      totalSessions: acc.totalSessions + curr.totalSessions,
      totalPresent: acc.totalPresent + curr.presentCount,
      totalAbsent: acc.totalAbsent + curr.absentCount,
    }),
    { totalPatients: 0, totalSessions: 0, totalPresent: 0, totalAbsent: 0 }
  );

  const overallAttendanceRate =
    overallStats.totalSessions > 0
      ? Math.round(
          (overallStats.totalPresent / overallStats.totalSessions) * 100
        )
      : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Attendance Analytics</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and analyze patient attendance patterns</p>
        </div> */}
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="hidden sm:flex items-center space-x-2 bg-white border-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Patients</span>
        </Button>
      </div> 

      {/* Date Range Filter */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            <div className="flex items-center">
              <Filter className="h-5 w-5 mr-2 text-blue-600" />
              Filter Analytics
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
              <label className="block text-sm font-medium text-slate-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value + 'T00:00:00') : null)}
                className="w-full native-date-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value + 'T00:00:00') : null)}
                min={startDate ? format(startDate, 'yyyy-MM-dd') : undefined}
                className="w-full native-date-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg mx-auto mb-2">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {overallStats.totalPatients}
            </div>
            <div className="text-xs sm:text-sm text-slate-600">Patients</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-lg mx-auto mb-2">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {overallStats.totalSessions}
            </div>
            <div className="text-xs sm:text-sm text-slate-600">Sessions</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg mx-auto mb-2">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {overallStats.totalPresent}
            </div>
            <div className="text-xs sm:text-sm text-slate-600">Present</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-lg mx-auto mb-2">
              <div className="text-orange-600 font-bold text-sm sm:text-lg">
                {overallAttendanceRate}%
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              Rate
            </div>
            <div className="text-xs sm:text-sm text-slate-600">Overall</div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Analytics */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Patient Details
            {(startDate || endDate) && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Filtered
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">
              Loading analytics...
            </div>
          ) : analytics.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No attendance data available
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-4">
                {analytics.map((data) => (
                  <div
                    key={data.patient.id}
                    className="p-3 sm:p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-start justify-between flex-col">
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 justify-between w-full">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-blue-100">
                          <AvatarImage
                            src={
                              data.patient?.profileImage || "/placeholder.svg"
                            }
                            alt={data?.patient?.name}
                          />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm">
                            {data.patient?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Badge
                            variant={
                              data.attendanceRate >= 80
                                ? "default"
                                : data.attendanceRate >= 60
                                ? "secondary"
                                : "destructive"
                            }
                            className={`text-xs ${
                              data.attendanceRate >= 80
                                ? "bg-green-100 text-green-700 border-green-200"
                                : data.attendanceRate >= 60
                                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }`}
                          >
                            {data.attendanceRate >= 80
                              ? "Excellent"
                              : data.attendanceRate >= 60
                              ? "Good"
                              : "Attention"}
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full">
                        <div className="flex flex-col space-y-1 mb-2">
                          <h3 className="font-semibold text-slate-800 text-sm sm:text-base mt-4">
                            {data.patient.name}
                          </h3>
                          <p className="text-xs">
                            {data.patient.patientId}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm mb-3">
                          <div>
                            <div className="text-slate-500">Sessions</div>
                            <div className="font-medium text-slate-700">
                              {data.totalSessions}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Present</div>
                            <div className="font-medium text-green-600">
                              {data.presentCount}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Absent</div>
                            <div className="font-medium text-red-600">
                              {data.absentCount}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Last</div>
                            <div className="font-medium text-slate-700">
                              {data.lastSession
                                ? format(new Date(data.lastSession), "MMM dd")
                                : "Never"}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs sm:text-sm text-slate-600 mb-1">
                            <span>Attendance Rate</span>
                            <span>{data.attendanceRate}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                data.attendanceRate >= 80
                                  ? "bg-gradient-to-r from-green-500 to-green-600"
                                  : data.attendanceRate >= 60
                                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                  : "bg-gradient-to-r from-red-500 to-red-600"
                              }`}
                              style={{ width: `${data.attendanceRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* All Invoices Section */}
      <AllInvoicesPage />
    </div>
  );
}
