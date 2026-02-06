import React from "react"
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import type { Invoice } from "@/types/invoice"
import { format, parseISO } from "date-fns"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },

  // Professional header - no background colors
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#1e293b",
    borderBottomStyle: "solid",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 8,
  },
  headerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  therapistName: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "bold",
  },
  therapistRegistration: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  therapistAddress: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
    maxWidth: 200,
  },

  // Invoice metadata
  metadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "solid",
    borderRadius: 4,
  },
  metadataItem: {
    flexDirection: "column",
  },
  metadataLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metadataValue: {
    fontSize: 11,
    color: "#1e293b",
    fontWeight: "bold",
  },

  // Section styles
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
  },

  // Patient info
  patientInfo: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "solid",
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  infoLabel: {
    width: 80,
    fontSize: 9,
    color: "#64748b",
    fontWeight: "bold",
  },
  infoValue: {
    flex: 1,
    fontSize: 10,
    color: "#1e293b",
  },

  // Invoice table (No, Description, Amount)
  table: {
    marginTop: 8,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#1e293b",
    borderBottomStyle: "solid",
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderCell: {
    color: "#1e293b",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
  },
  tableCell: {
    fontSize: 10,
    color: "#334155",
  },
  colNo: {
    width: "10%",
  },
  colDesc: {
    width: "60%",
  },
  colAmount: {
    width: "30%",
    textAlign: "right",
  },

  // Summary / Total
  summarySection: {
    marginTop: 15,
    alignItems: "flex-end",
  },
  summaryTable: {
    width: "50%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 10,
    color: "#1e293b",
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: "#1e293b",
    borderTopStyle: "solid",
  },
  totalLabel: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "bold",
  },

  // Signature
  signatureSection: {
    marginTop: 50,
    alignItems: "flex-end",
  },
  signatureBlock: {
    width: 200,
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    borderBottomStyle: "solid",
    marginBottom: 6,
    height: 40,
  },
  signatureName: {
    fontSize: 10,
    color: "#1e293b",
    fontWeight: "bold",
    textAlign: "center",
  },
  signatureLabel: {
    fontSize: 8,
    color: "#64748b",
    textAlign: "center",
    marginTop: 2,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    borderTopStyle: "solid",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },

  // Page 2: Session records
  sessionPageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sessionTableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#1e293b",
    borderBottomStyle: "solid",
    paddingBottom: 6,
    marginBottom: 4,
  },
  sessionTableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    borderBottomStyle: "solid",
  },
  sessionTableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  sessionColNo: {
    width: "15%",
  },
  sessionColDate: {
    width: "85%",
  },
})

interface InvoicePDFTemplateProps {
  invoice: Invoice
}

const InvoicePDFTemplate: React.FC<InvoicePDFTemplateProps> = ({ invoice }) => {
  const formatCurrency = (amount: number): string => {
    return `Rs. ${amount.toLocaleString("en-IN")}`
  }

  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), "EEE, dd MMM yyyy")
    } catch {
      return dateString
    }
  }

  return (
    <Document>
      {/* Page 1: Invoice Summary */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Invoice</Text>
          <Text style={styles.subtitle}>Physiotherapy Services</Text>
          <View style={styles.headerInfo}>
            <View style={styles.headerLeft}>
              <Text style={styles.therapistName}>{invoice.therapistName}</Text>
              {invoice.therapistRegistrationNumber && (
                <Text style={styles.therapistRegistration}>
                  Reg. No: {invoice.therapistRegistrationNumber}
                </Text>
              )}
              {invoice.therapistAddress && (
                <Text style={styles.therapistAddress}>
                  {invoice.therapistAddress}
                </Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.metadataLabel}>Invoice No.</Text>
              <Text style={styles.metadataValue}>{invoice.invoiceNumber}</Text>
            </View>
          </View>
        </View>

        {/* Invoice Metadata */}
        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Invoice Date</Text>
            <Text style={styles.metadataValue}>
              {format(parseISO(invoice.createdAt), "dd MMM yyyy")}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Billing Period</Text>
            <Text style={styles.metadataValue}>
              {format(parseISO(invoice.dateRange.startDate), "dd MMM")} -{" "}
              {format(parseISO(invoice.dateRange.endDate), "dd MMM yyyy")}
            </Text>
          </View>
        </View>

        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.patientInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{invoice.patientFullName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact:</Text>
              <Text style={styles.infoValue}>{invoice.patientContact}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{invoice.patientAddress}</Text>
            </View>
          </View>
        </View>

        {/* Invoice Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colNo]}>No.</Text>
              <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
            </View>

            {/* Row: Physiotherapy Sessions */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colNo]}>1</Text>
              <Text style={[styles.tableCell, styles.colDesc]}>
                Physiotherapy Sessions ({invoice.presentSessions} sessions @ {formatCurrency(invoice.perSessionRate)} per session)
              </Text>
              <Text style={[styles.tableCell, styles.colAmount, { fontWeight: "bold" }]}>
                {formatCurrency(invoice.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Total */}
        <View style={styles.summarySection}>
          <View style={styles.summaryTable}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(invoice.totalAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{invoice.therapistName}</Text>
            <Text style={styles.signatureLabel}>Authorized Signatory</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {format(new Date(), "PPP")} | This is a computer-generated invoice
          </Text>
        </View>
      </Page>

      {/* Page 2: Session Records */}
      <Page size="A4" style={styles.page}>
        {/* Header for page 2 */}
        <View style={styles.header}>
          <Text style={styles.title}>Session Records</Text>
          <Text style={styles.subtitle}>
            {invoice.patientFullName} | {invoice.invoiceNumber}
          </Text>
          <View style={styles.headerInfo}>
            <View style={styles.headerLeft}>
              <Text style={{ fontSize: 9, color: "#64748b" }}>
                Period: {format(parseISO(invoice.dateRange.startDate), "dd MMM yyyy")} - {format(parseISO(invoice.dateRange.endDate), "dd MMM yyyy")}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={{ fontSize: 9, color: "#64748b" }}>
                Total Attended: {invoice.presentSessions} sessions
              </Text>
            </View>
          </View>
        </View>

        {/* Session Table */}
        <View style={styles.table}>
          <View style={styles.sessionTableHeader}>
            <Text style={[styles.tableHeaderCell, styles.sessionColNo]}>S. No.</Text>
            <Text style={[styles.tableHeaderCell, styles.sessionColDate]}>Date</Text>
          </View>

          {invoice.sessions.map((session, index) => (
            <View
              key={index}
              style={
                index % 2 === 1
                  ? [styles.sessionTableRow, styles.sessionTableRowAlt]
                  : styles.sessionTableRow
              }
            >
              <Text style={[styles.tableCell, styles.sessionColNo]}>{index + 1}</Text>
              <Text style={[styles.tableCell, styles.sessionColDate]}>
                {formatDate(session.date)}
              </Text>
            </View>
          ))}
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{invoice.therapistName}</Text>
            <Text style={styles.signatureLabel}>Authorized Signatory</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Page 2 of 2 | {invoice.invoiceNumber} | {invoice.patientFullName}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default InvoicePDFTemplate
