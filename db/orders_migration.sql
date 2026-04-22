-- Run this file in Supabase SQL editor to enable buy/sell order flow.
-- Safe for existing projects (uses IF NOT EXISTS where possible).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'placed',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_payment_status') THEN
    CREATE TYPE order_payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS orders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  status         order_status NOT NULL DEFAULT 'placed',
  payment_status order_payment_status NOT NULL DEFAULT 'pending',
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ad_id       UUID REFERENCES ads(id) ON DELETE SET NULL,
  ad_title    TEXT NOT NULL,
  ad_slug     TEXT,
  seller_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  quantity    INT NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id);

CREATE TABLE IF NOT EXISTS order_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status   order_status NOT NULL,
  changed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_status_history(order_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_updated_at'
  ) THEN
    CREATE TRIGGER trg_orders_updated_at
      BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END$$;
