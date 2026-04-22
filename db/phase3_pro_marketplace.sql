-- Phase 3 pro marketplace features
-- - Escrow hold/release flow
-- - Fraud scoring and AI moderation storage
-- - Logistics shipments and tracking
-- - AI pricing suggestions and ad quality scoring

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escrow_status') THEN
    CREATE TYPE escrow_status AS ENUM ('held', 'released', 'refunded', 'disputed');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_status') THEN
    CREATE TYPE shipment_status AS ENUM ('quote_only', 'created', 'packed', 'in_transit', 'delivered', 'exception');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS escrow_transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  amount           NUMERIC(12,2) NOT NULL,
  status           escrow_status NOT NULL DEFAULT 'held',
  held_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at      TIMESTAMPTZ,
  released_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  risk_score       INT NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_order ON escrow_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);

CREATE TABLE IF NOT EXISTS logistics_shipments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ad_id                 UUID REFERENCES ads(id) ON DELETE SET NULL,
  seller_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  buyer_id              UUID REFERENCES users(id) ON DELETE SET NULL,
  provider              TEXT NOT NULL DEFAULT 'Adflow Express',
  status                shipment_status NOT NULL DEFAULT 'quote_only',
  tracking_number       TEXT,
  origin_city           TEXT,
  destination_city      TEXT,
  estimated_cost        NUMERIC(12,2) NOT NULL DEFAULT 0,
  estimated_delivery_days INT NOT NULL DEFAULT 3,
  last_event            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order ON logistics_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON logistics_shipments(tracking_number);

CREATE TABLE IF NOT EXISTS ad_ai_assessments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id               UUID REFERENCES ads(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  suggested_price_min NUMERIC(12,2),
  suggested_price_max NUMERIC(12,2),
  suggested_price     NUMERIC(12,2),
  quality_score       INT NOT NULL DEFAULT 0,
  risk_score          INT NOT NULL DEFAULT 0,
  moderation_decision TEXT NOT NULL DEFAULT 'approve',
  reasoning           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_assessments_ad ON ad_ai_assessments(ad_id, created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_shipments_updated_at') THEN
    CREATE TRIGGER trg_shipments_updated_at
      BEFORE UPDATE ON logistics_shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END$$;

NOTIFY pgrst, 'reload schema';
