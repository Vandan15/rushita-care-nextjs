"use client"

import { useState, useEffect } from "react"
import type { Payment } from "@/types/payment"
import { getPatientPayments, deletePayment, getTotalPaid } from "@/lib/payment-operations"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2, IndianRupee, Trash2, Wallet } from "lucide-react"
import { format, parseISO } from "date-fns"

interface PaymentHistoryProps {
  patientId: string
  newPayment?: Payment | null
}

export default function PaymentHistory({ patientId, newPayment }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadPayments()
  }, [patientId])

  // Immediately add a newly recorded payment to the list
  useEffect(() => {
    if (newPayment && !payments.some((payment) => payment.id === newPayment.id)) {
      setPayments((prev) =>
        [newPayment, ...prev].sort((a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime())
      )
    }
  }, [newPayment])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const data = await getPatientPayments(patientId)
      setPayments(data)
    } catch (error) {
      console.error("Error loading payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (paymentId: string) => {
    if (!window.confirm("Delete this payment record? This action cannot be undone.")) return
    setDeletingId(paymentId)
    try {
      await deletePayment(paymentId)
      setPayments((prev) => prev.filter((payment) => payment.id !== paymentId))
    } catch (error) {
      console.error("Error deleting payment:", error)
      alert("Failed to delete the payment. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg animate-pulse">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-3 bg-slate-200 rounded w-40"></div>
            </div>
            <div className="h-9 w-9 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <Wallet className="h-8 w-8 text-slate-400" />
          </div>
        </div>
        <p className="text-slate-500 font-medium mb-1">No payments recorded yet</p>
        <p className="text-sm text-slate-400">Use &quot;Mark as Paid&quot; to record a payment for this patient</p>
      </div>
    )
  }

  const totalPaid = getTotalPaid(payments)

  return (
    <div className="space-y-3">
      {/* Total received */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
            <IndianRupee className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Received</div>
            <div className="font-bold text-green-700 text-lg">Rs. {totalPaid.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
          {payments.length} payment{payments.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-start justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-green-300 hover:shadow-md transition-all"
        >
          <div className="flex items-start space-x-3 min-w-0">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-800 mb-1">Rs. {payment.amount.toLocaleString("en-IN")}</div>
              <div className="flex items-center text-xs text-slate-600">
                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                {format(parseISO(payment.paidOn), "EEE, MMM dd, yyyy")}
              </div>
              {payment.note && <div className="text-xs text-slate-500 mt-1 break-words">{payment.note}</div>}
            </div>
          </div>

          <Button
            onClick={() => handleDelete(payment.id)}
            disabled={deletingId === payment.id}
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 flex-shrink-0 ml-2"
          >
            {deletingId === payment.id ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="sr-only">Delete payment</span>
          </Button>
        </div>
      ))}
    </div>
  )
}
