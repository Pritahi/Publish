import { NextRequest, NextResponse } from 'next/server'
import { getDb, toSnakeCaseObj } from '@/lib/db'
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

    const db = getDb()

    // ── Delete existing data for this user (in dependency order) ──
    await db.from('invoices').delete().eq('user_id', userId)
    await db.from('signings').delete().eq('user_id', userId)
    await db.from('expenses').delete().eq('user_id', userId)
    await db.from('clients').delete().eq('user_id', userId)

    // ── Restore clients one by one (need to map old IDs to new IDs) ──
    const clientIdMap: Record<string, string> = {}
    for (const client of validated.clients) {
      const c = client as Record<string, unknown>
      const oldId = c.id as string

      const insertData = toSnakeCaseObj({
        userId,
        name: (c.name as string) || 'Unknown',
        email: (c.email as string) || null,
        phone: (c.phone as string) || null,
        company: (c.company as string) || null,
        address: (c.address as string) || null,
        notes: (c.notes as string) || null,
      })

      const res = await db.from('clients').insert(insertData).select('id').single()
      if (res.error || !res.data) {
        console.error('Restore: client insert error:', res.error)
        continue
      }
      clientIdMap[oldId] = (res.data as Record<string, unknown>).id as string
    }

    // ── Restore signings with mapped client IDs ──
    const signingIdMap: Record<string, string> = {}
    for (const signing of validated.signings) {
      const s = signing as Record<string, unknown>
      const oldId = s.id as string
      const oldClientId = s.clientId as string
      const newClientId = clientIdMap[oldClientId]
      if (!newClientId) continue

      const insertData = toSnakeCaseObj({
        userId,
        clientId: newClientId,
        date: s.date ? new Date(s.date as string).toISOString() : new Date().toISOString(),
        time: (s.time as string) || null,
        location: (s.location as string) || 'Unknown',
        serviceType: (s.serviceType as string) || 'General Notary',
        fee: Number(s.fee ?? 0),
        status: (s.status as string) || 'Scheduled',
        notes: (s.notes as string) || null,
        mileage: s.mileage != null ? Number(s.mileage) : null,
      })

      const res = await db.from('signings').insert(insertData).select('id').single()
      if (res.error || !res.data) {
        console.error('Restore: signing insert error:', res.error)
        continue
      }
      signingIdMap[oldId] = (res.data as Record<string, unknown>).id as string
    }

    // ── Restore invoices with mapped client/signing IDs ──
    let invoiceCount = 0
    for (const invoice of validated.invoices) {
      const inv = invoice as Record<string, unknown>
      const oldClientId = inv.clientId as string
      const newClientId = clientIdMap[oldClientId]
      if (!newClientId) continue

      const oldSigningId = inv.signingId as string | undefined
      const newSigningId = oldSigningId ? signingIdMap[oldSigningId] : undefined

      // Generate a new invoice number — try RPC first, fall back to counter
      invoiceCount++
      let invoiceNo = `INV-${String(invoiceCount).padStart(4, '0')}`

      try {
        const rpcRes = await db.rpc('get_next_invoice_no', { p_user_id: userId })
        if (!rpcRes.error && rpcRes.data) {
          invoiceNo = String(rpcRes.data)
        }
      } catch {
        // RPC not available — use the counter-based invoice number
      }

      const insertData = toSnakeCaseObj({
        userId,
        invoiceNo,
        clientId: newClientId,
        signingId: newSigningId || null,
        amount: Number(inv.amount ?? 0),
        status: (inv.status as string) || 'Unpaid',
        issuedDate: inv.issuedDate ? new Date(inv.issuedDate as string).toISOString() : new Date().toISOString(),
        dueDate: inv.dueDate ? new Date(inv.dueDate as string).toISOString() : null,
        paidDate: inv.paidDate ? new Date(inv.paidDate as string).toISOString() : null,
        notes: (inv.notes as string) || null,
      })

      const res = await db.from('invoices').insert(insertData).select('id').single()
      if (res.error) {
        console.error('Restore: invoice insert error:', res.error)
        continue
      }
    }

    // ── Restore expenses ──
    for (const expense of validated.expenses) {
      const e = expense as Record<string, unknown>

      const insertData = toSnakeCaseObj({
        userId,
        category: (e.category as string) || 'Miscellaneous',
        description: (e.description as string) || 'Imported expense',
        amount: Number(e.amount ?? 0),
        date: e.date ? new Date(e.date as string).toISOString() : new Date().toISOString(),
        receiptUrl: (e.receiptUrl as string) || null,
        notes: (e.notes as string) || null,
      })

      const res = await db.from('expenses').insert(insertData).select('id').single()
      if (res.error) {
        console.error('Restore: expense insert error:', res.error)
        continue
      }
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
