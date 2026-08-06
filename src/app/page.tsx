/**
 * Landing page for NotaryPro.
 *
 * Public marketing page served at `/`. Standalone (no AppLayout sidebar).
 * CTAs route to `/dashboard` to enter the app.
 */
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Stamp,
  Rocket,
  Users,
  Calendar,
  Mail,
  FileText,
  Receipt,
  BookOpen,
  BarChart3,
  Settings as SettingsIcon,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Clock,
  TrendingUp,
  Smartphone,
  Star,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

/* ------------------------------------------------------------------ */
/*  Static content                                                     */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Rocket,
    title: 'Dashboard',
    desc: 'Revenue, pending payments, upcoming signings, and client counts at a glance. Start every day knowing exactly where your business stands.',
  },
  {
    icon: Users,
    title: 'Clients',
    desc: 'A single source of truth for every person and company you notarize for — contact details, history, and outstanding balances in one place.',
  },
  {
    icon: Calendar,
    title: 'Signings',
    desc: 'Schedule, track, and update notarization appointments through a clean status pipeline from Scheduled to Completed to Invoiced.',
  },
  {
    icon: Mail,
    title: 'Email Parsing',
    desc: 'Paste a signing-service email and NotaryPro extracts the client, date, time, location, and document type automatically. Save 90 seconds per appointment.',
  },
  {
    icon: FileText,
    title: 'Invoices',
    desc: 'Generate professional, auto-numbered invoices in one click from completed signings. Download PDFs, mark as paid, chase overdue balances.',
  },
  {
    icon: Receipt,
    title: 'Expenses',
    desc: 'Log mileage, supplies, software, and travel costs by category. Clean records mean faster tax prep and a true picture of net profit.',
  },
  {
    icon: BookOpen,
    title: 'E-Journal',
    desc: 'Tamper-evident notary journal entries — document type, signer ID, signature, fee — exported as CSV or PDF for state compliance.',
  },
  {
    icon: BarChart3,
    title: 'Reports',
    desc: 'Revenue trends, top clients, expense breakdowns, and net profit. Filter by date range and export any report for your accountant.',
  },
  {
    icon: SettingsIcon,
    title: 'Settings & Backup',
    desc: 'Business profile, granular Telegram notifications, one-click JSON backup. Your data stays under your control, always.',
  },
]

const stats = [
  { value: '9', label: 'Integrated modules' },
  { value: '<2 min', label: 'Per-appointment time saved' },
  { value: '100%', label: 'Local-first, your data' },
  { value: '24/7', label: 'Telegram alerts' },
]

const steps = [
  {
    n: '01',
    title: 'Set up your profile',
    desc: 'Add your business name, commission number, and contact details. Connect Telegram for real-time notifications.',
  },
  {
    n: '02',
    title: 'Log signings & clients',
    desc: 'Create clients, schedule signings, or paste signing-service emails to auto-create appointments in seconds.',
  },
  {
    n: '03',
    title: 'Invoice, report, repeat',
    desc: 'Convert completed signings into invoices, track expenses, run monthly reports, and back up with one click.',
  },
]

const testimonials = [
  {
    quote:
      'I used to lose 20 minutes a day typing signing details from email. NotaryPro parses them in seconds. Game-changer for solo notaries.',
    name: 'Priya M.',
    role: 'Mobile Notary, Mumbai',
  },
  {
    quote:
      'The e-journal export saved me during a state audit last quarter. Everything was timestamped, organized, and ready in 5 minutes.',
    name: 'David R.',
    role: 'Notary Signing Agent, Texas',
  },
  {
    quote:
      'Telegram alerts mean I never miss a signing request or an unpaid invoice. My cash flow has never been this predictable.',
    name: 'Aisha K.',
    role: 'Independent Notary, Dubai',
  },
]

