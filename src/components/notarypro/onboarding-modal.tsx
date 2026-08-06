'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Stamp,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Rocket,
  Sparkles,
} from 'lucide-react'

interface OnboardingStep {
  title: string
  description: string
  icon: React.ElementType
  pageId: string
  color: string
  tips: string[]
}

const steps: OnboardingStep[] = [
  {
    title: 'Welcome to NotaryPro!',
    description:
      'NotaryPro is your all-in-one business manager for mobile notary work. Track clients, schedule signings, send invoices, log expenses, maintain your journal, and watch your revenue grow — all from one dashboard.',
    icon: Rocket,
    pageId: 'dashboard',
    color: 'bg-emerald-500',
    tips: [
      'This quick tour will walk you through every section.',
      'Takes about 2 minutes.',
      'You can replay it anytime from Settings → Help.',
    ],
  },
  {
    title: 'Dashboard',
    description:
      'Your command center. See total revenue, pending payments, upcoming signings, and recent activity at a glance. Use the Quick Actions to jump to any task.',
    icon: LayoutDashboard,
    pageId: 'dashboard',
    color: 'bg-blue-500',
    tips: [
      'KPIs update automatically from your signings & invoices.',
      'Click "New Signing" or "New Invoice" for quick entry.',
      'Recent activity shows the last 5 changes across the app.',
    ],
  },
  {
    title: 'Clients',
    description:
      'Manage your client database. Add borrowers, signing services, title companies, and lenders. Each client tracks total revenue, contact info, and notes.',
    icon: Users,
    pageId: 'clients',
    color: 'bg-violet-500',
    tips: [
      'Search by name, email, or company.',
      'Click any client to see their lifetime revenue.',
      'Required before creating a signing or invoice.',
    ],
  },
  {
    title: 'Signings',
    description:
      'Schedule and track notary appointments. Each signing captures date, time, location, service type (Loan Signing, General Notary, etc.), fee, and status from Scheduled → Completed → Paid.',
    icon: Calendar,
    pageId: 'signings',
    color: 'bg-amber-500',
    tips: [
      'Switch between List and Calendar views.',
      'Filter by status: Scheduled, Completed, Cancelled.',
      'Completed signings flow into invoices automatically.',
    ],
  },
  {
    title: 'Email Parsing',
    description:
      'Connect your Gmail (signing services inbox) and NotaryPro will automatically detect signing requests from companies like Snapdoc, NotaryGo, etc. — then convert them to signings with one click.',
    icon: Mail,
    pageId: 'email-parsing',
    color: 'bg-pink-500',
    tips: [
      'Connects via Gmail OAuth (read-only).',
      'Strict filter: only real signing emails get parsed.',
      'Newsletters and personal emails are ignored.',
    ],
  },
  {
    title: 'Invoices',
    description:
      'Create professional invoices for completed signings. Track payment status (Draft, Sent, Paid, Overdue), generate PDFs, and resend reminders.',
    icon: FileText,
    pageId: 'invoices',
    color: 'bg-cyan-500',
    tips: [
      'Auto-generates invoice numbers (INV-0001, INV-0002…).',
      'Download PDF with one click.',
      'Mark as Paid when client pays you.',
    ],
  },
  {
    title: 'Expenses',
    description:
      'Track business expenses — mileage, supplies, software subscriptions, printing, parking. Categorize for tax time and see monthly totals.',
    icon: Receipt,
    pageId: 'expenses',
    color: 'bg-rose-500',
    tips: [
      'Categories: Mileage, Supplies, Software, Travel, Other.',
      'Mileage uses IRS standard rate automatically.',
      'Filters by month and category.',
    ],
  },
  {
    title: 'E-Journal',
    description:
      'Digital notary journal — the legal record of every notarization. Capture signer name, document type, ID type, signature, and timestamp. Required by most states.',
    icon: BookOpen,
    pageId: 'ejournal',
    color: 'bg-indigo-500',
    tips: [
      'Each entry auto-fills from completed signings.',
      'Signer signs on screen with mouse/finger/stylus.',
      'Exportable as CSV for state audits.',
    ],
  },
  {
    title: 'Reports',
    description:
      'Analytics dashboard: revenue trends, expense breakdowns, top clients, signing type distribution, and profit & loss. Filter by month, quarter, or year.',
    icon: BarChart3,
    pageId: 'reports',
    color: 'bg-teal-500',
    tips: [
      'Compare income vs expenses over time.',
      'Identify your most profitable client relationships.',
      'Charts auto-update as you add data.',
    ],
  },
  {
    title: 'Settings',
    description:
      'Configure your business profile, Telegram notifications (get pinged when a new signing comes in), email parsing connections, and data backup/export.',
    icon: SettingsIcon,
    pageId: 'settings',
    color: 'bg-slate-500',
    tips: [
      'Set up Telegram alerts for instant signing notifications.',
      'Backup all data as JSON anytime.',
      'Replay this onboarding tour from Settings → Help.',
    ],
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Only show onboarding if user hasn't completed it
    try {
      const completed = localStorage.getItem('notarypro-onboarding-completed')
      if (!completed) {
        // Slight delay so the app loads first
        const t = setTimeout(() => setOpen(true), 800)
        return () => clearTimeout(t)
      }
    } catch {
      // localStorage might be blocked; fail silently
    }
  }, [])

  const handleClose = () => {
    setOpen(false)
    try {
      localStorage.setItem('notarypro-onboarding-completed', '1')
    } catch {}
  }

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const handleSkip = () => {
    handleClose()
  }

  const handleVisitPage = () => {
    const target = steps[step].pageId
    handleClose()
    router.push(target === 'dashboard' ? '/' : `/${target}`)
  }

  const current = steps[step]
  const Icon = current.icon
  const isLast = step === steps.length - 1
  const isFirst = step === 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg sm:max-w-xl p-0 overflow-hidden gap-0">
        {/* Header with gradient */}
        <div className={`${current.color} px-6 py-8 text-white relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/30 blur-2xl" />
            <div className="absolute bottom-0 -left-4 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
          </div>
          <div className="relative flex items-start gap-4">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm shrink-0">
              {isFirst ? (
                <Sparkles className="h-7 w-7 text-white" />
              ) : (
                <Icon className="h-7 w-7 text-white" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-white mb-1">
                {current.title}
              </DialogTitle>
              <DialogDescription className="text-white/90 text-sm">
                Step {step + 1} of {steps.length}
                {isFirst && ' — Quick Tour'}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            {current.description}
          </p>

          {current.tips.length > 0 && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Quick Tips
              </p>
              {current.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-600 leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="px-6 pb-2 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-8 bg-slate-800' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-2 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-slate-500">
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            {!isFirst && !isLast && (
              <Button variant="secondary" size="sm" onClick={handleVisitPage}>
                Visit this page
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="bg-slate-900 hover:bg-slate-800">
              {isLast ? (
                <>
                  <Stamp className="h-4 w-4 mr-1" />
                  Get started
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Utility: Re-trigger onboarding (called from Settings/Help) */
export function replayOnboarding() {
  try {
    localStorage.removeItem('notarypro-onboarding-completed')
  } catch {}
  // Reload to trigger modal
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}
