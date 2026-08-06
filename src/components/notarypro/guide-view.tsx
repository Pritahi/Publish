'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Mail,
  FileText,
  Receipt,
  BookOpen,
  BarChart3,
  Settings as SettingsIcon,
  HelpCircle,
  ArrowRight,
  Rocket,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { replayOnboarding } from './onboarding-modal'

interface PageGuide {
  id: string
  title: string
  icon: React.ElementType
  color: string
  tagline: string
  whatItDoes: string
  whenToUse: string[]
  keyFeatures: string[]
  tips: string[]
  route: string
}

const guides: PageGuide[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    color: 'bg-blue-500',
    tagline: 'Your business command center',
    whatItDoes:
      'The Dashboard is the first page you see after login. It pulls live data from every other section — signings, invoices, expenses, and clients — and presents it as KPIs, charts, and activity feeds. Think of it as a daily health check for your notary business: how much money is coming in, how much is still owed to you, what signings are coming up this week, and what changed recently.',
    whenToUse: [
      'Every morning to see your day at a glance',
      'Before tax time to check year-to-date revenue',
      'To quickly jump into creating a new signing, invoice, or expense',
      'When you want to see if any payments are overdue',
    ],
    keyFeatures: [
      'Revenue KPI with month-over-month change indicator',
      'Pending payments card showing total outstanding',
      'Upcoming signings list (next 5 appointments)',
      'Recent activity feed (last 5 changes across the app)',
      'Quick Action buttons for common tasks',
    ],
    tips: [
      'KPIs update automatically as you add signings and invoices — no refresh needed.',
      'Click any item in "Upcoming Signings" to edit it directly.',
      'The "Pending Payments" number = sum of all Sent invoices that are not yet Paid.',
    ],
    route: '/',
  },
  {
    id: 'clients',
    title: 'Clients',
    icon: Users,
    color: 'bg-violet-500',
    tagline: 'Your contact database',
    whatItDoes:
      'The Clients page is where you store everyone you do business with: individual borrowers, signing services (like Snapdoc, NotaryGo), title companies, lenders, and attorneys. Each client record holds name, email, phone, company, address, and notes. The system automatically calculates total revenue earned from each client so you can see who your best customers are.',
    whenToUse: [
      'When a new borrower or signing service contacts you for the first time',
      'Before creating a signing — every signing must be linked to a client',
      'Before creating an invoice — every invoice must be linked to a client',
      'When you need to look up a contact phone number or email',
      'To review which clients bring you the most revenue',
    ],
    keyFeatures: [
      'Searchable table (by name, email, company)',
      'Add/Edit/Delete with modal forms',
      'Per-client revenue total (sum of all their paid invoices)',
      'Client type badge: Borrower, Signing Service, Title Co, Lender, Attorney, Other',
      'Notes field for context (e.g., "prefers text messages", "pays Net-30")',
    ],
    tips: [
      'You cannot delete a client who has signings or invoices linked to them — delete those first.',
      'The "Type" field helps you filter in Reports later (e.g., revenue from Signing Services only).',
      'Use the Notes field liberally — it stays private to you.',
    ],
    route: '/clients',
  },
  {
    id: 'signings',
    title: 'Signings',
    icon: Calendar,
    color: 'bg-amber-500',
    tagline: 'Appointment scheduling & tracking',
    whatItDoes:
      'The Signings page is your appointment calendar. Each signing represents one notary job: a date, time, location, client, service type (Loan Signing, General Notary, Refinance, etc.), fee, and status. The status moves through Scheduled → In Progress → Completed → (optionally) Cancelled. Completed signings can be invoiced directly from this page.',
    whenToUse: [
      'When a signing service books you for a job',
      'To see today\'s or this week\'s appointments',
      'To mark a signing as Completed after it happens',
      'To convert a completed signing into an invoice',
      'To cancel or reschedule an upcoming signing',
    ],
    keyFeatures: [
      'List view with status badges and filters',
      'Calendar view (month grid) for visual scheduling',
      'Filter by status, date range, or client',
      'Status workflow: Scheduled → In Progress → Completed / Cancelled',
      'Auto-fill fields when converting an email-parsed signing',
    ],
    tips: [
      'Switch to Calendar view to see your month at a glance.',
      'Only "Completed" signings can be invoiced.',
      'Cancel instead of delete if you want to keep a record (for reporting).',
      'The fee you enter here auto-populates the invoice later.',
    ],
    route: '/signings',
  },
  {
    id: 'email-parsing',
    title: 'Email Parsing',
    icon: Mail,
    color: 'bg-pink-500',
    tagline: 'Auto-detect signing requests from Gmail',
    whatItDoes:
      'Email Parsing connects to your Gmail inbox (read-only, secure OAuth) and scans incoming emails to detect signing requests from companies like Snapdoc, NotaryGo, NotaryDash, etc. When a real signing request is detected, it extracts the borrower name, date, time, location, and fee — then shows it as a "parsed signing" you can convert to a real Signing with one click. Newsletters, personal emails, and promotional emails are filtered out automatically.',
    whenToUse: [
      'When you receive signing requests via email and want to skip manual entry',
      'To keep a single inbox of all incoming signing opportunities',
      'To respond faster to signing services (within minutes vs. hours)',
      'To avoid typos when copying details from email to your calendar',
    ],
    keyFeatures: [
      'Gmail OAuth connection (read-only — NotaryPro can never send email as you)',
      'Strict 3-tier filter: blocklist + signal scoring + verification',
      'Parsed signing cards with one-click "Add to Signings"',
      'Connect/disconnect from the Email Parsing page',
      'Refresh button to re-scan inbox for new requests',
    ],
    tips: [
      'Only emails from known signing service domains are parsed (e.g., snapdoc.com, notarygo.com).',
      'Personal newsletters like daily.dev are blocked automatically.',
      'You can delete a parsed signing if you don\'t want to take the job.',
      'The connection is per-browser — connect once and it persists.',
    ],
    route: '/email-parsing',
  },
  {
    id: 'invoices',
    title: 'Invoices',
    icon: FileText,
    color: 'bg-cyan-500',
    tagline: 'Bill clients and track payments',
    whatItDoes:
      'The Invoices page lets you create professional invoices for completed signings. Each invoice has an auto-generated number (INV-0001, INV-0002…), a linked client, line items, totals, due date, and status (Draft, Sent, Paid, Overdue). You can download a clean PDF of any invoice to email or print, mark invoices as Paid when you receive money, and filter by status to see who owes you.',
    whenToUse: [
      'After completing a signing — to bill the client',
      'To check which invoices are overdue (follow up!)',
      'To download a PDF invoice to send to a signing service',
      'To mark an invoice as Paid after receiving payment',
      'At month-end to see total invoiced vs. total collected',
    ],
    keyFeatures: [
      'Auto-numbered invoices (INV-0001, INV-0002…)',
      'Status workflow: Draft → Sent → Paid (or Overdue if past due)',
      'PDF download with one click (professional layout)',
      'Filter by status, client, or date range',
      'Mark as Paid in one click',
    ],
    tips: [
      'Set the due date when creating the invoice — overdue status auto-triggers after that date.',
      'PDFs use your business name from Settings as the "From" header.',
      'You can edit a Draft invoice freely, but Sent/Paid invoices are locked.',
      'Overdue invoices show a red badge — follow up with the client!',
    ],
    route: '/invoices',
  },
  {
    id: 'expenses',
    title: 'Expenses',
    icon: Receipt,
    color: 'bg-rose-500',
    tagline: 'Track business costs for tax time',
    whatItDoes:
      'The Expenses page is where you log every business-related cost: mileage driven to signings, notary supplies (stamps, journals), software subscriptions (NotaryPro, signing service platforms), travel (parking, tolls), printing, and more. Each expense has a date, amount, category, and optional note. At tax time, you can export everything as CSV for your accountant.',
    whenToUse: [
      'Every time you drive to a signing (log the miles)',
      'When you buy notary supplies (stamp, journal, business cards)',
      'Monthly when you pay for software subscriptions',
      'When you pay for parking, tolls, or printing for a job',
      'At tax time — export all expenses for your accountant',
    ],
    keyFeatures: [
      'Categories: Mileage, Supplies, Software, Travel, Printing, Other',
      'Mileage auto-calculates at IRS standard rate ($0.67/mile for 2024)',
      'Filter by category or month',
      'Monthly expense summary card',
      'CSV export for tax preparation',
    ],
    tips: [
      'Log mileage the day of the signing — you\'ll forget the exact miles later.',
      'Mileage is the biggest tax deduction for most notaries — log every trip!',
      'Keep receipts in a separate folder; the Notes field can reference them.',
      'Software subscriptions (including NotaryPro) are deductible — log them.',
    ],
    route: '/expenses',
  },
  {
    id: 'ejournal',
    title: 'E-Journal',
    icon: BookOpen,
    color: 'bg-indigo-500',
    tagline: 'Digital notary journal (state-compliant)',
    whatItDoes:
      'The E-Journal is the digital version of the paper notary journal that most states require you to maintain. Every notarization you perform should have an entry here: signer name, document type, ID type, ID number, signature, date, and time. When you complete a signing, an entry is auto-created — you just need to add the ID details and capture the signer\'s signature on screen.',
    whenToUse: [
      'At every notarization — fill in the entry before the signer leaves',
      'When a state auditor requests your journal',
      'To look up a past notarization (by signer name or date)',
      'To export your journal as CSV for backup or audit',
    ],
    keyFeatures: [
      'Auto-creates entries from completed signings',
      'On-screen signature capture (mouse, finger, or stylus)',
      'Document type, ID type, ID number fields',
      'Search by signer name or date',
      'Export as CSV for state compliance',
    ],
    tips: [
      'Always capture the signer\'s signature before they leave — hard to get later.',
      'ID type should match what you actually saw (Driver\'s License, Passport, etc.).',
      'Never redact ID numbers — they are required for journal compliance.',
      'Back up your journal monthly (Settings → Backup).',
    ],
    route: '/ejournal',
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: BarChart3,
    color: 'bg-teal-500',
    tagline: 'Analytics & business insights',
    whatItDoes:
      'The Reports page turns your data into charts and insights. See revenue trends over time, expense breakdown by category, your top 5 clients by revenue, signing type distribution (Loan vs. General vs. Refinance), and profit & loss. Filter by month, quarter, or year to spot trends and make smarter business decisions.',
    whenToUse: [
      'Monthly — review what worked and what didn\'t',
      'Quarterly — to see if you\'re on track for revenue goals',
      'At tax time — to verify total income and expenses',
      'When deciding whether to raise your fees (track revenue per signing type)',
      'To identify which clients to prioritize (top revenue clients)',
    ],
    keyFeatures: [
      'Revenue trend line chart (monthly)',
      'Expense breakdown pie chart (by category)',
      'Top 5 clients bar chart',
      'Signing type distribution',
      'Profit & Loss summary card',
      'Date range filter (month, quarter, year, all-time)',
    ],
    tips: [
      'Filter by quarter to see seasonal trends (real estate closings spike in summer).',
      'Top Clients chart helps you decide who to keep happy.',
      'Compare Income vs. Expense to spot months where you operated at a loss.',
    ],
    route: '/reports',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: SettingsIcon,
    color: 'bg-slate-500',
    tagline: 'Business profile, alerts, and data',
    whatItDoes:
      'The Settings page is your control panel. Configure your business name and contact info (used on invoices), set up Telegram notifications (get an instant ping when a new signing email is parsed), manage your Gmail connection for email parsing, and backup/restore all your data. This is also where you can replay the onboarding tour if you forgot how something works.',
    whenToUse: [
      'On first login — to set your business name (used on invoices)',
      'When setting up Telegram alerts for new signing emails',
      'To connect or disconnect your Gmail for email parsing',
      'To back up all data before making big changes',
      'To restore data from a previous backup',
      'To replay the onboarding tour',
    ],
    keyFeatures: [
      'Business profile (name, email, phone, address)',
      'Telegram bot configuration with test message',
      'Gmail connection management',
      'Full data backup (JSON export)',
      'Full data restore (JSON import)',
      'Replay onboarding tour button',
    ],
    tips: [
      'Back up your data weekly — it\'s a single JSON file you can save anywhere.',
      'Telegram alerts are instant — set the bot up so you never miss a signing email.',
      'Your business name on the Settings page is what appears on invoice PDFs.',
    ],
    route: '/settings',
  },
]

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: 'How do I get started as a brand new user?',
    answer:
      'On your first login, an onboarding tour will appear automatically. Walk through it (about 2 minutes). Then: (1) Go to Settings and set your business name. (2) Go to Clients and add your first client. (3) Go to Signings and add your first signing. (4) After the signing is completed, go to Invoices and create an invoice. (5) Log any expenses (mileage, supplies) in the Expenses page. (6) Fill in the E-Journal entry for the notarization. (7) Check Reports to see your revenue.',
  },
  {
    question: 'What is the difference between a "Signing" and an "Invoice"?',
    answer:
      'A Signing is the appointment itself — the actual notary job you performed (or will perform). An Invoice is the bill you send to the client for that signing. One signing → one invoice. You create a signing first, mark it as Completed, then create an invoice for it. The signing tracks what you DID; the invoice tracks what you GET PAID for.',
  },
  {
    question: 'Do I need to connect my Gmail?',
    answer:
      'No, Gmail connection is optional. Email Parsing is a time-saver — if you receive signing requests via email, connecting Gmail lets NotaryPro auto-detect them and create signings with one click. If you prefer manual entry or get signings through a portal (like Snapdoc), you can skip Gmail entirely.',
  },
  {
    question: 'Is my data safe? Where is it stored?',
    answer:
      'Your data is stored in a secure Supabase database. Backups can be downloaded anytime from Settings → Backup (JSON file). We recommend weekly backups. Your Gmail connection is read-only — NotaryPro can never send email as you or modify your inbox.',
  },
  {
    question: 'Can I use NotaryPro on mobile?',
    answer:
      'Yes. NotaryPro is fully responsive. On phones, the sidebar collapses into a hamburger menu (top-right). All features work on mobile — including the E-Journal signature capture (sign with your finger).',
  },
  {
    question: 'How do I replay the onboarding tour?',
    answer:
      'Go to Settings → Help section, or click the "Replay Tour" button on this Guide page. The onboarding modal will appear again and walk you through every section.',
  },
  {
    question: 'What should I do if I see "not found" or 404 on a page?',
    answer:
      'Hard refresh your browser (Ctrl+Shift+R / Cmd+Shift+R). If that doesn\'t work, clear your browser cache and cookies for the site, then log in again. If the issue persists, the deployment may be in progress — wait 2 minutes and try again.',
  },
  {
    question: 'Can I delete a client who has signings?',
    answer:
      'No. To maintain data integrity, you cannot delete a client who has signings or invoices linked to them. You must delete (or reassign) those signings and invoices first. This prevents orphaned records and keeps your reports accurate.',
  },
]

