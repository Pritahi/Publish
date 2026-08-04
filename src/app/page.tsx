'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/notarypro/app-layout'
import DashboardView from '@/components/notarypro/dashboard-view'
import ClientsView from '@/components/notarypro/clients-view'
import SigningsView from '@/components/notarypro/signings-view'
import InvoicesView from '@/components/notarypro/invoices-view'
import ExpensesView from '@/components/notarypro/expenses-view'
import ReportsView from '@/components/notarypro/reports-view'
import EJournalView from '@/components/notarypro/ejournal-view'
import SettingsView from '@/components/notarypro/settings-view'
import EmailParsingView from '@/components/notarypro/email-parsing-view'

export default function Home() {
  const [activePage, setActivePage] = useState('dashboard')

  const views: Record<string, React.ReactNode> = {
    dashboard: <DashboardView />,
    clients: <ClientsView />,
    signings: <SigningsView />,
    'email-parsing': <EmailParsingView />,
    invoices: <InvoicesView />,
    expenses: <ExpensesView />,
    reports: <ReportsView />,
    ejournal: <EJournalView />,
    settings: <SettingsView />,
  }

  return (
    <AppLayout activePage={activePage} setActivePage={setActivePage}>
      {views[activePage]}
    </AppLayout>
  )
}
