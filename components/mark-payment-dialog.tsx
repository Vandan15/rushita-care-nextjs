"use client"

import { useState, useEffect } from "react"
import type { User } from "firebase/auth"
import type { Patient } from "@/types/patient"
import type { Payment } from "@/types/payment"
import { addPayment } from "@/lib/payment-operations"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, ArrowLeft, CheckCircle2, IndianRupee } from "lucide-react"
import { format } from "date-fns"

interface MarkPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: Patient
  user: User
  onPaymentRecorded: (payment: Payment) => void
}

export default function MarkPaymentDialog({
  open,
  onOpenChange,
  patient,
  user,
  onPaymentRecorded,
}: MarkPaymentDialogProps) {
  const [step, setStep] = useState<"form" | "confirm">("form")
  const [amount, setAmount] = useState<string>("")
  const [paidOn, setPaidOn] = useState<Date | null>(null)
  const [note, setNote] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset whenever the dialog opens, default the date to today
  useEffect(() => {
    if (open) {
      setStep("form")
      setAmount("")
      setPaidOn(new Date())
      setNote("")
      setError(null)
      setSaving(false)
    }
  }, [open])

  const parsedAmount = Number.parseFloat(amount)
  const amountIsValid = Number.isFinite(parsedAmount) && parsedAmount > 0
  const canContinue = amountIsValid && paidOn !== null
  const isFutureDate = paidOn ? paidOn > new Date() : false

  const handleConfirm = async () => {
    if (!canContinue || !paidOn) return

    setSaving(true)
    setError(null)
    try {
      // Normalise to start of day so the recorded date matches what the admin picked
      const paidOnDate = new Date(paidOn)
      paidOnDate.setHours(0, 0, 0, 0)

      const payment = await addPayment({
        patientId: patient.id,
        amount: parsedAmount,
        paidOn: paidOnDate.toISOString(),
        note: note.trim() || undefined,
        createdBy: user.uid,
      })

      onPaymentRecorded(payment)
      onOpenChange(false)
    } catch (err) {
      console.error("Error recording payment:", err)
      setError("Failed to record the payment. Please try again.")
      setStep("form")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* bg-white is required — `bg-background` resolves to invalid CSS in this app */}
      <DialogContent className="bg-white w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-base sm:text-lg">
            <IndianRupee className="h-5 w-5 mr-2 text-green-600" />
            {step === "form" ? "Mark Payment as Paid" : "Confirm Payment"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs text-slate-500 mb-0.5">Patient</div>
              <div className="font-semibold text-slate-800">{patient.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">ID: {patient.patientId}</div>
            </div>

            <div>
              <label htmlFor="payment-amount" className="block text-sm font-medium text-slate-700 mb-1.5">
                Amount Paid (₹)
              </label>
              <Input
                id="payment-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="e.g. 3000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white"
              />
              {amount !== "" && !amountIsValid && (
                <p className="mt-1.5 text-xs text-red-500">Enter an amount greater than 0</p>
              )}
            </div>

            <div>
              <label htmlFor="payment-date" className="block text-sm font-medium text-slate-700 mb-1.5">
                Payment Date
              </label>
              <input
                id="payment-date"
                type="date"
                value={paidOn ? format(paidOn, "yyyy-MM-dd") : ""}
                onChange={(e) => setPaidOn(e.target.value ? new Date(e.target.value + "T00:00:00") : null)}
                className="w-full native-date-input"
              />
              {isFutureDate && (
                <p className="mt-1.5 text-xs text-amber-600 flex items-start">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1 mt-0.5 flex-shrink-0" />
                  This date is in the future
                </p>
              )}
            </div>

            <div>
              <label htmlFor="payment-note" className="block text-sm font-medium text-slate-700 mb-1.5">
                Note <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <Textarea
                id="payment-note"
                rows={2}
                placeholder="e.g. Cash, UPI, partial payment"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                disabled={!canContinue}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-slate-700 mb-3">
                Record a payment of{" "}
                <span className="font-bold text-green-700">Rs. {parsedAmount.toLocaleString("en-IN")}</span> from{" "}
                <span className="font-semibold">{patient.name}</span>?
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-semibold text-slate-800">Rs. {parsedAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paid on</span>
                  <span className="font-semibold text-slate-800">
                    {paidOn ? format(paidOn, "EEE, MMM dd, yyyy") : "-"}
                  </span>
                </div>
                {note.trim() && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 flex-shrink-0">Note</span>
                    <span className="font-medium text-slate-800 text-right break-words">{note.trim()}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              This is recorded separately from invoices. You can delete it later from the payment history.
            </p>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("form")} disabled={saving} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Confirm Payment
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
