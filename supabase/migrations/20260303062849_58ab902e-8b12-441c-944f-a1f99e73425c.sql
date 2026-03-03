
-- Step 1: Add new columns to support marketplace model
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS listing_status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_negotiable boolean NOT NULL DEFAULT false;

ALTER TABLE public.farmer_profiles
ADD COLUMN IF NOT EXISTS whatsapp_phone text,
ADD COLUMN IF NOT EXISTS secondary_phone text,
ADD COLUMN IF NOT EXISTS years_of_experience integer;
