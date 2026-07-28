# NotaryPro SaaS — API Documentation

Base URL: `http://localhost:3000/api`

All endpoints return JSON. Authentication is via NextAuth.js session cookies.

---

## Table of Contents

- [Authentication](#authentication)
- [Health Check](#health-check)
- [Clients](#clients)
- [Signings](#signings)
- [Invoices](#invoices)
- [Expenses](#expenses)
- [Reports](#reports)
- [Telegram Notifications](#telegram-notifications)
- [Database Seeding](#database-seeding)

---

## Authentication

### POST `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response (201):**
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "clx...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error (409):**
```json
{ "error": "An account with this email already exists" }
```

### POST `/api/auth/callback/credentials`

Sign in via NextAuth credentials provider. Handled by NextAuth.js internally.

---

## Health Check

### GET `/api/health`

Returns application and database health status.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "service": "NotaryPro SaaS",
  "version": "1.0.0",
  "database": "connected"
}
```

**Response (503):**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Database connection failed"
}
```

---

## Clients

### GET `/api/clients`

List all clients with signing/invoice counts and total revenue.

**Response (200):**
```json
[
  {
    "id": "clx...",
    "name": "Maria Gonzalez",
    "email": "maria@email.com",
    "phone": "(305) 555-0142",
    "company": "Gonzalez & Associates LLC",
    "address": "1240 Brickell Ave, Miami, FL 33131",
    "notes": "Prefers afternoon appointments.",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "totalRevenue": 525.00,
    "_count": { "signings": 5, "invoices": 3 }
  }
]
```

### POST `/api/clients`

Create a new client.

**Request Body:**
```json
{
  "name": "Maria Gonzalez",
  "email": "maria@email.com",
  "phone": "(305) 555-0142",
  "company": "Gonzalez & Associates LLC",
  "address": "1240 Brickell Ave, Miami, FL 33131",
  "notes": "Prefers afternoon appointments."
}
```

| Field | Required | Type |
|-------|----------|------|
| name | Yes | string |
| email | No | string |
| phone | No | string |
| company | No | string |
| address | No | string |
| notes | No | string |

### PUT `/api/clients`

Update a client.

**Request Body:**
```json
{
  "id": "clx...",
  "name": "Maria Gonzalez-Updated",
  "email": "maria.new@email.com"
}
```

### DELETE `/api/clients`

Delete a client (cascades to related signings and invoices).

**Request Body:**
```json
{ "id": "clx..." }
```

### GET `/api/clients/[id]`

Get a single client with their signings and invoices.

**Response (200):**
```json
{
  "id": "clx...",
  "name": "Maria Gonzalez",
  "signings": [...],
  "invoices": [...]
}
```

### PUT `/api/clients/[id]`

Update a client by ID.

### DELETE `/api/clients/[id]`

Delete a client by ID.

---

## Signings

### GET `/api/signings`

List signings with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status: `Scheduled`, `Completed`, `Cancelled` |
| serviceType | string | Filter by service type |
| month | string | Filter by month (YYYY-MM format) |

**Response (200):**
```json
[
  {
    "id": "clx...",
    "clientId": "clx...",
    "date": "2025-01-15T00:00:00.000Z",
    "time": "10:00 AM",
    "location": "123 Main St, Miami, FL",
    "serviceType": "Real Estate Closing",
    "fee": 250.00,
    "status": "Completed",
    "notes": "Property deed transfer.",
    "mileage": 18.0,
    "client": {
      "id": "clx...",
      "name": "Maria Gonzalez",
      "email": "maria@email.com",
      "phone": "(305) 555-0142"
    }
  }
]
```

### POST `/api/signings`

Create a new signing.

**Request Body:**
```json
{
  "clientId": "clx...",
  "date": "2025-01-15",
  "time": "10:00 AM",
  "location": "123 Main St, Miami, FL",
  "serviceType": "Real Estate Closing",
  "fee": 250.00,
  "status": "Scheduled",
  "notes": "Property deed transfer.",
  "mileage": 18
}
```

| Field | Required | Type | Default |
|-------|----------|------|---------|
| clientId | Yes | string | — |
| date | Yes | string (ISO date) | — |
| location | Yes | string | — |
| time | No | string | null |
| serviceType | No | string | "General Notary" |
| fee | No | number | 0 |
| status | No | string | "Scheduled" |
| notes | No | string | null |
| mileage | No | number | null |

### PUT `/api/signings`

Update a signing.

### DELETE `/api/signings`

Delete a signing.

### GET `/api/signings/[id]`

Get a single signing with client details.

### PUT `/api/signings/[id]`

Update a signing by ID.

### DELETE `/api/signings/[id]`

Delete a signing by ID.

---

## Invoices

### GET `/api/invoices`

List invoices with optional status filter.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status: `Unpaid`, `Paid`, `Overdue` |

**Response (200):**
```json
[
  {
    "id": "clx...",
    "invoiceNo": "INV-0001",
    "clientId": "clx...",
    "signingId": "clx...",
    "amount": 250.00,
    "status": "Paid",
    "issuedDate": "2025-01-01T00:00:00.000Z",
    "dueDate": "2025-02-01T00:00:00.000Z",
    "paidDate": "2025-01-20T00:00:00.000Z",
    "client": { "id": "clx...", "name": "Maria Gonzalez" },
    "signing": { "id": "clx...", "serviceType": "Real Estate Closing", "date": "..." }
  }
]
```

### POST `/api/invoices`

Create a new invoice. Invoice number is auto-generated.

**Request Body:**
```json
{
  "clientId": "clx...",
  "signingId": "clx...",
  "amount": 250.00,
  "dueDate": "2025-02-01",
  "notes": "Real estate closing."
}
```

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| clientId | Yes | string | — |
| amount | Yes | number | — |
| signingId | No | string | Links to a signing |
| dueDate | No | string (ISO date) | — |
| notes | No | string | — |

### PUT `/api/invoices`

Update an invoice. Setting status to `"Paid"` automatically sets `paidDate`.

**Request Body:**
```json
{
  "id": "clx...",
  "status": "Paid"
}
```

### DELETE `/api/invoices`

Delete an invoice.

### GET `/api/invoices/[id]`

Get a single invoice with client and signing details.

### PUT `/api/invoices/[id]`

Update an invoice by ID.

### DELETE `/api/invoices/[id]`

Delete an invoice by ID.

---

## Expenses

### GET `/api/expenses`

List expenses with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| month | string | Filter by month (YYYY-MM format) |

**Response (200):**
```json
[
  {
    "id": "clx...",
    "category": "Gas",
    "description": "Gas for mobile notary appointments",
    "amount": 67.50,
    "date": "2025-01-03T00:00:00.000Z",
    "receiptUrl": null,
    "notes": "Shell station fill-ups"
  }
]
```

### POST `/api/expenses`

Create a new expense.

**Request Body:**
```json
{
  "category": "Gas",
  "description": "Gas for appointments",
  "amount": 67.50,
  "date": "2025-01-03",
  "receiptUrl": "https://example.com/receipt.pdf",
  "notes": "Shell station fill-ups"
}
```

| Field | Required | Type |
|-------|----------|------|
| category | Yes | string |
| description | Yes | string |
| amount | Yes | number |
| date | Yes | string (ISO date) |
| receiptUrl | No | string |
| notes | No | string |

### PUT `/api/expenses`

Update an expense.

### DELETE `/api/expenses`

Delete an expense.

### GET `/api/expenses/[id]`

Get a single expense.

### PUT `/api/expenses/[id]`

Update an expense by ID.

### DELETE `/api/expenses/[id]`

Delete an expense by ID.

---

## Reports

### GET `/api/reports`

Get comprehensive business reports and analytics.

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| period | string | `thisMonth`, `lastMonth`, `thisYear`, `allTime` | `thisMonth` |

**Response (200):**
```json
{
  "totalClients": 8,
  "totalSignings": 15,
  "totalRevenue": 1545.00,
  "pendingPayments": 445.00,
  "overduePayments": 260.00,
  "totalExpenses": 506.74,
  "totalMileage": 233,
  "totalIncome": 1545.00,
  "netProfit": 1038.26,
  "mileageDeduction": 156.11,
  "completedSignings": 15,
  "monthlyRevenue": [
    { "month": "Jan", "revenue": 460 },
    { "month": "Feb", "revenue": 340 },
    { "month": "Mar", "revenue": 745 }
  ],
  "expenseCategories": [
    { "category": "Gas", "amount": 67.50 },
    { "category": "Office Supplies", "amount": 45.00 }
  ],
  "signingsByType": [
    { "type": "Loan Signing", "count": 5 },
    { "type": "Real Estate Closing", "count": 3 }
  ],
  "topClients": [
    { "name": "Pacific Coast Title", "totalRevenue": 400, "signingCount": 2 }
  ],
  "recentSignings": [...],
  "upcomingSignings": [...]
}
```

---

## Telegram Notifications

### POST `/api/telegram/notify`

Send a Telegram notification message.

**Request Body:**
```json
{
  "chatId": "123456789",
  "message": "<b>Hello</b> from NotaryPro",
  "botToken": "optional_custom_token",
  "parseMode": "HTML"
}
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| chatId | Yes | string | Telegram chat ID |
| message | Yes | string | HTML or Markdown formatted message |
| botToken | No | string | Custom bot token (falls back to env var) |
| parseMode | No | string | `HTML` (default) or `Markdown` |

**Response (200):**
```json
{
  "success": true,
  "messageId": 123,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### GET `/api/telegram/notify?token=<bot_token>`

Validate a Telegram bot token.

**Response (200):**
```json
{
  "valid": true,
  "bot": {
    "id": 123456,
    "name": "NotaryProBot",
    "username": "notarypro_bot"
  }
}
```

---

## Database Seeding

### POST `/api/seed`

⚠️ **WARNING**: This endpoint deletes ALL existing data and replaces it with demo data.

**Response (200):**
```json
{
  "success": true,
  "message": "Demo data seeded successfully",
  "counts": {
    "clients": 8,
    "signings": 15,
    "invoices": 12,
    "expenses": 10
  }
}
```

---

## Error Responses

All API endpoints return consistent error responses:

```json
{ "error": "Description of the error" }
```

Common HTTP status codes:
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Internal Server Error |
| 503 | Service Unavailable (database down) |
