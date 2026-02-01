"use client"

import { useState, useEffect } from "react"
import type { Invoice } from "@/types/invoice"
import { getAllInvoices, toggleInvoicePaidStatus, deleteInvoice } from "@/lib/invoice-operations"
import { generateInvoicePDF } from "@/lib/pdf-generator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Download,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Search,
  TrendingUp,
  Trash2,
} from "lucide-react"
import { format, parseISO } from "date-fns"

export default function AllInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [togglingPaymentId, setTogglingPaymentId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showPaidOnly, setShowPaidOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadAllInvoices()
  }, [])

  const loadAllInvoices = async () => {
    setLoading(true)
    try {
      const data = await getAllInvoices()
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

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesPaymentFilter = showPaidOnly ? invoice.isPaid : true
    const matchesSearch =
      invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.patientFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesPaymentFilter && matchesSearch
  })

  // Calculate statistics
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const paidRevenue = invoices
    .filter((inv) => inv.isPaid)
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  const unpaidRevenue = totalRevenue - paidRevenue
  const paidCount = invoices.filter((inv) => inv.isPaid).length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">All Invoices</h2>
        <p className="text-sm text-slate-600">Manage and track all patient invoices</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100 mb-1">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-100 mb-1">Paid ({paidCount})</p>
                <p className="text-2xl font-bold">Rs. {paidRevenue.toLocaleString("en-IN")}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-100 mb-1">
                  Unpaid ({invoices.length - paidCount})
                </p>
                <p className="text-2xl font-bold">Rs. {unpaidRevenue.toLocaleString("en-IN")}</p>
              </div>
              <XCircle className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-100 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">Rs. {totalRevenue.toLocaleString("en-IN")}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by patient name or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Paid Filter */}
            <div className="flex items-center gap-2 px-3 h-10 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                Paid Only
              </span>
              <Switch checked={showPaidOnly} onCheckedChange={setShowPaidOnly} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
              </div>
              <p className="text-slate-500 font-medium mb-1">No invoices found</p>
              <p className="text-sm text-slate-400">
                {searchTerm
                  ? "Try adjusting your search or filters"
                  : "Generate invoices from patient details pages"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <Card
              key={invoice.id}
              className="bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <CardContent className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 mb-1">
                        {invoice.invoiceNumber}
                      </div>
                      <div className="text-sm font-medium text-blue-600 mb-1">
                        {invoice.patientFullName}
                      </div>
                      <div className="flex items-center text-xs text-slate-600">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
