'use client'

import { Suspense } from 'react'
import { AppLayout } from '@/components/notarypro/app-layout'
import EmailParsingView from '@/components/notarypro/email-parsing-view'

/**
 * EmailParsingView now reads URL search params (the `?gmail=connected|failed`
 * flag set by the OAuth callback). Next.js 16 requires `useSearchParams()`
 * to be wrapped in a Suspense boundary, so we wrap it here at the page level.
 */
export default function EmailParsingPage() {
  return (
    <AppLayout>
      <Suspense fallback={null}>
        <EmailParsingView />
      </Suspense>
    </AppLayout>
  )
}
