'use client'

import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Receipt,
  BarChart3,
  Stamp,
  Menu,
  BookOpen,
  Settings as SettingsIcon,
  Bell,
  Mail,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { OnboardingModal } from './onboarding-modal'

interface AppLayoutProps {
  children: React.ReactNode
}

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview — KPIs, upcoming signings, recent activity, and quick actions.',
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    description: 'Manage your client database — borrowers, signing services, title companies.',
  },
  {
    id: 'signings',
    label: 'Signings',
    icon: Calendar,
    description: 'Schedule and track notary appointments with status workflow.',
  },
  {
    id: 'email-parsing',
    label: 'Email Parsing',
    icon: Mail,
    description: 'Connect Gmail to auto-detect signing requests from signing services.',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: FileText,
    description: 'Create invoices, track payment status, and generate PDFs.',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: Receipt,
    description: 'Track business expenses — mileage, supplies, software, travel.',
  },
  {
    id: 'ejournal',
    label: 'E-Journal',
    icon: BookOpen,
    description: 'Digital notary journal with signature capture for state compliance.',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    description: 'Analytics — revenue, expenses, top clients, signing type distribution.',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    description: 'Telegram alerts, email connections, data backup, and business profile.',
  },
  {
    id: 'guide',
    label: 'Guide & Help',
    icon: HelpCircle,
    description: 'Full page-by-page guide, FAQs, and replay onboarding tour.',
  },
]

function NotificationBell({ onClick }: { onClick: () => void }) {
  const [count, setCount] = useState(0)
  const [enabled, setEnabled] = useState(false)

  React.useEffect(() => {
    const check = () => {
      try {
        const tg = JSON.parse(localStorage.getItem('notarypro-telegram') || '{}')
        setEnabled(!!tg.enabled && !!tg.chatId)
        const logs = JSON.parse(localStorage.getItem('notarypro-notification-log') || '[]')
        const recent = logs.filter((l: any) => {
          const sentAt = new Date(l.sentAt)
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
          return sentAt > hourAgo && l.success
        })
        setCount(recent.length)
      } catch {}
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!enabled) return null

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}

function SidebarNav({
  activePage,
  setActivePage,
  onNavigate,
}: {
  activePage: string
  setActivePage: (page: string) => void
  onNavigate?: () => void
}) {
  // Separate main nav from Guide (Guide goes at the bottom)
  const mainItems = navItems.filter((i) => i.id !== 'guide')
  const guideItem = navItems.find((i) => i.id === 'guide')!

  const renderNavButton = (item: typeof navItems[number]) => {
    const Icon = item.icon
    const isActive = activePage === item.id
    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              setActivePage(item.id)
              onNavigate?.()
            }}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 w-full',
              isActive
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs text-xs">
          <p className="font-semibold mb-0.5">{item.label}</p>
          <p className="text-slate-300 font-normal leading-relaxed">{item.description}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {mainItems.map(renderNavButton)}
      <div className="my-2 border-t border-slate-800" />
      {renderNavButton(guideItem)}
    </nav>
  )
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Derive activePage from URL pathname
  // '/' -> 'dashboard', '/clients' -> 'clients', '/email-parsing' -> 'email-parsing'
  const activePage = pathname === '/' ? 'dashboard' : pathname.slice(1)

  // Map setActivePage to URL navigation
  const setActivePage = (page: string) => {
    router.push(page === 'dashboard' ? '/' : `/${page}`)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <OnboardingModal />
      <div className="flex h-screen overflow-hidden bg-slate-50">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 bg-slate-900 text-white z-30">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-600 shadow-lg shadow-emerald-600/30">
              <Stamp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">NotaryPro</h1>
              <p className="text-[11px] text-slate-400 leading-none">Business Manager</p>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <SidebarNav activePage={activePage} setActivePage={setActivePage} />
          </ScrollArea>

          {/* Bottom */}
          <div className="px-5 py-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <NotificationBell onClick={() => setActivePage('settings')} />
              <p className="text-xs text-slate-500">NotaryPro</p>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar (Sheet) */}
        <div className="lg:hidden fixed inset-0 z-40 pointer-events-none">
          <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-600">
                <Stamp className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">NotaryPro</span>
            </div>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-700">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 bg-slate-900 text-white border-slate-700">
                <SheetHeader className="px-5 py-5 border-b border-slate-800">
                  <SheetTitle className="flex items-center gap-3 text-white">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-600">
                      <Stamp className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold">NotaryPro</p>
                      <p className="text-[11px] text-slate-400 leading-none">Business Manager</p>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 py-4">
                  <SidebarNav
                    activePage={activePage}
                    setActivePage={setActivePage}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </ScrollArea>
                <div className="px-5 py-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <NotificationBell onClick={() => { setActivePage('settings'); setMobileOpen(false) }} />
                    <p className="text-xs text-slate-500">NotaryPro</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:pl-[260px] overflow-auto">
          <div className="p-4 lg:p-6 pt-16 lg:pt-6 min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