export default function GuideView() {
  const router = useRouter()
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)
  const [expandedGuide, setExpandedGuide] = useState<string | null>('dashboard')

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero */}
      <Card className="border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-600 shrink-0 shadow-lg shadow-emerald-600/30">
              <HelpCircle className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                NotaryPro Guide & Help
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                Everything you need to know about every page in NotaryPro. New here? Take the
                2-minute onboarding tour. Already a pro? Jump to any section below for detailed
                explanations, key features, and pro tips.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={() => replayOnboarding()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <PlayCircle className="h-4 w-4 mr-1.5" />
                  Replay Onboarding Tour
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                >
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-emerald-600" />
            Quick Start — First 5 Minutes
          </CardTitle>
          <CardDescription>
            Brand new to NotaryPro? Follow these 5 steps in order to set up your business.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-5">
          {[
            { n: 1, label: 'Set Business Name', route: '/settings', icon: SettingsIcon },
            { n: 2, label: 'Add a Client', route: '/clients', icon: Users },
            { n: 3, label: 'Schedule a Signing', route: '/signings', icon: Calendar },
            { n: 4, label: 'Create an Invoice', route: '/invoices', icon: FileText },
            { n: 5, label: 'Log an Expense', route: '/expenses', icon: Receipt },
          ].map((step) => {
            const Icon = step.icon
            return (
              <button
                key={step.n}
                onClick={() => router.push(step.route)}
                className="group flex flex-col items-center text-center p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-2">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400 mb-1">STEP {step.n}</span>
                <span className="text-xs font-medium text-slate-700 group-hover:text-emerald-700">
                  {step.label}
                </span>
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Page-by-page guides */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-slate-700" />
          Page-by-Page Guide
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Click any section to expand. Each card explains what the page does, when to use it, key
          features, and pro tips.
        </p>

        <div className="space-y-3">
          {guides.map((guide) => {
            const Icon = guide.icon
            const isOpen = expandedGuide === guide.id
            return (
              <Card key={guide.id} className="overflow-hidden border-slate-200">
                <button
                  onClick={() => setExpandedGuide(isOpen ? null : guide.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div
                    className={`flex items-center justify-center h-11 w-11 rounded-xl ${guide.color} text-white shrink-0`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{guide.title}</h3>
                      <span className="text-[11px] text-slate-400">·</span>
                      <span className="text-xs text-slate-500 truncate">{guide.tagline}</span>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                    {/* What it does */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5 flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5" />
                        What this page does
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{guide.whatItDoes}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 mb-4">
                      {/* When to use */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          When to use it
                        </h4>
                        <ul className="space-y-1.5">
                          {guide.whenToUse.map((item, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">·</span>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Key features */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                          Key features
                        </h4>
                        <ul className="space-y-1.5">
                          {guide.keyFeatures.map((item, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">·</span>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2 flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5" />
                        Pro Tips
                      </h4>
                      <ul className="space-y-1">
                        {guide.tips.map((tip, i) => (
                          <li key={i} className="text-xs text-amber-900 flex items-start gap-2">
                            <span className="text-amber-500 mt-0.5">→</span>
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Visit button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(guide.route)}
                      className="w-full sm:w-auto"
                    >
                      Open {guide.title}
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>Common questions from new NotaryPro users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = expandedFaq === i
            return (
              <div
                key={i}
                className="rounded-lg border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-slate-800">{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Footer CTA */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-slate-700 mb-3">
            Still stuck? Replay the onboarding tour or jump straight to a page from the sidebar.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button size="sm" onClick={() => replayOnboarding()} className="bg-emerald-600 hover:bg-emerald-700">
              <PlayCircle className="h-4 w-4 mr-1.5" />
              Replay Tour
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push('/')}>
              Back to Dashboard
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
