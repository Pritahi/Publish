import { z } from 'zod'

// ── Client Schemas ──
export const clientCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
})

export const clientUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')).optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
})

// ── Signing Schemas ──
export const signingCreateSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  location: z.string().min(1, 'Location is required').max(500),
  serviceType: z.string().max(100).optional(),
  fee: z.coerce.number().min(0).optional(),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled', 'No-Show']).optional(),
  notes: z.string().max(2000).optional(),
  mileage: z.coerce.number().min(0).optional(),
})

export const signingUpdateSchema = z.object({
  clientId: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  time: z.string().optional(),
  location: z.string().max(500).optional(),
  serviceType: z.string().max(100).optional(),
  fee: z.coerce.number().min(0).optional(),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled', 'No-Show']).optional(),
  notes: z.string().max(2000).optional(),
  mileage: z.coerce.number().min(0).optional(),
})

// ── Invoice Schemas ──
export const invoiceCreateSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  signingId: z.string().optional(),
  amount: z.coerce.number().min(0, 'Amount must be non-negative'),
  dueDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
})

export const invoiceUpdateSchema = z.object({
  clientId: z.string().min(1).optional(),
  signingId: z.string().optional(),
  amount: z.coerce.number().min(0).optional(),
  status: z.enum(['Unpaid', 'Paid', 'Overdue', 'Cancelled']).optional(),
  dueDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
})

// ── Expense Schemas ──
export const expenseCreateSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  amount: z.coerce.number().min(0, 'Amount must be non-negative'),
  date: z.string().min(1, 'Date is required'),
  receiptUrl: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
})

export const expenseUpdateSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  amount: z.coerce.number().min(0).optional(),
  date: z.string().min(1).optional(),
  receiptUrl: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
})

// ── Journal Entry Schemas ──
export const journalEntryCreateSchema = z.object({
  signerName: z.string().min(1, 'Signer name is required').max(200),
  idType: z.string().max(100).optional(),
  idNumber: z.string().max(100).optional(),
  idExpiry: z.string().optional(),
  documentType: z.string().max(200).optional(),
  documentDescription: z.string().max(500).optional(),
  pageCount: z.coerce.number().int().min(0).optional(),
  fee: z.coerce.number().min(0).optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  state: z.string().max(100).optional(),
  county: z.string().max(100).optional(),
  notaryActType: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  signatureDataUrl: z.string().optional(),
})

export const journalEntryUpdateSchema = z.object({
  signerName: z.string().min(1).max(200).optional(),
  idType: z.string().max(100).optional(),
  idNumber: z.string().max(100).optional(),
  idExpiry: z.string().optional(),
  documentType: z.string().max(200).optional(),
  documentDescription: z.string().max(500).optional(),
  pageCount: z.coerce.number().int().min(0).optional(),
  fee: z.coerce.number().min(0).optional(),
  date: z.string().min(1).optional(),
  time: z.string().optional(),
  state: z.string().max(100).optional(),
  county: z.string().max(100).optional(),
  notaryActType: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  signatureDataUrl: z.string().optional(),
})

// ── Settings Schema ──
export const settingsSchema = z.object({
  businessName: z.string().max(200).optional(),
  commissionNumber: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal('')).optional(),
  commissionExpiry: z.string().optional(),
  telegramEnabled: z.boolean().optional(),
  telegramChatId: z.string().max(100).optional(),
  telegramBotToken: z.string().max(200).optional(),
  telegramUseCustomBot: z.boolean().optional(),
  notifNewSigning: z.boolean().optional(),
  notifSigningCompleted: z.boolean().optional(),
  notifSigningCancelled: z.boolean().optional(),
  notifSigningReminder: z.boolean().optional(),
  notifInvoiceCreated: z.boolean().optional(),
  notifInvoicePaid: z.boolean().optional(),
  notifInvoiceOverdue: z.boolean().optional(),
  notifExpenseAdded: z.boolean().optional(),
  notifWeeklySummary: z.boolean().optional(),
})

// ── Pagination Schema ──
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

// ── Backup Restore Schema ──
export const backupDataSchema = z.object({
  clients: z.array(z.record(z.string(), z.unknown())),
  signings: z.array(z.record(z.string(), z.unknown())),
  invoices: z.array(z.record(z.string(), z.unknown())),
  expenses: z.array(z.record(z.string(), z.unknown())),
  exportDate: z.string().optional(),
})

// ── Register Schema (already exists, re-exporting) ──
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
