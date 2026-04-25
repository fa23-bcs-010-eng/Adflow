-- Buyer / Seller marketplace account split
-- Run this in Supabase SQL editor before deploying the buyer/seller login update.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_account_type') THEN
    CREATE TYPE client_account_type AS ENUM ('buyer', 'seller');
  END IF;
END$$;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_type client_account_type;

UPDATE users
SET account_type = 'seller'
WHERE role = 'client'
  AND account_type IS NULL;

ALTER TABLE users
ALTER COLUMN account_type SET DEFAULT 'seller';

NOTIFY pgrst, 'reload schema';
