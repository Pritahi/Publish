'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Building2, Database, Info, Save } from 'lucide-react'
import { DataBackup } from './data-backup'
import { toast } from 'sonner'

interface ProfileData {
  businessName: string
  commissionNumber: string
  state: string
  phone: string
  email: string
  commissionExpiry: string
}

const defaultProfile: ProfileData = {
  businessName: 'My Notary Business',
  commissionNumber: '',
  state: '',
  phone: '',
  email: '',
  commissionExpiry: '',
}

export default function SettingsView() {
  const [profile, setProfile] = useState<ProfileData>(() => {
    if (typeof window === 'undefined') return defaultProfile
    try {
      const stored = localStorage.getItem('notarypro-profile')
      if (stored) return JSON.parse(stored) as ProfileData
    } catch {
      // ignore parse errors
    }
    return defaultProfile
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem('notarypro-profile', JSON.stringify(profile))
    setSaved(true)
    toast.success('Business profile saved')
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setProfile(defaultProfile)
    localStorage.removeItem('notarypro-profile')
    toast.info('Profile reset to defaults')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your business profile and application preferences</p>
      </div>

      {/* Business Profile */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            Business Profile
          </CardTitle>
          <CardDescription>
            Your notary business information used across the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                placeholder="My Notary Business"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission-number">Commission Number</Label>
              <Input
                id="commission-number"
                value={profile.commissionNumber}
                onChange={(e) => setProfile({ ...profile, commissionNumber: e.target.value })}
                placeholder="Notary commission #"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                placeholder="e.g. California"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="notary@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission-expiry">Commission Expiry Date</Label>
              <Input
                id="commission-expiry"
                type="date"
                value={profile.commissionExpiry}
                onChange={(e) => setProfile({ ...profile, commissionExpiry: e.target.value })}
              />
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Save className="h-4 w-4" />
              Save Profile
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            {saved && (
              <span className="text-xs text-emerald-600 font-medium">Saved!</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-600" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export your data for backup or import from a previous backup file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataBackup />
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-500" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Application</span>
              <span className="text-sm font-medium text-slate-900">NotaryPro</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Version</span>
              <span className="text-sm font-mono text-slate-900">1.0.0</span>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-slate-600 mb-1">NotaryPro - Mobile Notary Business Manager</p>
              <p className="text-xs text-slate-400">Built for professional notaries and loan signing agents</p>
            </div>
            <div className="pt-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Production
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
