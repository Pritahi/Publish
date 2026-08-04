import { NextRequest, NextResponse } from 'next/server'
import { getDb, toSnakeCaseObj } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-guard'

/**
 * Seed Endpoint — Admin Only
 *
 * This endpoint DELETES ALL existing data and replaces it with demo data.
 * Requires admin authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult instanceof NextResponse) return authResult

    const userId = authResult.userId
    const db = getDb()

    // ── Clean seed — delete everything first (except the admin user) ──
    // Must delete in dependency order: invoices → signings → expenses → journal_entries → settings → clients
    await db.from('invoices').delete().neq('id', '')
    await db.from('signings').delete().neq('id', '')
    await db.from('expenses').delete().neq('id', '')
    await db.from('journal_entries').delete().neq('id', '')
    await db.from('settings').delete().neq('id', '')
    await db.from('clients').delete().neq('id', '')

    // ─── Clients (8) ───
    const clientsData = [
      {
        userId,
        name: 'Maria Gonzalez',
        email: 'maria.gonzalez@email.com',
        phone: '(305) 555-0142',
        company: 'Gonzalez & Associates LLC',
        address: '1240 Brickell Ave, Miami, FL 33131',
        notes: 'Prefers afternoon appointments. Bilingual (English/Spanish).',
      },
      {
        userId,
        name: 'James Carter',
        email: 'jcarter@homemail.net',
        phone: '(770) 555-0198',
        address: '890 Peachtree St NE, Atlanta, GA 30308',
        notes: 'First-time homebuyer closing.',
      },
      {
        userId,
        name: 'Pacific Coast Title Agency',
        email: 'closings@pacificcoasttitle.com',
        phone: '(310) 555-0267',
        company: 'Pacific Coast Title Agency',
        address: '4500 Wilshire Blvd, Los Angeles, CA 90010',
      },
      {
        userId,
        name: 'Sarah Mitchell',
        email: 'sarah.m@workemail.com',
        phone: '(214) 555-0331',
        company: 'Mitchell Financial Group',
        address: '2200 Ross Ave, Dallas, TX 75201',
        notes: 'Loan signing specialist. Requires dual-signer appointments.',
      },
      {
        userId,
        name: 'Robert Kim',
        email: 'robert.kim@email.com',
        phone: '(206) 555-0478',
        address: '400 Broad St, Seattle, WA 98109',
      },
      {
        userId,
        name: 'Sunrise Real Estate Group',
        email: 'notary@sunriserealty.com',
        phone: '(602) 555-0512',
        company: 'Sunrise Real Estate Group',
        address: '3030 N 3rd St, Phoenix, AZ 85012',
        notes: 'Volume account - 5-10 signings per month.',
      },
      {
        userId,
        name: 'Linda Patterson',
        email: 'lpatterson@lawfirm.com',
        phone: '(312) 555-0645',
        company: 'Patterson & Holmes Law Offices',
        address: '233 S Wacker Dr, Chicago, IL 60606',
        notes: 'Estate planning documents. Requires witness.',
      },
      {
        userId,
        name: 'David Chen',
        email: 'dchen@techcorp.io',
        phone: '(408) 555-0789',
        company: 'NovaTech Solutions Inc.',
        address: '100 Tech Way, San Jose, CA 95110',
        notes: 'I-9 verifications for new employees.',
      },
    ]

    // Insert clients — convert each to snake_case and insert with .select() to get IDs back
    const snakeClients = clientsData.map((c) => toSnakeCaseObj(c))
    const clientsRes = await db.from('clients').insert(snakeClients).select()
    if (clientsRes.error) {
      console.error('Seed: client insert error:', clientsRes.error)
      return NextResponse.json({ error: 'Failed to seed clients' }, { status: 500 })
    }
    const allClients = clientsRes.data as Record<string, unknown>[]

    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth(), 1)

    // ─── Signings (15) across last 3 months ───
    const signingsData = [
      // 3 months ago (5 signings)
      {
        userId,
        clientId: allClients[0].id,
        date: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 3).toISOString(),
        time: '10:00',
        location: '1240 Brickell Ave, Miami, FL 33131',
        serviceType: 'Real Estate Closing',
        fee: 250,
        status: 'Completed',
        notes: 'Property deed transfer for commercial property.',
        mileage: 18,
      },
      {
        userId,
        clientId: allClients[1].id,
        date: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 7).toISOString(),
        time: '14:00',
        location: '890 Peachtree St NE, Atlanta, GA 30308',
        serviceType: 'General Notary',
        fee: 35,
        status: 'Completed',
        mileage: 22,
      },
      {
        userId,
        clientId: allClients[2].id,
        date: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 12).toISOString(),
        time: '09:00',
        location: '4500 Wilshire Blvd, Los Angeles, CA 90010',
        serviceType: 'Loan Signing',
        fee: 175,
        status: 'Completed',
        notes: 'FHA loan closing package.',
        mileage: 30,
      },
      {
        userId,
        clientId: allClients[5].id,
        date: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 18).toISOString(),
        time: '11:30',
        location: '3030 N 3rd St, Phoenix, AZ 85012',
        serviceType: 'Real Estate Closing',
        fee: 200,
        status: 'Completed',
        mileage: 15,
      },
      {
        userId,
        clientId: allClients[3].id,
        date: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 25).toISOString(),
        time: '15:00',
        location: '2200 Ross Ave, Dallas, TX 75201',
        serviceType: 'Loan Signing',
        fee: 175,
        status: 'Cancelled',
        notes: 'Client cancelled - loan fell through.',
        mileage: null,
      },
      // 2 months ago (5 signings)
      {
        userId,
        clientId: allClients[4].id,
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 2).toISOString(),
        time: '13:00',
        location: '400 Broad St, Seattle, WA 98109',
        serviceType: 'Power of Attorney',
        fee: 75,
        status: 'Completed',
        mileage: 12,
      },
      {
        userId,
        clientId: allClients[6].id,
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 8).toISOString(),
        time: '10:00',
        location: '233 S Wacker Dr, Chicago, IL 60606',
        serviceType: 'Affidavit',
        fee: 50,
        status: 'Completed',
        mileage: 25,
      },
      {
        userId,
        clientId: allClients[0].id,
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 14).toISOString(),
        time: '16:00',
        location: '55 SW 1st St, Miami, FL 33130',
        serviceType: 'General Notary',
        fee: 40,
        status: 'Completed',
        mileage: 8,
      },
      {
        userId,
        clientId: allClients[7].id,
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 19).toISOString(),
        time: '09:00',
        location: '100 Tech Way, San Jose, CA 95110',
        serviceType: 'I-9 Verification',
        fee: 45,
        status: 'Completed',
        notes: 'New hire verification - 3 employees.',
        mileage: 35,
      },
      {
        userId,
        clientId: allClients[5].id,
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 24).toISOString(),
        time: '14:30',
        location: '1200 E Missouri Ave, Phoenix, AZ 85014',
        serviceType: 'Loan Signing',
        fee: 175,
        status: 'Completed',
        mileage: 20,
      },
      // Current month (5 signings)
      {
        userId,
        clientId: allClients[2].id,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 2).toISOString(),
        time: '11:00',
        location: '6801 Hollywood Blvd, Los Angeles, CA 90028',
        serviceType: 'Real Estate Closing',
        fee: 225,
        status: 'Completed',
        mileage: 28,
      },
      {
        userId,
        clientId: allClients[1].id,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 5).toISOString(),
        time: '15:00',
        location: '50 Hurt Plaza SE, Atlanta, GA 30303',
        serviceType: 'Loan Signing',
        fee: 175,
        status: 'Completed',
        mileage: 10,
      },
      {
        userId,
        clientId: allClients[6].id,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 10).toISOString(),
        time: '10:30',
        location: '233 S Wacker Dr, Chicago, IL 60606',
        serviceType: 'Power of Attorney',
        fee: 75,
        status: 'Scheduled',
        notes: 'Durable POA for healthcare directive.',
        mileage: null,
      },
      {
        userId,
        clientId: allClients[4].id,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 15).toISOString(),
        time: '13:00',
        location: '200 2nd Ave S, Seattle, WA 98104',
        serviceType: 'Affidavit',
        fee: 50,
        status: 'Scheduled',
        mileage: null,
      },
      {
        userId,
        clientId: allClients[3].id,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 20).toISOString(),
        time: '09:00',
        location: '2200 Ross Ave, Dallas, TX 75201',
        serviceType: 'Loan Signing',
        fee: 175,
        status: 'Scheduled',
        notes: 'Refinance loan package - 120 pages.',
        mileage: null,
      },
    ]

    const snakeSignings = signingsData.map((s) => toSnakeCaseObj(s))
    const signingsRes = await db.from('signings').insert(snakeSignings).select()
    if (signingsRes.error) {
      console.error('Seed: signing insert error:', signingsRes.error)
      return NextResponse.json({ error: 'Failed to seed signings' }, { status: 500 })
    }
    const allSignings = signingsRes.data as Record<string, unknown>[]

    // ─── Invoices (12) ───
    const invoicesData = [
      {
        userId,
        invoiceNo: 'INV-0001',
        clientId: allClients[0].id,
        signingId: allSignings[0].id,
        amount: 250,
        status: 'Paid',
        issuedDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 4).toISOString(),
        dueDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 4).toISOString(),
        paidDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 20).toISOString(),
        notes: 'Real estate closing - commercial property.',
      },
      {
        userId,
        invoiceNo: 'INV-0002',
        clientId: allClients[1].id,
        signingId: allSignings[1].id,
        amount: 35,
        status: 'Paid',
        issuedDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 8).toISOString(),
        dueDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 8).toISOString(),
        paidDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 22).toISOString(),
      },
      {
        userId,
        invoiceNo: 'INV-0003',
        clientId: allClients[2].id,
        signingId: allSignings[2].id,
        amount: 175,
        status: 'Paid',
        issuedDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 13).toISOString(),
        dueDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 13).toISOString(),
        paidDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 1).toISOString(),
        notes: 'FHA loan closing.',
      },
      {
        userId,
        invoiceNo: 'INV-0004',
        clientId: allClients[5].id,
        signingId: allSignings[3].id,
        amount: 200,
        status: 'Paid',
        issuedDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 19).toISOString(),
        dueDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 19).toISOString(),
        paidDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 10).toISOString(),
      },
      {
        userId,
        invoiceNo: 'INV-0005',
        clientId: allClients[4].id,
        signingId: allSignings[5].id,
        amount: 75,
        status: 'Paid',
        issuedDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 3).toISOString(),
        dueDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 3).toISOString(),
        paidDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 18).toISOString(),
      },
      {
        userId,
        invoiceNo: 'INV-0006',
        clientId: allClients[6].id,
        signingId: allSignings[6].id,
        amount: 50,
        status: 'Paid',
        issuedDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 9).toISOString(),
        dueDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 9).toISOString(),
        paidDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 28).toISOString(),
      },
      {
        userId,
        invoiceNo: 'INV-0007',
        clientId: allClients[0].id,
        signingId: allSignings[7].id,
        amount: 40,
        status: 'Paid',
        issuedDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 15).toISOString(),
        dueDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 15).toISOString(),
        paidDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 2).toISOString(),
      },
      // Unpaid invoices
      {
        userId,
        invoiceNo: 'INV-0008',
        clientId: allClients[7].id,
        signingId: allSignings[8].id,
        amount: 45,
        status: 'Unpaid',
        issuedDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 20).toISOString(),
        dueDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 20).toISOString(),
      },
      {
        userId,
        invoiceNo: 'INV-0009',
        clientId: allClients[5].id,
        signingId: allSignings[9].id,
        amount: 175,
        status: 'Unpaid',
        issuedDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 25).toISOString(),
        dueDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 25).toISOString(),
        notes: 'Refinance loan signing.',
      },
      {
        userId,
        invoiceNo: 'INV-0010',
        clientId: allClients[2].id,
        signingId: allSignings[10].id,
        amount: 225,
        status: 'Unpaid',
        issuedDate: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 3).toISOString(),
        dueDate: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth() + 1, 3).toISOString(),
      },
      // Overdue invoices
      {
        userId,
        invoiceNo: 'INV-0011',
        clientId: allClients[1].id,
        signingId: allSignings[11].id,
        amount: 175,
        status: 'Unpaid',
        issuedDate: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 6).toISOString(),
        dueDate: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 10).toISOString(),
        notes: 'OVERDUE - follow up required.',
      },
      {
        userId,
        invoiceNo: 'INV-0012',
        clientId: allClients[3].id,
        amount: 85,
        status: 'Overdue',
        issuedDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 10).toISOString(),
        dueDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 10).toISOString(),
        notes: 'Consultation fee - no signing linked.',
      },
    ]

    const snakeInvoices = invoicesData.map((inv) => toSnakeCaseObj(inv))
    const invoicesRes = await db.from('invoices').insert(snakeInvoices).select()
    if (invoicesRes.error) {
      console.error('Seed: invoice insert error:', invoicesRes.error)
      return NextResponse.json({ error: 'Failed to seed invoices' }, { status: 500 })
    }

    // ─── Expenses (10) in current month ───
    const expensesData = [
      {
        userId,
        category: 'Gas',
        description: 'Gas for mobile notary appointments',
        amount: 67.5,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 3).toISOString(),
        notes: 'Shell station fill-ups',
      },
      {
        userId,
        category: 'Office Supplies',
        description: 'Notary stamps, seals, and certificate paper',
        amount: 45.0,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 5).toISOString(),
        notes: 'Replenished notary journal and ink pad',
      },
      {
        userId,
        category: 'Insurance',
        description: 'Errors & Omissions insurance monthly premium',
        amount: 35.0,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 1).toISOString(),
      },
      {
        userId,
        category: 'Stamps',
        description: 'USPS postage for mailing signed documents',
        amount: 12.75,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 8).toISOString(),
      },
      {
        userId,
        category: 'Printing',
        description: 'Printed loan signing documents and forms',
        amount: 28.5,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 6).toISOString(),
        notes: 'FedEx Office - 120 pages double-sided',
      },
      {
        userId,
        category: 'Marketing',
        description: 'Business cards and brochures',
        amount: 89.99,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 10).toISOString(),
        notes: 'Vistaprint order - 500 business cards',
      },
      {
        userId,
        category: 'Phone',
        description: 'Mobile phone bill (business line)',
        amount: 65.0,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 7).toISOString(),
      },
      {
        userId,
        category: 'Software',
        description: 'DocuSign monthly subscription',
        amount: 25.0,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 1).toISOString(),
        notes: 'Business plan with unlimited envelopes',
      },
      {
        userId,
        category: 'Travel',
        description: 'Parking fees for downtown appointments',
        amount: 18.0,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 12).toISOString(),
      },
      {
        userId,
        category: 'Miscellaneous',
        description: 'Notary commission renewal processing fee',
        amount: 120.0,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 2).toISOString(),
        notes: 'State commission renewal - 4 year term',
      },
    ]

    const snakeExpenses = expensesData.map((e) => toSnakeCaseObj(e))
    const expensesRes = await db.from('expenses').insert(snakeExpenses).select()
    if (expensesRes.error) {
      console.error('Seed: expense insert error:', expensesRes.error)
      return NextResponse.json({ error: 'Failed to seed expenses' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      counts: {
        clients: allClients.length,
        signings: allSignings.length,
        invoices: (invoicesRes.data ?? []).length,
        expenses: (expensesRes.data ?? []).length,
      },
    })
  } catch (error) {
    console.error('POST /api/seed error:', error)
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
  }
}
