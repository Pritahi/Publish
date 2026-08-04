import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()

    // Check database connectivity by querying the users table with a minimal request
    const { error } = await db
      .from('users')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    if (error) {
      console.error('Health check DB error:', error)
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          service: 'NotaryPro SaaS',
          version: '1.0.0',
          database: 'disconnected',
          error: 'Database connection failed',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'NotaryPro SaaS',
      version: '1.0.0',
      database: 'connected',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'NotaryPro SaaS',
        version: '1.0.0',
        database: 'disconnected',
        error: 'Database connection failed',
      },
      { status: 503 }
    )
  }
}
