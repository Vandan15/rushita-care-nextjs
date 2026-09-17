export interface Payment {
  id: string // Firestore doc ID
  patientId: string // Reference to patient
  amount: number // Amount received
  paidOn: string // ISO string — the date the admin says the payment was received
  note?: string // Optional free text, e.g. "cash", "UPI", "partial"

  // Metadata
  createdAt: string // ISO string — when the record was entered
  createdBy: string // User ID of the therapist/admin who recorded it
}

// Form state for the mark-as-paid dialog
export interface PaymentFormData {
  amount: number
  paidOn: Date | null
  note: string
}
