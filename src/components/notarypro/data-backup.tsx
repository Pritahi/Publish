/**
 * DataBackup — Backup and restore utility component.
 * Exports all data as JSON and supports importing from backup files.
 */
'use client'

import React, { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Download, Upload, Database, HardDrive } from 'lucide-react'
import { toast } from 'sonner'

interface BackupData {
  clients: unknown[]
  signings: unknown[]
  invoices: unknown[]
  expenses: unknown[]
  exportDate: string
}

export function DataBackup() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [lastBackup, setLastBackup] = React.useState<string | null>(null)

  React.useEffect(() => {
    const saved = localStorage.getItem('notarypro-last-backup')
    if (saved) {
      setLastBackup(saved)
    }
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const [clientsRes, signingsRes, invoicesRes, expensesRes] = await Promise.allSettled([
        fetch('/api/clients'),
        fetch('/api/signings'),
        fetch('/api/invoices'),
        fetch('/api/expenses'),
      ])

      const clients = clientsRes.status === 'fulfilled' && clientsRes.value.ok ? await clientsRes.value.json() : []
      const signings = signingsRes.status === 'fulfilled' && signingsRes.value.ok ? await signingsRes.value.json() : []
      const invoices = invoicesRes.status === 'fulfilled' && invoicesRes.value.ok ? await invoicesRes.value.json() : []
      const expenses = expensesRes.status === 'fulfilled' && expensesRes.value.ok ? await expensesRes.value.json() : []

      const backupData: BackupData = {
        clients,
        signings,
        invoices,
        expenses,
        exportDate: new Date().toISOString(),
      }

      const json = JSON.stringify(backupData, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dateStr = new Date().toISOString().split('T')[0]
      a.href = url
      a.download = `notarypro-backup-${dateStr}.json`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      localStorage.setItem('notarypro-last-backup', new Date().toLocaleString())
      setLastBackup(new Date().toLocaleString())

      toast.success('Backup exported successfully', {
        description: `${clients.length} clients, ${signings.length} signings, ${invoices.length} invoices, ${expenses.length} expenses`,
      })
    } catch {
      toast.error('Failed to export backup')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as BackupData

      // Validate structure
      if (
        !data.clients ||
        !data.signings ||
        !data.invoices ||
        !data.expenses ||
        !Array.isArray(data.clients) ||
        !Array.isArray(data.signings) ||
        !Array.isArray(data.invoices) ||
        !Array.isArray(data.expenses)
      ) {
        toast.error('Invalid backup file', {
          description: 'File must contain clients, signings, invoices, and expenses arrays.',
        })
        return
      }

      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast.success('Backup imported successfully', {
          description: 'Your data has been restored from the backup file.',
        })
      } else {
        toast.error('Failed to restore backup', {
          description: 'Server error. Please try again.',
        })
      }
    } catch (err) {
      toast.error('Failed to import backup', {
        description: 'The file is not a valid JSON backup.',
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export */}
        <Card className="border-slate-200/60 hover:border-emerald-200 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <Database className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Export Backup</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Download a complete backup of all your data as JSON.
                  </p>
                </div>
                <Button
                  onClick={handleExport}
                  disabled={exporting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? 'Exporting...' : 'Export Data'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import */}
        <Card className="border-slate-200/60 hover:border-emerald-200 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <HardDrive className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Import Backup</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Restore data from a previously exported JSON backup file.
                  </p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="gap-2 w-full sm:w-auto border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                  >
                    <Upload className="h-4 w-4" />
                    {importing ? 'Importing...' : 'Import Data'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Backup Info */}
      <div className="text-xs text-slate-400 text-center">
        {lastBackup ? (
          <span>Last backup: {lastBackup}</span>
        ) : (
          <span>No backups recorded yet</span>
        )}
      </div>
    </div>
  )
}
