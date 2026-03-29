'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'
import { toast } from 'sonner'

interface InvoiceItem {
  description: string
  amount: number
}

interface InvoicePDFProps {
  invoiceNo: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  amount: number
  issuedDate: string
  dueDate?: string
  status: string
  notes?: string
  items?: InvoiceItem[]
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  headerBar: {
    backgroundColor: '#059669',
    padding: 20,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#d1fae5',
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 20,
    fontFamily: 'Helvetica-Bold',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  metaLabel: {
    fontSize: 9,
    color: '#64748b',
    marginRight: 6,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    fontFamily: 'Helvetica-Bold',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold',
  },
  billToBox: {
    backgroundColor: '#f8fafc',
    border: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  clientName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  clientDetail: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  table: {
    border: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    padding: 8,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 8,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 8,
    backgroundColor: '#f8fafc',
  },
  descriptionCol: {
    flex: 3,
    fontSize: 10,
  },
  amountCol: {
    flex: 1,
    fontSize: 10,
    textAlign: 'right' as const,
    fontWeight: 'bold' as const,
    fontFamily: 'Helvetica-Bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: '#059669',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 12,
    fontFamily: 'Helvetica-Bold',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
  },
  notesBox: {
    backgroundColor: '#fffbeb',
    border: 1,
    borderColor: '#fde68a',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  notesText: {
    fontSize: 9,
    color: '#78716c',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    padding: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    fontFamily: 'Helvetica-Bold',
  },
})

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function InvoiceDocument({
  invoiceNo,
  clientName,
  clientEmail,
  clientPhone,
  amount,
  issuedDate,
  dueDate,
  status,
  notes,
  items,
}: InvoicePDFProps) {
  const lineItems: InvoiceItem[] =
    items && items.length > 0
      ? items
      : [{ description: `Notary services - Invoice ${invoiceNo}`, amount }]

  const statusColor =
    status === 'Paid'
      ? { bg: '#d1fae5', text: '#065f46' }
      : status === 'Overdue'
        ? { bg: '#fee2e2', text: '#991b1b' }
        : { bg: '#fef3c7', text: '#92400e' }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>NotaryPro</Text>
          <Text style={styles.headerSubtitle}>Mobile Notary Business Manager</Text>
        </View>

        {/* INVOICE Title + Status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor.bg, color: statusColor.text },
            ]}
          >
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: statusColor.text }}>
              {status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Meta Info */}
        <View style={styles.metaRow}>
          <View style={{ marginRight: 24 }}>
            <Text style={styles.metaLabel}>Invoice #</Text>
            <Text style={styles.metaValue}>{invoiceNo}</Text>
          </View>
          <View style={{ marginRight: 24 }}>
            <Text style={styles.metaLabel}>Issued Date</Text>
            <Text style={styles.metaValue}>{formatDate(issuedDate)}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{dueDate ? formatDate(dueDate) : 'Due on Receipt'}</Text>
          </View>
        </View>

        {/* Bill To */}
        <Text style={styles.sectionTitle}>Bill To</Text>
        <View style={styles.billToBox}>
          <Text style={styles.clientName}>{clientName}</Text>
          {clientEmail && <Text style={styles.clientDetail}>{clientEmail}</Text>}
          {clientPhone && <Text style={styles.clientDetail}>{clientPhone}</Text>}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 3 }]}>Description</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Amount</Text>
          </View>
          {lineItems.map((item, idx) => (
            <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.descriptionCol}>{item.description}</Text>
              <Text style={styles.amountCol}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(amount)}</Text>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
          <Text style={styles.footerText}>Powered by NotaryPro</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateInvoiceBlob(props: InvoicePDFProps): Promise<Blob> {
  const blob = await pdf(<InvoiceDocument {...props} />).toBlob()
  return blob
}

export function InvoicePDFButton(props: InvoicePDFProps) {
  const [generating, setGenerating] = React.useState(false)

  const handleDownload = async () => {
    setGenerating(true)
    try {
      const blob = await generateInvoiceBlob(props)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${props.invoiceNo || 'invoice'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded successfully')
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  const handlePrint = async () => {
    setGenerating(true)
    try {
      const blob = await generateInvoiceBlob(props)
      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
      toast.success('Opening print dialog...')
    } catch {
      toast.error('Failed to generate PDF for printing')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={generating}
        className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Download PDF</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={generating}
        className="gap-1.5 text-slate-700 hover:bg-slate-50"
      >
        <Printer className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Print</span>
      </Button>
    </div>
  )
}
