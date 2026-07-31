import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { backupDataSchema } from '@/lib/validations'
import { ZodError } from 'zod'

/**
 * POST /api/restore
 *
 * Restores data from a backup JSON file.
 * Requires authentication. Only restores data belonging to the authenticated user.
 * Deletes existing data for the user before restoring.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const body = await request.json()
    const validated = backupDataSchema.parse(body)

    // Delete existing data for this user
    await db.invoice.deleteMany({ where: { userId } })
    await db.signing.deleteMany({ where: { userId } })
    await db.expense.deleteMany({ where: { userId } })
    await db.client.deleteMany({ where: { userId } })

    // Restore clients
    const clientIdMap: Record<string, string> = {}
    for (const client of validated.clients) {
      const c = client as Record<string, unknown>
      const oldId = c.id as string
      const newClient = await db.client.create({
        data: {
          userId,
          name: (c.name as string) || 'Unknown',
          email: (c.email as string) || null,
          phone: (c.phone as string) || null,
          company: (c.company as string) || null,
          address: (c.address as string) || null,
          notes: (c.notes as string) || null,
        },
      })
      clientIdMap[oldId] = newClient.id
    }

    // Restore signings
    const signingIdMap: Record<string, string> = {}
    for (const signing of validated.signings) {
      const s = signing as Record<string, unknown>
      const oldId = s.id as string
      const oldClientId = s.clientId as string
      const newClientId = clientIdMap[oldClientId]
      if (!newClientId) continue

      const newSigning = await db.signing.create({
        data: {
          userId,
          clientId: newClientId,
          date: s.date ? new Date(s.date as string) : new Date(),
          time: (s.time as string) || null,
          location: (s.location as string) || 'Unknown',
          serviceType: (s.serviceType as string) || 'General Notary',
          fee: Number(s.fee ?? 0),
          status: (s.status as string) || 'Scheduled',
          notes: (s.notes as string) || null,
          mileage: s.mileage != null ? Number(s.mileage) : null,
        },
      })
      signingIdMap[oldId] = newSigning.id
    }

    // Restore invoices
    let invoiceCount = 0
    for (const invoice of validated.invoices) {
      const inv = invoice as Record<string, unknown>
      const oldClientId = inv.clientId as string
      const newClientId = clientIdMap[oldClientId]
      if (!newClientId) continue

      const oldSigningId = inv.signingId as string | undefined
      const newSigningId = oldSigningId ? signingIdMap[oldSigningId] : undefined

      // Generate a new invoice number to avoid conflicts
      invoiceCount++
      const invoiceNo = `INV-${String(invoiceCount).padStart(4, '0')}`

      await db.invoice.create({
        data: {
          userId,
          invoiceNo,
          clientId: newClientId,
          signingId: newSigningId || undefined,
          amount: Number(inv.amount ?? 0),
          status: (inv.status as string) || 'Unpaid',
          issuedDate: inv.issuedDate ? new Date(inv.issuedDate as string) : new Date(),
          dueDate: inv.dueDate ? new Date(inv.dueDate as string) : null,
          paidDate: inv.paidDate ? new Date(inv.paidDate as string) : null,
          notes: (inv.notes as string) || null,
        },
      })
    }

    // Restore expenses
    for (const expense of validated.expenses) {
      const e = expense as Record<string, unknown>
      await db.expense.create({
        data: {
          userId,
          category: (e.category as string) || 'Miscellaneous',
          description: (e.description as string) || 'Imported expense',
          amount: Number(e.amount ?? 0),
          date: e.date ? new Date(e.date as string) : new Date(),
          receiptUrl: (e.receiptUrl as string) || null,
          notes: (e.notes as string) || null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Backup restored successfully',
      counts: {
        clients: Object.keys(clientIdMap).length,
        signings: Object.keys(signingIdMap).length,
        invoices: invoiceCount,
        expenses: validated.expenses.length,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid backup data format', details: error.issues }, { status: 400 })
    }
    console.error('POST /api/restore error:', error)
    return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 })
  }
}
