export interface InvoiceSession {
  date: string                 // ISO string
  status: "present" | "absent"
  timestamp: string            // Original attendance timestamp
}

export interface Invoice {
  id: string                   // Firestore doc ID
  invoiceNumber: string        // Human-readable: "INV-2026-001"
  patientId: string            // Reference to patient
  patientName: string          // Denormalized for easier PDF generation
  patientFullName: string      // Full name for certificate/invoice
  patientContact: string       // Denormalized
  patientAddress: string       // Denormalized

  // Physiotherapist details (from auth user at time of creation)
  therapistName: string        // From user.displayName
  therapistEmail: string       // From user.email
  therapistRegistrationNumber?: string  // Registration number from user profile
  therapistAddress?: string    // Address from user profile

  // Invoice details
  dateRange: {
    startDate: string          // ISO string
    endDate: string            // ISO string
  }

  // Session details
  sessions: InvoiceSession[]   // Array of session records (only present sessions)

  // Financial details
  perSessionRate: number       // Rate per session
  totalSessions: number        // Count of sessions in date range
  presentSessions: number      // Count of "present" sessions
  totalAmount: number          // presentSessions * perSessionRate

  // Payment status
  isPaid: boolean              // Whether invoice has been paid

  // Metadata
  createdAt: string           // ISO string / Firestore timestamp
  createdBy: string           // User ID
}

// Form state types for multi-step dialog
export interface InvoiceFormData {
  startDate: Date | null
  endDate: Date | null
  perSessionRate: number
}
