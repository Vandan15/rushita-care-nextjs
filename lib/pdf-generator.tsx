import type { Invoice } from "@/types/invoice"

/**
 * Generate and download a PDF invoice
 * Creates a blob from the PDF document and triggers browser download
 */
export const generateInvoicePDF = async (invoice: Invoice): Promise<void> => {
  try {
    // Dynamically import to avoid SSR issues with @react-pdf/renderer
    const { pdf } = await import("@react-pdf/renderer")
    const { default: InvoicePDFTemplate } = await import("@/components/invoice-pdf-template")

    // Generate PDF blob from React component
    const blob = await pdf(<InvoicePDFTemplate invoice={invoice} />).toBlob()

    // Create a download URL
    const url = URL.createObjectURL(blob)

    // Create a temporary link element and trigger download
    const link = document.createElement("a")
    link.href = url

    // Format filename: Invoice_PatientName_INV-2026-001.pdf
    const sanitizedPatientName = invoice.patientName.replace(/[^a-z0-9]/gi, "_")
    link.download = `Invoice_${sanitizedPatientName}_${invoice.invoiceNumber}.pdf`

    // Trigger download
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF invoice")
  }
}

/**
 * Preview a PDF invoice in a new tab/window (optional feature)
 * Opens the PDF in the browser instead of downloading
 */
export const previewInvoicePDF = async (invoice: Invoice): Promise<void> => {
  try {
    // Dynamically import to avoid SSR issues with @react-pdf/renderer
    const { pdf } = await import("@react-pdf/renderer")
    const { default: InvoicePDFTemplate } = await import("@/components/invoice-pdf-template")

    // Generate PDF blob from React component
    const blob = await pdf(<InvoicePDFTemplate invoice={invoice} />).toBlob()

    // Create a URL for the blob
    const url = URL.createObjectURL(blob)

    // Open in new window
    window.open(url, "_blank")

    // Note: URL will be revoked when the window is closed
    // In a production app, you might want to handle cleanup differently
  } catch (error) {
    console.error("Error previewing PDF:", error)
    throw new Error("Failed to preview PDF invoice")
  }
}
