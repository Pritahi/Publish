/**
 * NotaryPro SaaS — API Integration Tests
 *
 * Run with: bun test
 * Or: npx jest
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

describe('Clients API', () => {
  it('should return clients list', async () => {
    const response = await fetch('http://localhost:3000/api/clients')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })
})

describe('Signings API', () => {
  it('should return signings list', async () => {
    const response = await fetch('http://localhost:3000/api/signings')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })
})

describe('Invoices API', () => {
  it('should return invoices list', async () => {
    const response = await fetch('http://localhost:3000/api/invoices')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })
})

describe('Expenses API', () => {
  it('should return expenses list', async () => {
    const response = await fetch('http://localhost:3000/api/expenses')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })
})

describe('Reports API', () => {
  it('should return reports data', async () => {
    const response = await fetch('http://localhost:3000/api/reports')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('totalClients')
    expect(data).toHaveProperty('totalRevenue')
    expect(data).toHaveProperty('monthlyRevenue')
  })
})
