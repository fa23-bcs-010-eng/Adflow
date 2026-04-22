-- Phase 1 marketplace features:
-- - In-app buyer/seller chat
-- - Make Offer flow
-- - Saved searches with instant alerts
-- - Seller order status actions
-- Run this in Supabase SQL editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status') THEN
    CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'countered', 'withdrawn');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS ad_conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id           UUID REFERENCES ads(id) ON DELETE SET NULL,
  buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ad_id, buyer_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_conversations_buyer ON ad_conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_ad_conversations_seller ON ad_conversations(seller_id);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ad_conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conv ON conversation_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS offers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id         UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  buyer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offered_price NUMERIC(12,2) NOT NULL,
  counter_price NUMERIC(12,2),
  status        offer_status NOT NULL DEFAULT 'pending',
  note          TEXT,
  seller_note   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_buyer ON offers(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_seller ON offers(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_ad ON offers(ad_id, created_at DESC);

CREATE TABLE IF NOT EXISTS saved_searches (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query            TEXT,
  category_slug    TEXT,
  city_slug        TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  last_notified_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_search_per_user
  ON saved_searches(user_id, COALESCE(query, ''), COALESCE(category_slug, ''), COALESCE(city_slug, ''));

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ad_conversations_updated_at') THEN
    CREATE TRIGGER trg_ad_conversations_updated_at
    BEFORE UPDATE ON ad_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_offers_updated_at') THEN
    CREATE TRIGGER trg_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END$$;

NOTIFY pgrst, 'reload schema';
