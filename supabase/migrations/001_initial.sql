-- =============================================================================
-- NotaryPro SaaS - Supabase PostgreSQL Schema
-- =============================================================================
-- Run: supabase db push  OR  psql -f 001_initial.sql
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ──
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Clients ──
CREATE TABLE clients (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  company    TEXT,
  address    TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_created_at ON clients(created_at);

-- ── Signings ──
CREATE TABLE signings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  time         TEXT,
  location     TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'General Notary',
  fee          NUMERIC(12,2) NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'Scheduled',
  notes        TEXT,
  mileage      NUMERIC(10,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_signings_user_id ON signings(user_id);
CREATE INDEX idx_signings_client_id ON signings(client_id);
CREATE INDEX idx_signings_status ON signings(status);
CREATE INDEX idx_signings_date ON signings(date);

-- ── Invoices ──
CREATE TABLE invoices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_no  TEXT UNIQUE NOT NULL,
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  signing_id  UUID REFERENCES signings(id) ON DELETE SET NULL,
  amount      NUMERIC(12,2) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Unpaid',
  issued_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date    TIMESTAMPTZ,
  paid_date   TIMESTAMPTZ,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issued_date ON invoices(issued_date);

-- ── Expenses ──
CREATE TABLE expenses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  description TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  date        DATE NOT NULL,
  receipt_url TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(date);

-- ── Journal Entries ──
CREATE TABLE journal_entries (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signer_name          TEXT NOT NULL,
  id_type              TEXT NOT NULL DEFAULT '',
  id_number            TEXT NOT NULL DEFAULT '',
  id_expiry            TEXT NOT NULL DEFAULT '',
  document_type        TEXT NOT NULL DEFAULT '',
  document_description TEXT NOT NULL DEFAULT '',
  page_count           INTEGER NOT NULL DEFAULT 0,
  fee                  NUMERIC(12,2) NOT NULL DEFAULT 0,
  date                 TEXT NOT NULL,
  time                 TEXT NOT NULL DEFAULT '',
  state                TEXT NOT NULL DEFAULT '',
  county               TEXT NOT NULL DEFAULT '',
  notary_act_type      TEXT NOT NULL DEFAULT '',
  notes                TEXT NOT NULL DEFAULT '',
  signature_data_url   TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(date);

-- ── Settings ──
CREATE TABLE settings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name         TEXT NOT NULL DEFAULT 'My Notary Business',
  commission_number     TEXT NOT NULL DEFAULT '',
  state                 TEXT NOT NULL DEFAULT '',
  phone                 TEXT NOT NULL DEFAULT '',
  email                 TEXT NOT NULL DEFAULT '',
  commission_expiry     TEXT NOT NULL DEFAULT '',
  telegram_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  telegram_chat_id      TEXT NOT NULL DEFAULT '',
  telegram_bot_token    TEXT NOT NULL DEFAULT '',
  telegram_use_custom_bot BOOLEAN NOT NULL DEFAULT FALSE,
  notif_new_signing     BOOLEAN NOT NULL DEFAULT TRUE,
  notif_signing_completed BOOLEAN NOT NULL DEFAULT TRUE,
  notif_signing_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
  notif_signing_reminder  BOOLEAN NOT NULL DEFAULT TRUE,
  notif_invoice_created BOOLEAN NOT NULL DEFAULT TRUE,
  notif_invoice_paid    BOOLEAN NOT NULL DEFAULT TRUE,
  notif_invoice_overdue BOOLEAN NOT NULL DEFAULT TRUE,
  notif_expense_added   BOOLEAN NOT NULL DEFAULT FALSE,
  notif_weekly_summary  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_settings_user_id ON settings(user_id);

-- ── Email Connections (for Gmail OAuth) ──
CREATE TABLE email_connections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL DEFAULT 'gmail',
  email_address   TEXT NOT NULL,
  access_token    TEXT NOT NULL,
  refresh_token   TEXT NOT NULL,
  token_expiry    TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_email_connections_user_id ON email_connections(user_id);

-- ── Parsed Signings (from email parsing) ──
CREATE TABLE parsed_signings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id        TEXT NOT NULL,
  email_from      TEXT NOT NULL,
  email_subject   TEXT NOT NULL,
  email_date      TIMESTAMPTZ NOT NULL,
  client_name     TEXT,
  signing_date    DATE,
  signing_time    TEXT,
  location        TEXT,
  service_type    TEXT,
  fee             NUMERIC(12,2),
  status          TEXT NOT NULL DEFAULT 'Pending',
  source          TEXT NOT NULL DEFAULT 'email',
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  signing_id      UUID REFERENCES signings(id) ON DELETE SET NULL,
  raw_data        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_parsed_signings_user_id ON parsed_signings(user_id);
CREATE INDEX idx_parsed_signings_status ON parsed_signings(status);

-- ── Invoice Counter (for atomic invoice number generation) ──
CREATE TABLE invoice_counter (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  counter INTEGER NOT NULL DEFAULT 0
);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE signings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_signings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_counter ENABLE ROW LEVEL SECURITY;

-- Users: can only read/update their own record
CREATE POLICY "Users can view own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own" ON users FOR UPDATE USING (auth.uid() = id);

-- Generic user-owned table policies
CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own signings" ON signings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own signings" ON signings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own signings" ON signings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own signings" ON signings FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own journal entries" ON journal_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own journal entries" ON journal_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own journal entries" ON journal_entries FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own journal entries" ON journal_entries FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own settings" ON settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own settings" ON settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own settings" ON settings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own settings" ON settings FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own email connections" ON email_connections FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own email connections" ON email_connections FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own email connections" ON email_connections FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own email connections" ON email_connections FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own parsed signings" ON parsed_signings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own parsed signings" ON parsed_signings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own parsed signings" ON parsed_signings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own parsed signings" ON parsed_signings FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own counter" ON invoice_counter FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own counter" ON invoice_counter FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own counter" ON invoice_counter FOR UPDATE USING (user_id = auth.uid());

-- =============================================================================
-- Stored Procedures
-- =============================================================================

-- Atomic invoice number generation
CREATE OR REPLACE FUNCTION get_next_invoice_no(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  result TEXT;
BEGIN
  INSERT INTO invoice_counter (user_id, counter)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET counter = invoice_counter.counter + 1
  RETURNING counter INTO next_num;

  result := 'INV-' || LPAD(next_num::TEXT, 4, '0');
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revenue aggregation per client
CREATE OR REPLACE FUNCTION get_client_revenue(p_user_id UUID, p_client_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total
  FROM invoices
  WHERE user_id = p_user_id
    AND client_id = p_client_id
    AND status = 'Paid';
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_signings_updated BEFORE UPDATE ON signings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_journal_entries_updated BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_email_connections_updated BEFORE UPDATE ON email_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_parsed_signings_updated BEFORE UPDATE ON parsed_signings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
