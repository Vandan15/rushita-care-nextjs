import { db, isDemoMode } from "./firebase"
import { collection, addDoc, doc, query, where, getDocs, deleteDoc } from "firebase/firestore"
import type { Payment } from "@/types/payment"

// Demo data storage
let demoPayments: Payment[] = []

/**
 * Helper to parse an ISO-or-Timestamp field from Firestore doc data
 * Handles both Firestore Timestamp objects and plain ISO strings
 */
const parseDateField = (value: unknown): string => {
  if (!value) return new Date().toISOString()
  // Firestore Timestamp
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  // Already a string
  if (typeof value === "string") return value
  return new Date().toISOString()
}

const mapPaymentDoc = (id: string, data: Record<string, unknown>): Payment =>
  ({
    ...data,
    id,
    paidOn: parseDateField(data.paidOn),
    createdAt: parseDateField(data.createdAt),
  }) as Payment

/**
 * Record a manual payment against a patient.
 * Independent of invoices — used when the admin never generated one.
 */
export const addPayment = async (paymentData: Omit<Payment, "id" | "createdAt">): Promise<Payment> => {
  const createdAt = new Date().toISOString()

  if (isDemoMode) {
    const newPayment: Payment = {
      ...paymentData,
      id: `demo-pay-${Date.now()}`,
      createdAt,
    }
    demoPayments.unshift(newPayment)
    return newPayment
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    const docRef = await addDoc(collection(db, "payments"), {
      ...paymentData,
      createdAt,
    })

    return {
      ...paymentData,
      id: docRef.id,
      createdAt,
    }
  } catch (error) {
    console.error("Error recording payment:", error)
    throw error
  }
}

/**
 * Get all payments for a specific patient.
 * Returns payments sorted by the date they were paid on (newest first).
 */
export const getPatientPayments = async (patientId: string): Promise<Payment[]> => {
  if (isDemoMode) {
    return [...demoPayments]
      .filter((payment) => payment.patientId === patientId)
      .sort((a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime())
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    // Simple query by patientId only - sort client-side to avoid composite index requirement
    const q = query(collection(db, "payments"), where("patientId", "==", patientId))

    const querySnapshot = await getDocs(q)
    const payments = querySnapshot.docs.map((docSnap) => mapPaymentDoc(docSnap.id, docSnap.data()))

    // Sort client-side (newest first)
    return payments.sort((a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime())
  } catch (error) {
    console.error("Error fetching patient payments:", error)
    return []
  }
}

/**
 * Get every recorded payment (for global reporting)
 */
export const getAllPayments = async (): Promise<Payment[]> => {
  if (isDemoMode) {
    return [...demoPayments].sort((a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime())
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    const querySnapshot = await getDocs(query(collection(db, "payments")))
    const payments = querySnapshot.docs.map((docSnap) => mapPaymentDoc(docSnap.id, docSnap.data()))

    // Sort client-side (newest first)
    return payments.sort((a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime())
  } catch (error) {
    console.error("Error fetching all payments:", error)
    return []
  }
}

/**
 * Delete a recorded payment
 */
export const deletePayment = async (paymentId: string): Promise<void> => {
  if (isDemoMode) {
    demoPayments = demoPayments.filter((payment) => payment.id !== paymentId)
    return
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    await deleteDoc(doc(db, "payments", paymentId))
  } catch (error) {
    console.error("Error deleting payment:", error)
    throw error
  }
}

/**
 * Sum of every payment received from a patient
 */
export const getTotalPaid = (payments: Payment[]): number =>
  payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
