export interface Patient {
  id: string
  name: string
  patientId: string
  contact: string
  address: string
  profileImage?: string
  createdAt: string
  updatedAt?: string
}

export interface AttendanceRecord {
  id: string
  patientId: string
  status: "present" | "absent"
  timestamp: string
}
