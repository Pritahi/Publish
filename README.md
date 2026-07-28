# NotaryPro SaaS

> Complete Notary ERP Platform for managing signings, clients, invoices, expenses and e-journal

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-blue?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-blue?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Overview

**NotaryPro SaaS** is a full-featured, production-ready Notary ERP platform built for mobile notaries, signing agents, and notary businesses. Manage your entire business from a single dashboard — clients, signings, invoices, expenses, e-journal, and reporting — all in one place.

Built with **Next.js 16**, **TypeScript**, **Prisma ORM**, and **shadcn/ui** for a modern, responsive, and maintainable codebase.

---

## ✨ Features

### Core Business Management
- **Client Management** — Full CRM with contact details, company info, and revenue tracking
- **Signing Scheduling** — Schedule, track, and manage notary signings with status workflow
- **Invoicing** — Create, send, and track invoices with auto-numbering and payment status
- **Expense Tracking** — Track business expenses by category with receipt management
- **E-Journal** — Digital notary journal with signature capture and document logging
- **Reports & Analytics** — Revenue charts, expense breakdowns, top clients, and monthly trends

### Platform Features
- **Authentication** — Secure login/register with NextAuth.js (credentials provider)
- **Telegram Notifications** — Real-time alerts for signings, invoices, and payments
- **Data Export** — CSV export for all data types
- **PDF Invoices** — Generate professional PDF invoices
- **Dashboard** — At-a-glance KPIs, upcoming signings, recent activity
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Dark/Light Mode** — Theme support via next-themes
- **Health Check** — `/api/health` endpoint for monitoring

---

## 🖼️ Screenshots

| Dashboard | Clients | Signings |
|-----------|---------|----------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Clients](docs/screenshots/clients.png) | ![Signings](docs/screenshots/signings.png) |

| Invoices | Expenses | Reports |
|----------|----------|---------|
| ![Invoices](docs/screenshots/invoices.png) | ![Expenses](docs/screenshots/expenses.png) | ![Reports](docs/screenshots/reports.png) |

> 📝 Add your own screenshots to `docs/screenshots/` directory

---

## 🏗️ Architecture

```
NotaryPro SaaS/
├── prisma/                  # Database schema & migrations
│   └── schema.prisma        # Prisma schema (SQLite/PostgreSQL)
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API routes (REST)
│   │   │   ├── auth/        # NextAuth endpoints
│   │   │   ├── clients/     # Client CRUD
│   │   │   ├── signings/    # Signing CRUD
│   │   │   ├── invoices/    # Invoice CRUD
│   │   │   ├── expenses/    # Expense CRUD
│   │   │   ├── reports/     # Reports & analytics
│   │   │   ├── health/      # Health check
│   │   │   ├── seed/        # Demo data seeding
│   │   │   └── telegram/    # Telegram notifications
│   │   ├── (auth)/login/    # Login page
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main app (SPA)
│   ├── components/
│   │   ├── notarypro/       # Domain-specific components
│   │   └── ui/              # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── db.ts            # Prisma client singleton
│   │   ├── telegram.ts      # Telegram notification system
│   │   └── utils.ts         # Utility functions
│   ├── hooks/               # Custom React hooks
│   └── middleware.ts        # Auth middleware
├── public/                  # Static assets
├── Dockerfile               # Production Docker build
├── docker-compose.yml       # Docker Compose setup
└── docker-entrypoint.sh     # Docker entrypoint script
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | Prisma ORM (SQLite dev / PostgreSQL prod) |
| UI | shadcn/ui + Tailwind CSS 4 |
| Auth | NextAuth.js v4 |
| Charts | Recharts |
| PDF | @react-pdf/renderer |
| Notifications | Telegram Bot API |
| State | Zustand + React Query |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ or **Bun** runtime
- **npm**, **yarn**, or **bun** package manager

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/notarypro-saas.git
cd notarypro-saas

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Set up the database
npx prisma db push

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Seed Demo Data

```bash
# Seed the database with sample data
curl -X POST http://localhost:3000/api/seed
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Database connection string. Use `file:./dev.db` for SQLite or `postgresql://user:pass@host:5432/db` for PostgreSQL |
| `NEXTAUTH_SECRET` | Yes | Secret key for NextAuth.js session encryption. Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Your app URL. Use `http://localhost:3000` for development |
| `TELEGRAM_BOT_TOKEN` | No | Telegram Bot API token for notifications. Create via [@BotFather](https://t.me/BotFather) |

---

## 🐳 Docker Deployment

### Build and Run

```bash
# Build the Docker image
docker build -t notarypro-saas .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL=file:/app/data/notarypro.db \
  -e NEXTAUTH_SECRET=your_secret_here \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -v notarypro-data:/app/data \
  notarypro-saas
```

### Docker Compose

```bash
# Start with Docker Compose
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

---

## 🗄️ Database

### SQLite (Default - Development)
The default setup uses SQLite, which requires no additional setup. The database file is created automatically.

### PostgreSQL (Production)
For production deployments, switch to PostgreSQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/notarypro"
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

---

## 📡 API Documentation

See [docs/API.md](docs/API.md) for complete API documentation.

---

## 🔒 Security

- **Authentication**: NextAuth.js with JWT sessions and bcrypt password hashing
- **Route Protection**: Middleware-based auth guards on all protected routes
- **Input Validation**: Zod schemas on all API endpoints
- **SQL Injection**: Protected by Prisma ORM parameterized queries
- **Rate Limiting**: Recommended for production — use `next-rate-limit` or a reverse proxy
- **CORS**: Configure via Next.js config for production domains

### Production Recommendations
- Enable HTTPS via reverse proxy (Nginx, Caddy, Cloudflare)
- Set strong `NEXTAUTH_SECRET` (32+ characters)
- Use PostgreSQL instead of SQLite
- Enable rate limiting on API routes
- Set up automated database backups
- Review and restrict CORS origins

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🤝 Support

- **Documentation**: [docs/API.md](docs/API.md)
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Customization**: NotaryPro is fully customizable — modify the Prisma schema, UI components, and API routes to fit your needs

---

<p align="center">
  Built with ❤️ for Notary Professionals
</p>
