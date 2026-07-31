/**
 * NotaryPro SaaS — API Integration Tests
 *
 * Run with: bun test
 *
 * Note: The development server must be running on localhost:3000
 * for these tests to work.
 */

import { describe, it, expect } from 'bun:test'

describe('Health Check API', () => {
  it('should return healthy status', async () => {
    const response = await fetch('http://localhost:3000/api/health')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.service).toBe('NotaryPro SaaS')
    expect(data.database).toBe('connected')
  })
})
