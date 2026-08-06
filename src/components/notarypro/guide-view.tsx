/**
 * GuideView — In-app help & onboarding guide for NotaryPro.
 *
 * Walks the user through:
 *   1. Getting Started (4-step setup checklist)
 *   2. Modules (overview of every sidebar section)
 *   3. Workflows (common end-to-end tasks)
 *   4. FAQs (accordion of frequently asked questions)
 *   5. Tips & Best Practices
 *
 * All content lives in this file so it stays in sync with the UI without
 * requiring any backend. State is purely local (selected tab + checklist
 * progress persisted to localStorage).
 */
'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Rocket,
  Users,
  Calendar,
  Mail,
  FileText,
  Receipt,
  BookOpen,
  BarChart3,
  Settings as SettingsIcon,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Circle,
  Stamp,
  ArrowRight,
  Clock,
  Shield,
  Zap,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

interface SetupStep {
  id: string
  title: string
  description: string
  action: { label: string; href: string }
}

const setupSteps: SetupStep[] = [
  {
    id: 'profile',
    title: 'Set up your business profile',
    description:
      'Open Settings and fill in your business name, commission number, state, phone, email, and commission expiry. This information auto-fills invoices, the e-journal, and reports — so accuracy here saves time later.',
    action: { label: 'Go to Settings', href: '/settings' },
  },
  {
    id: 'telegram',
    title: 'Connect Telegram notifications',
    description:
      'In Settings → Notifications, enable Telegram and enter your Chat ID. NotaryPro will then push real-time alerts for new signings, unpaid invoices, and daily summaries straight to your phone.',
    action: { label: 'Open Notifications', href: '/settings' },
  },
  {
    id: 'clients',
    title: 'Add your first clients',
    description:
      'Head to Clients and add the people or companies you notarize for regularly. A clean client list makes creating signings and invoices much faster because you can pick from a dropdown instead of re-typing details.',
    action: { label: 'Add Clients', href: '/clients' },
  },
  {
    id: 'signing',
    title: 'Log your first signing',
    description:
      'Open Signings → New Signing, pick a client, set date/time/location, choose service type, and enter the fee. Once saved, the signing feeds into the e-journal, invoices, and dashboard stats automatically.',
    action: { label: 'New Signing', href: '/signings' },
  },
]

interface ModuleInfo {
  id: string
  label: string
  icon: React.ElementType
  href: string
  tagline: string
  description: string
  highlights: string[]
}

