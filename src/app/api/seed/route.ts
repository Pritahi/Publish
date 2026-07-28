import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * ⚠️ WARNING: Seed Endpoint
 *
 * This endpoint DELETES ALL existing data and replaces it with demo data.
 * - DO NOT expose this endpoint in production without authentication.
 * - Consider disabling or removing this route before deploying to production.
 * - For initial setup only — use once, then remove or protect with auth.
 */
export async function POST() {
  try {
    // Clean seed - delete everything first
    await db.invoice.deleteMany()
    await db.signing.deleteMany()
    await db.expense.deleteMany()
    await db.client.deleteMany()

    // ─── Clients (8) ───
    const clients = await db.client.createMany({
      data: [
        {
          name: 'Maria Gonzalez',
          email: 'maria.gonzalez@email.com',
          phone: '(305) 555-0142',
          company: 'Gonzalez & Associates LLC',
          address: '1240 Brickell Ave, Miami, FL 33131',
          notes: 'Prefers afternoon appointments. Bilingual (English/Spanish).',
        },
        {
          name: 'James Carter',
          email: 'jcarter@homemail.net',
          phone: '(770) 555-0198',
          address: '890 Peachtree St NE, Atlanta, GA 30308',
          notes: 'First-time homebuyer closing.',
        },
        {
          name: 'Pacific Coast Title Agency',
          email: 'closings@pacificcoasttitle.com',
          phone: '(310) 555-0267',
          company: 'Pacific Coast Title Agency',
          address: '4500 Wilshire Blvd, Los Angeles, CA 90010',
        },
        {
          name: 'Sarah Mitchell',
          email: 'sarah.m@workemail.com',
          phone: '(214) 555-0331',
          company: 'Mitchell Financial Group',
          address: '2200 Ross Ave, Dallas, TX 75201',
          notes: 'Loan signing specialist. Requires dual-signer appointments.',
        },
        {
          name: 'Robert Kim',
          email: 'robert.kim@email.com',
          phone: '(206) 555-0478',
          address: '400 Broad St, Seattle, WA 98109',
        },
        {
          name: 'Sunrise Real Estate Group',
          email: 'notary@sunriserealty.com',
          phone: '(602) 555-0512',
          company: 'Sunrise Real Estate Group',
          address: '3030 N 3rd St, Phoenix, AZ 85012',
          notes: 'Volume account - 5-10 signings per month.',
        },
        {
          name: 'Linda Patterson',
          email: 'lpatterson@lawfirm.com',
          phone: '(312) 555-0645',
          company: 'Patterson & Holmes Law Offices',
          address: '233 S Wacker Dr, Chicago, IL 60606',
          notes: 'Estate planning documents. Requires witness.',
        },
        {
          name: 'David Chen',
          email: 'dchen@techcorp.io',
          phone: '(408) 555-0789',
          company: 'NovaTech Solutions Inc.',
          address: '100 Tech Way, San Jose, CA 95110',
          notes: 'I-9 verifications for new employees.',
        },
      ],
    })

    // Fetch created clients for references
    const allClients = await db.client.findMany()

    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth(), 1)

    // ─── Signings (15) across last 3 months ───
    const signingsData = [
      // 3 months ago (5 signings)
      {
        clientId: allClients[0].id,
        date: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 3),
        time: '10:00 AM',
        location: '1240 Brickell Ave, Miami, FL 33131',
        serviceType: 'Real Estate Closing',
        fee: 250,
        status: 'Completed',
        notes: 'Property deed transfer for commercial property.',
        mileage: 18,
      },
      {
        clientId: allClients[1].id,
        date: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 7),
        time: '2:00 PM',
        location: '890 Peachtree St NE, Atlanta, GA 30308',
        serviceType: 'General Notary',
        fee: 35,
        status: 'Completed',
        mileage: 22,
      },
      {
        clientId: allClients[2].id,
        date: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 12),
        time: '9:00 AM',
        location: '4500 Wilshire Blvd, Los Angeles, CA 90010',
        serviceType: 'Loan Signing',
        fee: 175,
        status: 'Completed',
        notes: 'FHA loan closing package.',
        mileage: 30,
      },
      {
        clientId: allClients[5].id,
        date: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 18),
        time: '11:30 AM',
        location: '3030 N 3rd St, Phoenix, AZ 85012',
        serviceType: 'Real Estate Closing',
        fee: 200,
        status: 'Completed',
        mileage: 15,
      },
      {
        clientId: allClients[3].id,
        date: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 25),
        time: '3:00 PM',
        location: '2200 Ross Ave, Dallas, TX 75201',
        serviceType: 'Loan Signing',
        fee: 175,
        status: 'Cancelled',
        notes: 'Client cancelled - loan fell through.',
        mileage: null,
      },
      // 2 months ago (5 signings)
      {
        clientId: allClients[4].id,
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 2),
        time: '1:00 PM',
        location: '400 Broad St, Seattle, WA 98109',
        serviceType: 'Power of Attorney',
        fee: 75,
        status: 'Completed',
        mileage: 12,
      },
      {
        clientId: allClients[6].id,
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 8),
        time: '10:00 AM',
        location: '233 S Wacker Dr, Chicago, IL 60606',
        serviceType: 'Affidavit',
        fee: 50,
        status: 'Completed',
        mileage: 25,
      },
      {
        clientId: allClients[0].id,
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 14),
        time: '4:00 PM',
        location: '55 SW 1st St, Miami, FL 33130',
        serviceType: 'General Notary',
        fee: 40,
        status: 'Completed',
        mileage: 8,
      },
      {
        clientId: allClients[7].id,
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 19),
        time: '9:00 AM',
        location: '100 Tech Way, San Jose, CA 95110',
        serviceType: 'I-9 Verification',
        fee: 45,
        status: 'Completed',
        notes: 'New hire verification - 3 employees.',
        mileage: 35,
      },
      {
        clientId: allClients[5].id,
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 24),
        time: '2:30 PM',
        location: '1200 E Missouri Ave, Phoenix, AZ 85014',
        serviceType: 'Loan Signing',
        fee: 175,
        status: 'Completed',
        mileage: 20,
      },
      // Current month (5 signings)
      {
        clientId: allClients[2].id,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 2),
        time: '11:00 AM',
        location: '6801 Hollywood Blvd, Los Angeles, CA 90028',
        serviceType: 'Real Estate Closing',
        fee: 225,
        status: 'Completed',
        mileage: 28,
      },
      {
        clientId: allClients[1].id,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 5),
        time: '3:00 PM',
        location: '50 Hurt Plaza SE, Atlanta, GA 30303',
        serviceType: 'Loan Signing',
        fee: 175,
        status: 'Completed',
        mileage: 10,
      },
      {
        clientId: allClients[6].id,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 10),
        time: '10:30 AM',
        location: '233 S Wacker Dr, Chicago, IL 60606',
        serviceType: 'Power of Attorney',
        fee: 75,
        status: 'Scheduled',
        notes: 'Durable POA for healthcare directive.',
        mileage: null,
      },
      {
        clientId: allClients[4].id,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 15),
        time: '1:00 PM',
        location: '200 2nd Ave S, Seattle, WA 98104',
        serviceType: 'Affidavit',
        fee: 50,
        status: 'Scheduled',
        mileage: null,
      },
      {
        clientId: allClients[3].id,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 20),
        time: '9:00 AM',
        location: '2200 Ross Ave, Dallas, TX 75201',
        serviceType: 'Loan Signing',
        fee: 175,
        status: 'Scheduled',
        notes: 'Refinance loan package - 120 pages.',
        mileage: null,
      },
    ]

    const signings = await db.signing.createMany({ data: signingsData })
    const allSignings = await db.signing.findMany()

    // ─── Invoices (12) ───
    const invoicesData = [
      // Completed signings -> Paid invoices
      {
        invoiceNo: 'INV-0001',
        clientId: allClients[0].id,
        signingId: allSignings[0].id,
        amount: 250,
        status: 'Paid',
        issuedDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 4),
        dueDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 4),
        paidDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 20),
        notes: 'Real estate closing - commercial property.',
      },
      {
        invoiceNo: 'INV-0002',
        clientId: allClients[1].id,
        signingId: allSignings[1].id,
        amount: 35,
        status: 'Paid',
        issuedDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 8),
        dueDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 8),
        paidDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 22),
      },
      {
        invoiceNo: 'INV-0003',
        clientId: allClients[2].id,
        signingId: allSignings[2].id,
        amount: 175,
        status: 'Paid',
        issuedDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 13),
        dueDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 13),
        paidDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 1),
        notes: 'FHA loan closing.',
      },
      {
        invoiceNo: 'INV-0004',
        clientId: allClients[5].id,
        signingId: allSignings[3].id,
        amount: 200,
        status: 'Paid',
        issuedDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 19),
        dueDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 19),
        paidDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 10),
      },
      {
        invoiceNo: 'INV-0005',
        clientId: allClients[4].id,
        signingId: allSignings[5].id,
        amount: 75,
        status: 'Paid',
        issuedDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 3),
        dueDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 3),
        paidDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 18),
      },
      {
        invoiceNo: 'INV-0006',
        clientId: allClients[6].id,
        signingId: allSignings[6].id,
        amount: 50,
        status: 'Paid',
        issuedDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 9),
        dueDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 9),
        paidDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 28),
      },
      {
        invoiceNo: 'INV-0007',
        clientId: allClients[0].id,
        signingId: allSignings[7].id,
        amount: 40,
        status: 'Paid',
        issuedDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 15),
        dueDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 15),
        paidDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 2),
      },
      // Unpaid invoices
      {
        invoiceNo: 'INV-0008',
        clientId: allClients[7].id,
        signingId: allSignings[8].id,
        amount: 45,
        status: 'Unpaid',
        issuedDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 20),
        dueDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 20),
      },
      {
        invoiceNo: 'INV-0009',
        clientId: allClients[5].id,
        signingId: allSignings[9].id,
        amount: 175,
        status: 'Unpaid',
        issuedDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 25),
        dueDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 25),
        notes: 'Refinance loan signing.',
      },
      {
        invoiceNo: 'INV-0010',
        clientId: allClients[2].id,
        signingId: allSignings[10].id,
        amount: 225,
        status: 'Unpaid',
        issuedDate: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 3),
        dueDate: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth() + 1, 3),
      },
      // Overdue invoices
      {
        invoiceNo: 'INV-0011',
        clientId: allClients[1].id,
        signingId: allSignings[11].id,
        amount: 175,
        status: 'Unpaid',
        issuedDate: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 6),
        dueDate: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 10),
        notes: 'OVERDUE - follow up required.',
      },
      {
        invoiceNo: 'INV-0012',
        clientId: allClients[3].id,
        amount: 85,
        status: 'Overdue',
        issuedDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 10),
        dueDate: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth() + 1, 10),
        notes: 'Consultation fee - no signing linked.',
      },
    ]

    const invoices = await db.invoice.createMany({ data: invoicesData })

    // ─── Expenses (10) in current month ───
    const expensesData = [
      {
        category: 'Gas',
        description: 'Gas for mobile notary appointments',
        amount: 67.50,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 3),
        notes: 'Shell station fill-ups',
      },
      {
        category: 'Office Supplies',
        description: 'Notary stamps, seals, and certificate paper',
        amount: 45.00,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 5),
        notes: 'Replenished notary journal and ink pad',
      },
      {
        category: 'Insurance',
        description: 'Errors & Omissions insurance monthly premium',
        amount: 35.00,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 1),
      },
      {
        category: 'Stamps',
        description: 'USPS postage for mailing signed documents',
        amount: 12.75,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 8),
      },
      {
        category: 'Printing',
        description: 'Printed loan signing documents and forms',
        amount: 28.50,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 6),
        notes: 'FedEx Office - 120 pages double-sided',
      },
      {
        category: 'Marketing',
        description: 'Business cards and brochures',
        amount: 89.99,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 10),
        notes: 'Vistaprint order - 500 business cards',
      },
      {
        category: 'Phone',
        description: 'Mobile phone bill (business line)',
        amount: 65.00,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 7),
      },
      {
        category: 'Software',
        description: 'DocuSign monthly subscription',
        amount: 25.00,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 1),
        notes: 'Business plan with unlimited envelopes',
      },
      {
        category: 'Travel',
        description: 'Parking fees for downtown appointments',
        amount: 18.00,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 12),
      },
      {
        category: 'Miscellaneous',
        description: 'Notary commission renewal processing fee',
        amount: 120.00,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 2),
        notes: 'State commission renewal - 4 year term',
      },
    ]

    const expenses = await db.expense.createMany({ data: expensesData })

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      counts: {
        clients: clients.count,
        signings: signings.count,
        invoices: invoices.count,
        expenses: expenses.count,
      },
    })
  } catch (error) {
    console.error('POST /api/seed error:', error)
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
  }
}