const pricing = [
  {
    name: 'Solo',
    price: 'Free',
    period: 'forever',
    desc: 'Everything a single notary needs to run the business.',
    features: [
      'All 9 modules',
      'Local-first storage',
      'Telegram notifications',
      'E-journal CSV / PDF export',
      'Email parsing',
    ],
    cta: 'Start free',
    href: '/dashboard',
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$19',
    period: '/ mo',
    desc: 'For notary teams that need shared data and multi-device sync.',
    features: [
      'Everything in Solo',
      'Supabase cloud sync',
      'Multi-device access',
      'Up to 5 team members',
      'Priority email support',
    ],
    cta: 'Set up team',
    href: '/dashboard',
    highlighted: false,
  },
]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ---------------------------------------------------------- */}
      {/*  Top nav                                                    */}
      {/* ---------------------------------------------------------- */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-600 shadow-md shadow-emerald-600/25">
                <Stamp className="h-5 w-5 text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-base font-bold tracking-tight">NotaryPro</p>
                <p className="text-[10px] text-slate-500 -mt-0.5">Business Manager</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
              <a href="#features" className="hover:text-slate-900 transition-colors">
                Features
              </a>
              <a href="#how" className="hover:text-slate-900 transition-colors">
                How it works
              </a>
              <a href="#pricing" className="hover:text-slate-900 transition-colors">
                Pricing
              </a>
              <a href="#faq" className="hover:text-slate-900 transition-colors">
                FAQ
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/dashboard">
                  Enter App
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>

            <button
              className="md:hidden p-2 -mr-2 text-slate-700"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileNavOpen(false)}
              className="block text-sm font-medium text-slate-700 py-1"
            >
              Features
            </a>
            <a
              href="#how"
              onClick={() => setMobileNavOpen(false)}
              className="block text-sm font-medium text-slate-700 py-1"
            >
              How it works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileNavOpen(false)}
              className="block text-sm font-medium text-slate-700 py-1"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileNavOpen(false)}
              className="block text-sm font-medium text-slate-700 py-1"
            >
              FAQ
            </a>
            <div className="pt-3 flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Link href="/dashboard">
                  Enter App
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ---------------------------------------------------------- */}
      {/*  Hero                                                       */}
      {/* ---------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        {/* Background gradient + grid */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-slate-50" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <div className="space-y-7">
              <Badge
                variant="outline"
                className="bg-emerald-50 border-emerald-200 text-emerald-700 px-3 py-1"
              >
                <Zap className="h-3 w-3 mr-1" />
                Built for modern notaries
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                Run your notary business
                <span className="block text-emerald-600">like a pro.</span>
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                NotaryPro brings your signings, clients, invoices, expenses, and
                e-journal into one clean dashboard. Stop juggling spreadsheets
                and sticky notes — start notarizing.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-base h-12 px-7">
                  <Link href="/dashboard">
                    Get started free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base h-12 px-7">
                  <a href="#features">See features</a>
                </Button>
              </div>

              <div className="flex items-center gap-4 pt-2 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  No credit card
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Local-first
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Setup in 2 min
                </div>
              </div>
            </div>

            {/* Right: mock dashboard preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-200 to-slate-200 rounded-3xl blur-2xl opacity-50" />
              <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50 overflow-hidden">
                {/* Mock window chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-3 text-[11px] text-slate-500 font-mono">
                    notarypro.app/dashboard
                  </span>
                </div>

                {/* Mock dashboard body */}
                <div className="p-5 space-y-4 bg-slate-50/50">
                  {/* KPI row */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Revenue', value: '$12,450', icon: TrendingUp, color: 'text-emerald-600' },
                      { label: 'Signings', value: '38', icon: Calendar, color: 'text-blue-600' },
                      { label: 'Clients', value: '124', icon: Users, color: 'text-purple-600' },
                      { label: 'Pending', value: '$2,300', icon: Clock, color: 'text-amber-600' },
                    ].map((kpi) => {
                      const Icon = kpi.icon
                      return (
                        <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                              {kpi.label}
                            </span>
                            <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                          </div>
                          <p className="text-xl font-bold tracking-tight">{kpi.value}</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Mock chart */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-700">Revenue trend</span>
                      <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">
                        +18%
                      </Badge>
                    </div>
                    <div className="flex items-end gap-1.5 h-20">
                      {[40, 55, 35, 70, 60, 85, 75, 95].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Mock list */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <span className="text-xs font-semibold text-slate-700">Upcoming signings</span>
                    {[
                      { n: 'Acme Loan Signing', t: 'Today, 2:00 PM' },
                      { n: 'Patel Refinance', t: 'Tomorrow, 10:00 AM' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center">
                            {s.n[0]}
                          </div>
                          <span className="text-xs text-slate-700">{s.n}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{s.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Stats bar                                                  */}
      {/* ---------------------------------------------------------- */}
      <section className="border-y border-slate-100 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-emerald-400">{s.value}</p>
                <p className="text-xs md:text-sm text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Features                                                   */}
      {/* ---------------------------------------------------------- */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <Badge variant="outline" className="mb-3 bg-emerald-50 border-emerald-200 text-emerald-700">
              One tool, every workflow
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything your notary business needs
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Nine tightly-integrated modules replace the spreadsheets, sticky
              notes, and copy-paste between tools that eat your day. Each one is
              built specifically for notaries — not generic small-business
              software bolted on.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <Card
                  key={f.title}
                  className="hover:shadow-lg hover:border-emerald-200 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-emerald-100 text-emerald-700 mb-4">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1.5">{f.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  How it works                                               */}
      {/* ---------------------------------------------------------- */}
      <section id="how" className="py-20 lg:py-28 bg-slate-50 border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <Badge variant="outline" className="mb-3 bg-white border-slate-200 text-slate-700">
              <Clock className="h-3 w-3 mr-1" />
              Setup in under 2 minutes
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              From zero to running in 3 steps
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              No lengthy onboarding. No data migration. Add your profile, log
              your first signing, and you&apos;re running a real notary business
              in the time it takes to make coffee.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <div className="rounded-2xl bg-white border border-slate-200 p-7 h-full shadow-sm">
                  <div className="text-4xl font-bold text-emerald-600 mb-4">{s.n}</div>
                  <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/dashboard">
                Try it now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Testimonials                                               */}
      {/* ---------------------------------------------------------- */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <Badge variant="outline" className="mb-3 bg-amber-50 border-amber-200 text-amber-700">
              <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
              Loved by notaries worldwide
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Don&apos;t take our word for it
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Solo notaries, signing agents, and small teams use NotaryPro to
              reclaim hours every week.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} className="h-full">
                <CardContent className="pt-6 flex flex-col h-full">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed flex-1 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Pricing                                                    */}
      {/* ---------------------------------------------------------- */}
      <section id="pricing" className="py-20 lg:py-28 bg-slate-50 border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <Badge variant="outline" className="mb-3 bg-white border-slate-200 text-slate-700">
              Simple pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Start free. Upgrade when you grow.
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Every feature is available on the free plan for solo notaries.
              Upgrade to Team only when you need cloud sync and multi-device
              access.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {pricing.map((p) => (
              <Card
                key={p.name}
                className={
                  p.highlighted
                    ? 'border-emerald-300 shadow-xl shadow-emerald-100 relative'
                    : ''
                }
              >
                {p.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600 px-3 py-1">Most popular</Badge>
                  </div>
                )}
                <CardContent className="pt-7">
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <p className="text-sm text-slate-600 mt-1 mb-5">{p.desc}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                    <span className="text-sm text-slate-500">{p.period}</span>
                  </div>
                  <ul className="space-y-3 mb-7">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={
                      p.highlighted
                        ? 'w-full bg-emerald-600 hover:bg-emerald-700'
                        : 'w-full'
                    }
                    variant={p.highlighted ? 'default' : 'outline'}
                  >
                    <Link href={p.href}>
                      {p.cta}
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  FAQ                                                        */}
      {/* ---------------------------------------------------------- */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-3 bg-emerald-50 border-emerald-200 text-emerald-700">
              FAQ
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Questions, answered
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Where is my data stored?',
                a: 'By default, all data lives locally in your browser. You can export a JSON backup any time from Settings. On the Team plan, data syncs through your own Supabase project — still fully under your control.',
              },
              {
                q: 'Does the E-Journal satisfy state compliance?',
                a: 'The E-Journal captures the fields most states require (date, signer, ID type/number, document type, signature, fee). Always verify against your state\'s current notary handbook before relying on it as your sole record.',
              },
              {
                q: 'Can I use NotaryPro on mobile?',
                a: 'Yes — NotaryPro is fully responsive. The sidebar collapses into a slide-out menu on small screens. Add it to your home screen for an app-like experience.',
              },
              {
                q: 'How does email parsing work?',
                a: 'Paste the body of any signing-service email into the Email Parsing module. NotaryPro extracts client name, date, time, location, and document type automatically. You review and confirm — no manual retyping.',
              },
              {
                q: 'Do I need a credit card to start?',
                a: 'No. The Solo plan is free forever and includes every feature. Upgrade to Team only when you need multi-device sync or team collaboration.',
              },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2 flex items-start gap-2">
                    <span className="text-emerald-600 font-mono text-sm mt-0.5">Q{i + 1}.</span>
                    <span>{item.q}</span>
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed pl-7">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500 mb-3">Still have questions?</p>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                Open the in-app Guide
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Final CTA                                                  */}
      {/* ---------------------------------------------------------- */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-10 lg:p-16 text-center">
            <div className="absolute inset-0 -z-0 opacity-20">
              <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-emerald-500 blur-3xl" />
              <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-emerald-500 blur-3xl" />
            </div>
            <div className="relative space-y-5">
              <div className="flex justify-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/30">
                  <Stamp className="h-6 w-6 text-white" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Ready to run your notary business like a pro?
              </h2>
              <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Join thousands of notaries who stopped fighting spreadsheets and
                started saving hours every week. Free forever for solo notaries.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-12 px-7">
                  <Link href="/dashboard">
                    Get started free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 px-7 bg-transparent border-slate-600 text-white hover:bg-slate-800 hover:text-white"
                >
                  <a href="#features">Learn more</a>
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-5 pt-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Local-first by default
                </span>
                <span className="flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" />
                  Works on any device
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  No credit card needed
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Footer                                                     */}
      {/* ---------------------------------------------------------- */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-3">
              <Link href="/" className="flex items-center gap-2.5 w-fit">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-600">
                  <Stamp className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-bold">NotaryPro</span>
              </Link>
              <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
                The all-in-one business manager for modern notaries. Track
                signings, clients, invoices, expenses, and your e-journal — all
                in one place.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">Product</p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#features" className="hover:text-slate-900">Features</a></li>
                <li><a href="#pricing" className="hover:text-slate-900">Pricing</a></li>
                <li><Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link></li>
                <li><Link href="/guide" className="hover:text-slate-900">Guide</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">Resources</p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#faq" className="hover:text-slate-900">FAQ</a></li>
                <li><Link href="/guide" className="hover:text-slate-900">Help center</Link></li>
                <li><a href="#how" className="hover:text-slate-900">How it works</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} NotaryPro. All rights reserved.
            </p>
            <p className="text-xs text-slate-500">
              Built for notaries, by people who get it.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
