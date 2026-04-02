-- ============================================================
-- ANTIGRAVITY – Seed Data
-- Run AFTER schema.sql
-- ============================================================

-- ── PACKAGES ─────────────────────────────────────────────────
INSERT INTO packages (name, price, duration_days, is_featured, featured_scope, weight, max_media) VALUES
  ('Basic',    499.00,  7,  false, NULL,       1, 3),
  ('Standard', 999.00,  15, true,  'category', 2, 6),
  ('Premium',  1999.00, 30, true,  'homepage', 3, 10);

-- ── CATEGORIES ───────────────────────────────────────────────
INSERT INTO categories (name, slug, icon) VALUES
  ('Real Estate',    'real-estate',    '🏠'),
  ('Vehicles',       'vehicles',       '🚗'),
  ('Electronics',    'electronics',    '📱'),
  ('Jobs',           'jobs',           '💼'),
  ('Services',       'services',       '🔧'),
  ('Fashion',        'fashion',        '👗'),
  ('Home & Garden',  'home-garden',    '🌿'),
  ('Sports',         'sports',         '⚽'),
  ('Education',      'education',      '📚'),
  ('Food & Dining',  'food-dining',    '🍔');

-- ── CITIES ───────────────────────────────────────────────────
INSERT INTO cities (name, slug) VALUES
  ('Karachi',    'karachi'),
  ('Lahore',     'lahore'),
  ('Islamabad',  'islamabad'),
  ('Rawalpindi', 'rawalpindi'),
  ('Peshawar',   'peshawar'),
  ('Quetta',     'quetta'),
  ('Faisalabad', 'faisalabad'),
  ('Multan',     'multan'),
  ('Sialkot',    'sialkot'),
  ('Hyderabad',  'hyderabad');
