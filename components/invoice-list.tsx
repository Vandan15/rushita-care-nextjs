"use client"

import { useState, useEffect } from "react"
import type { Invoice } from "@/types/invoice"
import { getPatientInvoices, toggleInvoicePaidStatus, deleteInvoice } from "@/lib/invoice-operations"
import { generateInvoicePDF } from "@/lib/pdf-generator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Download, FileText, Calendar, CheckCircle2, XCircle, Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"

interface InvoiceListProps {
  patientId: string
  newInvoice?: Invoice | null
}

export default function InvoiceList({ patientId, newInvoice }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [togglingPaymentId, setTogglingPaymentId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadInvoices()
  }, [patientId])

  // Immediately add newly created invoice to the list
  useEffect(() => {
    if (newInvoice && !invoices.some((inv) => inv.id === newInvoice.id)) {
      setInvoices((prev) => [newInvoice, ...prev])
    }
  }, [newInvoice])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const data = await getPatientInvoices(patientId)
      setInvoices(data)
    } catch (error) {
      console.error("Error loading invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (invoice: Invoice) => {
    setDownloadingId(invoice.id)
    try {
      await generateInvoicePDF(invoice)
    } catch (error) {
      console.error("Error downloading invoice:", error)
      alert("Failed to download invoice. Please try again.")
    } finally {
      setDownloadingId(null)
    }
  }

  const handleTogglePaid = async (invoiceId: string, newPaidStatus: boolean) => {
    setTogglingPaymentId(invoiceId)
    // Optimistically update local state first
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, isPaid: newPaidStatus } : inv))
    )
    try {
      await toggleInvoicePaidStatus(invoiceId, newPaidStatus)
    } catch (error) {
      console.error("Error toggling payment status:", error)
      // Revert on failure
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? { ...inv, isPaid: !newPaidStatus } : inv))
      )
      alert("Failed to update payment status. Please try again.")
    } finally {
      setTogglingPaymentId(null)
    }
  }

  const handleDelete = async (invoiceId: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) return
    setDeletingId(invoiceId)
    try {
      await deleteInvoice(invoiceId)
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId))
    } catch (error) {
      console.error("Error deleting invoice:", error)
      alert("Failed to delete invoice. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg animate-pulse"
          >
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-32"></div>
              <div className="h-3 bg-slate-200 rounded w-48"></div>
              <div className="h-3 bg-slate-200 rounded w-24"></div>
            </div>
            <div className="h-9 w-24 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
        </div>
        <p className="text-slate-500 font-medium mb-1">No invoices generated yet</p>
        <p className="text-sm text-slate-400">
          Click the "Generate Invoice" button to create your first invoice
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-col p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              {/* Header Row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 mb-1">{invoice.invoiceNumber}</div>
                    <div className="flex items-center text-xs text-slate-600 mb-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(parseISO(invoice.dateRange.startDate), "MMM dd")} -{" "}
                      {format(parseISO(invoice.dateRange.endDate), "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>

                {/* Payment Status Badge */}
                <Badge
                  variant={invoice.isPaid ? "default" : "secondary"}
                  className={
                    invoice.isPaid
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  }
                >
                  {invoice.isPaid ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Paid
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Unpaid
                    </>
                  )}
                </Badge>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">Sessions</div>
                  <div className="font-semibold text-slate-800">{invoice.presentSessions}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">Rate/Session</div>
                  <div className="font-semibold text-slate-800">
                    Rs. {invoice.perSessionRate.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <div className="text-xs text-slate-500 mb-0.5">Total Amount</div>
                  <div className="font-bold text-green-600 text-lg">
                    Rs. {invoice.totalAmount.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-600">
                    {invoice.isPaid ? "Paid" : "Mark as Paid"}
                  </span>
                  <Switch
                    checked={invoice.isPaid}
                    onCheckedChange={(checked) => handleTogglePaid(invoice.id, checked)}
                    disabled={togglingPaymentId === invoice.id}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleDelete(invoice.id)}
                    disabled={deletingId === invoice.id}
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {deletingId === invoice.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={() => handleDownload(invoice)}
                    disabled={downloadingId === invoice.id}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {downloadingId === invoice.id ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
      ))}
    </div>
  )
}