const modules: ModuleInfo[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Rocket,
    href: '/',
    tagline: 'Your business at a glance',
    description:
      'The Dashboard is your home base. It surfaces total revenue, pending payments, upcoming signings, and total clients as KPI cards, plus a revenue trend chart and a list of upcoming signings. Use it every morning to plan your day and every evening to see how the business performed.',
    highlights: [
      'KPI cards update instantly when you add signings or invoices elsewhere',
      'Upcoming signings list shows the next 7 days',
      'Quick-action buttons let you jump to common tasks',
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    href: '/clients',
    tagline: 'One source of truth for everyone you notarize for',
    description:
      'Maintain a directory of individuals and companies. Each client record stores contact details, notes, and a running count of signings and invoices tied to them. You can search, filter, and edit entries at any time.',
    highlights: [
      'Search by name, email, or phone',
      'See total signings and outstanding balance per client',
      'Click a client to view their full history',
    ],
  },
  {
    id: 'signings',
    label: 'Signings',
    icon: Calendar,
    href: '/signings',
    tagline: 'Schedule and track every notarization appointment',
    description:
      'The Signings module is the operational heart of NotaryPro. Create appointments with client, date, time, location, service type (e.g. Real Estate, Loan, General Notarization), fee, and status. As you update statuses — Scheduled → Completed → Invoiced — the dashboard and reports update automatically.',
    highlights: [
      'Status pipeline: Scheduled, Completed, Cancelled, Invoiced',
      'Filter by date range, client, or status',
      'Completed signings can be converted into invoices in one click',
    ],
  },
  {
    id: 'email-parsing',
    label: 'Email Parsing',
    icon: Mail,
    href: '/email-parsing',
    tagline: 'Turn signing-request emails into draft signings',
    description:
      'Paste the body of an email requesting a notarization and NotaryPro parses out the client name, date, time, location, and document type automatically. Review the extracted fields, fix anything that is wrong, and save — no more manual retyping.',
    highlights: [
      'Auto-detects common email patterns from signing services',
      'Editable preview before saving',
      'Saves 2–3 minutes per appointment vs. manual entry',
    ],
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: FileText,
    href: '/invoices',
    tagline: 'Generate, send, and track professional invoices',
    description:
      'Create invoices from scratch or convert them from completed signings. Each invoice has a unique number, line items, totals, and a status (Draft, Sent, Paid, Overdue). You can download a PDF copy or mark invoices as paid directly from the list view.',
    highlights: [
      'Auto-numbered invoice IDs (INV-0001, INV-0002, …)',
      'One-click PDF download for printing or email attachment',
      'Status filters make overdue invoices easy to chase',
    ],
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: Receipt,
    href: '/expenses',
    tagline: 'Track costs that eat into your margin',
    description:
      'Log mileage, supplies, software subscriptions, and other business expenses. Categorize each entry so you can see where the money goes and have clean records ready at tax time.',
    highlights: [
      'Categories: Mileage, Supplies, Software, Travel, Other',
      'Attach a note or receipt reference to each entry',
      'Feeds into the Reports module for net-profit calculations',
    ],
  },
  {
    id: 'ejournal',
    label: 'E-Journal',
    icon: BookOpen,
    href: '/ejournal',
    tagline: 'Compliant notary journal entries — paper-free',
    description:
      'Many states require notaries to keep a journal of every notarization. The E-Journal module creates a structured entry per signing with document type, signer ID details, signature, thumbprint (optional), and fee. Entries are tamper-evident and exportable for audits.',
    highlights: [
      'Auto-populated from completed signings',
      'Export to CSV or PDF for state compliance',
      'Searchable by date, client, or document type',
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    href: '/reports',
    tagline: 'Understand revenue, costs, and trends',
    description:
      'Aggregate view of your business over time. See revenue by month, top clients by revenue, expense breakdown by category, and net profit. Filter by date range to compare quarters or years.',
    highlights: [
      'Revenue, expense, and net-profit charts on one page',
      'Top-clients leaderboard helps you focus retention efforts',
      'Export any report as CSV for your accountant',
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    href: '/settings',
    tagline: 'Profile, notifications, and data management',
    description:
      'Configure your business profile, Telegram notification preferences, and trigger manual data backups. This is also where you manage notification history and reset the local database if needed.',
    highlights: [
      'Business profile auto-fills invoices and the e-journal',
      'Granular notification toggles per event type',
      'One-click JSON backup / restore',
    ],
  },
]

interface Workflow {
  id: string
  title: string
  duration: string
  steps: string[]
}

const workflows: Workflow[] = [
  {
    id: 'new-signing',
    title: 'Log a new signing from start to finish',
    duration: '~3 minutes',
    steps: [
      'Open Clients and confirm the client exists. If not, add them first.',
      'Go to Signings → New Signing and select the client from the dropdown.',
      'Pick date, time, and location. Add a note if the venue has parking or access instructions.',
      'Choose the service type and enter the fee you will charge.',
      'Save with status = Scheduled. The signing now appears on the Dashboard.',
      'After the appointment, return to the signing and set status = Completed.',
      'Click "Create Invoice" to generate an invoice pre-filled with the signing details.',
      'Open the invoice, verify totals, and mark as Sent (or download PDF to email manually).',
    ],
  },
  {
    id: 'email-to-signing',
    title: 'Convert a signing-service email into a scheduled signing',
    duration: '~90 seconds',
    steps: [
      'Open the email from the signing service and copy the full body.',
      'In NotaryPro, go to Email Parsing and paste the email body into the input box.',
      'Click Parse. Review the extracted fields (client, date, time, location, document type).',
      'Correct any field that was mis-parsed — common ones are date formats and address lines.',
      'Click Create Signing. The signing is saved with status = Scheduled.',
      'Optionally go to Signings to add the fee and any extra notes.',
    ],
  },
  {
    id: 'month-end',
    title: 'Close out the month and prep for taxes',
    duration: '~10 minutes',
    steps: [
      'Go to Reports and set the date range to the month you are closing.',
      'Note revenue, total expenses, and net profit. Compare with last month.',
      'Open Invoices → filter by "Overdue" and follow up with those clients.',
      'Open Expenses and confirm every business cost from the month is logged.',
      'Export the E-Journal for the month as a PDF — keep it for state compliance.',
      'Optional: Settings → Data Backup → Download to archive the full local dataset.',
    ],
  },
  {
    id: 'telegram-setup',
    title: 'Enable Telegram notifications in under 2 minutes',
    duration: '~2 minutes',
    steps: [
      'Open Telegram and message @userinfobot to get your Chat ID.',
      'In NotaryPro, go to Settings → Notifications.',
      'Toggle "Enable Telegram notifications" on.',
      'Paste your Chat ID and click Send Test Notification.',
      'Confirm the test message arrives on your phone.',
      'Pick which events trigger notifications (new signing, unpaid invoice, daily summary).',
      'Save. The bell icon in the sidebar will now light up when alerts fire.',
    ],
  },
]

interface FAQ {
  q: string
  a: string
}

const faqs: FAQ[] = [
  {
    q: 'Where is my data stored? Is it safe?',
    a: 'NotaryPro stores all data locally in your browser (localStorage) by default. This means your client list, signings, invoices, and expenses never leave your device unless you explicitly back them up. Use Settings → Data Backup regularly to export a JSON file you control. If you are using the Supabase-backed deployment, data lives in your own Supabase project — also fully under your control.',
  },
  {
    q: 'Can I use NotaryPro on multiple devices?',
    a: 'Because the default storage is local, data does not sync automatically between devices. To work across devices, either (a) use the Supabase deployment option documented in /supabase, or (b) export a backup from device A, import it on device B, and re-export before switching back. The team plan with Supabase is the recommended path for multi-device use.',
  },
  {
    q: 'Does the E-Journal satisfy my state\'s legal requirements?',
    a: 'The E-Journal captures the fields most states require (date, signer name, ID type/number, document type, signature, fee, optional thumbprint). However, notary law varies by state — some require a physical paper journal, others accept electronic journals only if they meet specific tamper-evidence standards. Always verify against your state\'s current notary handbook before relying on the E-Journal as your sole record.',
  },
  {
    q: 'How do invoice numbers work? Can I customize them?',
    a: 'Invoice numbers auto-increment as INV-0001, INV-0002, and so on, starting from the highest existing number plus one. To customize, simply edit the invoice number field when creating an invoice — but be careful to keep them unique and sequential if your state or accountant requires it.',
  },
  {
    q: 'What happens if I delete a client that has signings or invoices?',
    a: 'Deleting a client does not delete their past signings or invoices — those records remain so your financial history stays intact. However, the client name on those records will no longer link to an active client profile, so reports that group by client may show "Unknown" for the deleted entries. Best practice: archive inactive clients by adding a note instead of deleting them.',
  },
  {
    q: 'Why didn\'t I receive a Telegram notification?',
    a: 'Check four things in order: (1) Telegram is enabled in Settings → Notifications and your Chat ID is correct. (2) You have not blocked the bot — send it any message to unblock. (3) The event type you expected is toggled on in the same settings page. (4) Check Settings → Notification History — if messages show as failed, your Chat ID is likely wrong.',
  },
  {
    q: 'Can I export everything for my accountant at tax time?',
    a: 'Yes. Reports → Export CSV gives you a revenue-and-expense summary, Invoices → Export CSV gives you the full invoice ledger, and Expenses → Export CSV gives you itemized costs. Combine these with the E-Journal PDF for the period and your accountant has everything they need.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'NotaryPro is a responsive web app — it works in any modern mobile browser and the sidebar collapses into a slide-out menu on small screens. You can "Add to Home Screen" on iOS/Android for an app-like experience. A native mobile app is on the roadmap.',
  },
]

interface Tip {
  icon: React.ElementType
  title: string
  body: string
}

const tips: Tip[] = [
  {
    icon: Zap,
    title: 'Use Email Parsing for volume days',
    body: 'On days when you receive multiple signing requests from signing services, paste them all into Email Parsing back-to-back. You will save 15–20 minutes versus typing each one manually.',
  },
  {
    icon: Shield,
    title: 'Back up weekly',
    body: 'Schedule a recurring Friday reminder to download a JSON backup from Settings. Browser storage can be cleared accidentally — a weekly backup means you never lose more than 7 days.',
  },
  {
    icon: Clock,
    title: 'Set statuses honestly',
    body: 'Keep signing statuses current. The Dashboard, Reports, and notification triggers all depend on accurate statuses. A signing marked "Scheduled" that actually happened yesterday will skew your upcoming-signings count.',
  },
  {
    icon: AlertTriangle,
    title: 'Reconcile invoices monthly',
    body: 'At month-end, filter Invoices by "Sent" and follow up on anything older than 30 days. The longer an invoice sits unpaid, the lower the collection rate — a 5-minute follow-up call usually closes it.',
  },
  {
    icon: Users,
    title: 'Notes are gold',
    body: 'Use the notes field on clients and signings liberally. "Prefers text messages", "Always late", "Signing room is on the 2nd floor" — small context notes compound into a much smoother operation over time.',
  },
  {
    icon: Stamp,
    title: 'Verify commission expiry',
    body: 'Your commission expiry is in Settings. Set a calendar reminder 60 days before it expires so you have time to renew without a gap in your notary authority.',
  },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const CHECKLIST_KEY = 'notarypro-guide-checklist'

export default function GuideView() {
  const [activeTab, setActiveTab] = useState('getting-started')
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHECKLIST_KEY)
      if (stored) setChecked(JSON.parse(stored))
    } catch {
      /* ignore */
    }
  }, [])

  const toggleStep = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      try {
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const completedCount = setupSteps.filter((s) => checked[s.id]).length
  const progressPct = Math.round((completedCount / setupSteps.length) * 100)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-emerald-600 shadow-md shadow-emerald-600/25">
            <HelpCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              Guide &amp; Help
            </h1>
            <p className="text-sm text-slate-500">
              Everything you need to get the most out of NotaryPro.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="getting-started" className="text-xs md:text-sm">
            <Rocket className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Getting Started</span>
            <span className="md:hidden">Start</span>
          </TabsTrigger>
          <TabsTrigger value="modules" className="text-xs md:text-sm">
            <BookOpen className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Modules</span>
            <span className="md:hidden">Modules</span>
          </TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs md:text-sm">
            <ArrowRight className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Workflows</span>
            <span className="md:hidden">Flows</span>
          </TabsTrigger>
          <TabsTrigger value="faqs" className="text-xs md:text-sm">
            <HelpCircle className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">FAQs</span>
            <span className="md:hidden">FAQs</span>
          </TabsTrigger>
          <TabsTrigger value="tips" className="text-xs md:text-sm">
            <Lightbulb className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Tips</span>
            <span className="md:hidden">Tips</span>
          </TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------- */}
        {/*  Getting Started                                            */}
        {/* ---------------------------------------------------------- */}
        <TabsContent value="getting-started" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-emerald-600" />
                Welcome to NotaryPro
              </CardTitle>
              <CardDescription>
                Complete these four steps to get your notary business fully set up.
                Your progress is saved automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {completedCount} of {setupSteps.length} steps complete
                  </span>
                  <span className="font-semibold text-emerald-700">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {setupSteps.map((step, idx) => {
              const isDone = !!checked[step.id]
              const Icon = isDone ? CheckCircle2 : Circle
              return (
                <Card
                  key={step.id}
                  className={cn(
                    'transition-all duration-200',
                    isDone ? 'border-emerald-300 bg-emerald-50/40' : 'hover:border-slate-300'
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStep(step.id)}
                        className="mt-0.5 shrink-0"
                        aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
                      >
                        <Icon
                          className={cn(
                            'h-6 w-6 transition-colors',
                            isDone ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-400'
                          )}
                        />
                      </button>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1.5 font-mono"
                          >
                            STEP {idx + 1}
                          </Badge>
                          {isDone && (
                            <Badge className="text-[10px] h-5 px-1.5 bg-emerald-600">
                              DONE
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base leading-snug">
                          {step.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                    <Button
                      asChild
                      size="sm"
                      variant={isDone ? 'outline' : 'default'}
                      className="w-full"
                    >
                      <a href={step.action.href}>
                        {step.action.label}
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------- */}
        {/*  Modules                                                    */}
        {/* ---------------------------------------------------------- */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                Module Overview
              </CardTitle>
              <CardDescription>
                Every section in the sidebar explained — what it does, why it
                matters, and the key things to know.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {modules.map((m) => {
              const Icon = m.icon
              return (
                <Card key={m.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-slate-900 text-white shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base flex items-center gap-2">
                          {m.label}
                        </CardTitle>
                        <p className="text-xs text-emerald-700 font-medium mt-0.5 truncate">
                          {m.tagline}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {m.description}
                    </p>
                    <ul className="space-y-1.5">
                      {m.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild size="sm" variant="ghost" className="w-full mt-2">
                      <a href={m.href}>
                        Open {m.label}
                        <ExternalLink className="h-3.5 w-3.5 ml-1" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------- */}
        {/*  Workflows                                                  */}
        {/* ---------------------------------------------------------- */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-emerald-600" />
                Common Workflows
              </CardTitle>
              <CardDescription>
                Step-by-step recipes for the tasks you will do most often.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4">
            {workflows.map((wf) => (
              <Card key={wf.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <CardTitle className="text-base">{wf.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {wf.duration}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {wf.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm text-slate-700 leading-relaxed pt-0.5">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------- */}
        {/*  FAQs                                                       */}
        {/* ---------------------------------------------------------- */}
        <TabsContent value="faqs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-emerald-600" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Quick answers to the questions users ask most. Tap any question
                to expand.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-slate-600 leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------- */}
        {/*  Tips                                                       */}
        {/* ---------------------------------------------------------- */}
        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-emerald-600" />
                Tips &amp; Best Practices
              </CardTitle>
              <CardDescription>
                Hard-won lessons from experienced NotaryPro users. Apply these
                early and you will save hours every month.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {tips.map((tip, i) => {
              const Icon = tip.icon
              return (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base">{tip.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 leading-relaxed">{tip.body}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Separator />

          <Card className="bg-slate-900 text-white border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-600 shrink-0">
                  <Stamp className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">Still stuck?</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Re-read the relevant module above, check the FAQs, or walk
                    through a workflow step by step. Most questions are answered
                    somewhere in this guide — but if you have exhausted all
                    options, reach out to your NotaryPro administrator or consult
                    your state&apos;s notary handbook for regulatory questions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
