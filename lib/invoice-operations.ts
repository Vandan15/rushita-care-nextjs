import { db, isDemoMode } from "./firebase"
import {
  collection,
  addDoc,
  doc,
  query,
  where,
  getDocs,
  runTransaction,
  updateDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore"
import type { Invoice } from "@/types/invoice"

// Demo data storage
let demoInvoices: Invoice[] = []
let demoInvoiceCounter = 0

/**
 * Generate a unique invoice number with sequential numbering
 * Format: INV-YYYY-NNN (e.g., INV-2026-001)
 * Uses Firestore transaction for atomic counter increment
 */
export const generateInvoiceNumber = async (): Promise<string> => {
  if (isDemoMode) {
    demoInvoiceCounter++
    return `INV-DEMO-${String(demoInvoiceCounter).padStart(3, "0")}`
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    const year = new Date().getFullYear()
    const counterDoc = doc(db, "invoiceCounters", year.toString())

    return await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterDoc)
      const currentCount = counterSnap.exists() ? counterSnap.data().count : 0
      const newCount = currentCount + 1

      transaction.set(counterDoc, { count: newCount }, { merge: true })

      // Format: INV-2026-001
      return `INV-${year}-${String(newCount).padStart(3, "0")}`
    })
  } catch (error) {
    console.error("Error generating invoice number:", error)
    throw new Error("Failed to generate invoice number")
  }
}

/**
 * Helper to parse createdAt from Firestore doc data
 * Handles both Firestore Timestamp objects and plain ISO strings
 */
const parseCreatedAt = (data: Record<string, unknown>): string => {
  const createdAt = data.createdAt
  if (!createdAt) return new Date().toISOString()
  // Firestore Timestamp
  if (typeof createdAt === "object" && createdAt !== null && "toDate" in createdAt) {
    return (createdAt as { toDate: () => Date }).toDate().toISOString()
  }
  // Already a string
  if (typeof createdAt === "string") return createdAt
  return new Date().toISOString()
}

/**
 * Create a new invoice record in Firestore
 * Automatically generates invoice number and sets creation timestamp
 */
export const createInvoice = async (
  invoiceData: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">
): Promise<Invoice> => {
  const invoiceNumber = await generateInvoiceNumber()
  const createdAt = new Date().toISOString()

  if (isDemoMode) {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `demo-inv-${Date.now()}`,
      invoiceNumber,
      createdAt,
    }
    demoInvoices.unshift(newInvoice)
    return newInvoice
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    const docRef = await addDoc(collection(db, "invoices"), {
      ...invoiceData,
      invoiceNumber,
      createdAt,
    })

    return {
      ...invoiceData,
      id: docRef.id,
      invoiceNumber,
      createdAt,
    }
  } catch (error) {
    console.error("Error creating invoice:", error)
    throw error
  }
}

/**
 * Get all invoices for a specific patient
 * Returns invoices sorted by creation date (newest first)
 */
export const getPatientInvoices = async (patientId: string): Promise<Invoice[]> => {
  if (isDemoMode) {
    return demoInvoices
      .filter((invoice) => invoice.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    // Simple query by patientId only - sort client-side to avoid composite index requirement
    const q = query(
      collection(db, "invoices"),
      where("patientId", "==", patientId)
    )

    const querySnapshot = await getDocs(q)
    const invoices = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: parseCreatedAt(data),
      } as Invoice
    })

    // Sort client-side (newest first)
    return invoices.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch (error) {
    console.error("Error fetching patient invoices:", error)
    return []
  }
}

/**
 * Get a single invoice by ID
 */
export const getInvoiceById = async (invoiceId: string): Promise<Invoice | null> => {
  if (isDemoMode) {
    return demoInvoices.find((invoice) => invoice.id === invoiceId) || null
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    const docSnap = await getDoc(doc(db, "invoices", invoiceId))

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    return {
      id: docSnap.id,
      ...data,
      createdAt: parseCreatedAt(data),
    } as Invoice
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return null
  }
}

/**
 * Get all invoices (for admin/global listing)
 * Returns invoices sorted by creation date (newest first)
 */
export const getAllInvoices = async (): Promise<Invoice[]> => {
  if (isDemoMode) {
    return [...demoInvoices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    const q = query(collection(db, "invoices"))
    const querySnapshot = await getDocs(q)

    const invoices = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: parseCreatedAt(data),
      } as Invoice
    })

    // Sort client-side (newest first)
    return invoices.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch (error) {
    console.error("Error fetching all invoices:", error)
    return []
  }
}

/**
 * Toggle the paid status of an invoice
 */
export const toggleInvoicePaidStatus = async (invoiceId: string, isPaid: boolean): Promise<void> => {
  if (isDemoMode) {
    const invoice = demoInvoices.find((inv) => inv.id === invoiceId)
    if (invoice) {
      invoice.isPaid = isPaid
    }
    return
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    const invoiceRef = doc(db, "invoices", invoiceId)
    await updateDoc(invoiceRef, { isPaid })
  } catch (error) {
    console.error("Error updating invoice paid status:", error)
    throw error
  }
}

/**
 * Delete an invoice
 */
export const deleteInvoice = async (invoiceId: string): Promise<void> => {
  if (isDemoMode) {
    demoInvoices = demoInvoices.filter((inv) => inv.id !== invoiceId)
    return
  }

  if (!db) {
    throw new Error("Firestore not initialized")
  }

  try {
    await deleteDoc(doc(db, "invoices", invoiceId))
  } catch (error) {
    console.error("Error deleting invoice:", error)
    throw error
  }
}
