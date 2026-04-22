-- Phase 2 business growth features
-- - Seller ratings and product reviews
-- - Analytics events for views, chats, cart adds, purchases
-- - Complaint/report moderation queue
-- - Promotions: boost, urgent, top of search
-- Run in Supabase SQL editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
    CREATE TYPE review_status AS ENUM ('published', 'hidden');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('open', 'under_review', 'resolved', 'dismissed');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promotion_type') THEN
    CREATE TYPE promotion_type AS ENUM ('boost', 'urgent', 'top_search');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS seller_reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID REFERENCES orders(id) ON DELETE SET NULL,
  ad_id         UUID REFERENCES ads(id) ON DELETE SET NULL,
  reviewer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating        INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title         TEXT,
  body          TEXT,
  status        review_status NOT NULL DEFAULT 'published',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller ON seller_reviews(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_ad ON seller_reviews(ad_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ad_reports (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id             UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  reporter_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  reason            TEXT NOT NULL,
  details           TEXT,
  status            report_status NOT NULL DEFAULT 'open',
  moderator_note    TEXT,
  reviewed_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_reports_status ON ad_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_reports_seller ON ad_reports(seller_id);

CREATE TABLE IF NOT EXISTS ad_promotions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id             UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promotion_type    promotion_type NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  boost_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  starts_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_promotions_ad ON ad_promotions(ad_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ad_analytics_events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id             UUID REFERENCES ads(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  seller_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type        TEXT NOT NULL,
  meta              JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_analytics_events_ad ON ad_analytics_events(ad_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_events_seller ON ad_analytics_events(seller_id, created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_seller_reviews_updated_at') THEN
    CREATE TRIGGER trg_seller_reviews_updated_at
      BEFORE UPDATE ON seller_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END$$;

-- Seed event types from existing data where useful
INSERT INTO ad_analytics_events (ad_id, seller_id, event_type, meta, created_at)
SELECT a.id, a.user_id, 'publish', jsonb_build_object('source', 'migration'), COALESCE(a.published_at, a.created_at)
FROM ads a
WHERE a.status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM ad_analytics_events e WHERE e.ad_id = a.id AND e.event_type = 'publish'
  );

NOTIFY pgrst, 'reload schema';
