-- ============================================================
-- ANTIGRAVITY – Full Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMS ────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('client', 'moderator', 'admin', 'super_admin');

CREATE TYPE ad_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'payment_pending',
  'payment_submitted',
  'payment_verified',
  'scheduled',
  'published',
  'expired',
  'archived'
);

CREATE TYPE payment_status AS ENUM ('pending', 'submitted', 'verified', 'rejected');

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'client',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SELLER PROFILES ──────────────────────────────────────────
CREATE TABLE seller_profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name    TEXT,
  phone            TEXT,
  website          TEXT,
  whatsapp         TEXT,
  is_verified      BOOLEAN NOT NULL DEFAULT false,
  verified_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── PACKAGES ─────────────────────────────────────────────────
CREATE TABLE packages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,            -- 'Basic' | 'Standard' | 'Premium'
  price            NUMERIC(10,2) NOT NULL,
  duration_days    INT NOT NULL,             -- 7 | 15 | 30
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  featured_scope   TEXT,                     -- NULL | 'category' | 'homepage'
  weight           INT NOT NULL DEFAULT 1,   -- 1 | 2 | 3
  max_media        INT NOT NULL DEFAULT 3,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CATEGORIES ───────────────────────────────────────────────
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  icon       TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CITIES ───────────────────────────────────────────────────
CREATE TABLE cities (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ADS ──────────────────────────────────────────────────────
CREATE TABLE ads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id      UUID REFERENCES packages(id),
  category_id     UUID REFERENCES categories(id),
  city_id         UUID REFERENCES cities(id),

  title           TEXT NOT NULL,
  slug            TEXT UNIQUE,
  description     TEXT,
  price           NUMERIC(10,2),
  contact_phone   TEXT,
  contact_email   TEXT,
  contact_whatsapp TEXT,

  status          ad_status NOT NULL DEFAULT 'draft',
  rank_score      NUMERIC(10,2) NOT NULL DEFAULT 0,
  admin_boost     NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_featured     BOOLEAN NOT NULL DEFAULT false,

  moderator_note  TEXT,
  reviewed_by     UUID REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ,

  published_at    TIMESTAMPTZ,
  scheduled_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,

  view_count      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ads_category ON ads(category_id);
CREATE INDEX idx_ads_city ON ads(city_id);
CREATE INDEX idx_ads_rank ON ads(rank_score DESC);

-- ── AD MEDIA ─────────────────────────────────────────────────
CREATE TABLE ad_media (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id        UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  media_url    TEXT NOT NULL,
  media_type   TEXT NOT NULL DEFAULT 'image',  -- 'image' | 'video' | 'youtube'
  thumbnail_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_primary   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PAYMENTS ─────────────────────────────────────────────────
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id           UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  package_id      UUID NOT NULL REFERENCES packages(id),
  amount          NUMERIC(10,2) NOT NULL,
  proof_url       TEXT,                        -- URL to payment screenshot
  payment_method  TEXT,                        -- 'bank_transfer' | 'easypaisa' | etc.
  reference_no    TEXT,
  sender_name     TEXT,
  sender_bank_name TEXT,
  sender_account_number TEXT,
  sender_iban     TEXT,
  status          payment_status NOT NULL DEFAULT 'pending',
  verified_by     UUID REFERENCES users(id),
  verified_at     TIMESTAMPTZ,
  rejection_note  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── NOTIFICATIONS ─────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info',   -- 'info'|'success'|'warning'|'error'
  is_read     BOOLEAN NOT NULL DEFAULT false,
  ad_id       UUID REFERENCES ads(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ── AUDIT LOGS ───────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  details     JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── AD STATUS HISTORY ─────────────────────────────────────────
CREATE TABLE ad_status_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id      UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  from_status ad_status,
  to_status  ad_status NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SYSTEM HEALTH LOGS ────────────────────────────────────────
CREATE TABLE system_health_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name   TEXT NOT NULL,
  status     TEXT NOT NULL,       -- 'success' | 'error'
  message    TEXT,
  ads_affected INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── UPDATED_AT TRIGGER ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_ads_updated_at
  BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
