
-- Drop view first, then clean columns, then recreate view
DROP VIEW IF EXISTS farmer_profiles_public CASCADE;

-- Drop logistics/order/review tables
DROP TABLE IF EXISTS order_tracking CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS delivery_pricing CASCADE;
DROP TABLE IF EXISTS delivery_addresses CASCADE;
DROP TABLE IF EXISTS delivery_areas CASCADE;
DROP TABLE IF EXISTS delivery_zones CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS consumer_reviews CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;

-- Clean farmer_profiles columns
ALTER TABLE farmer_profiles DROP COLUMN IF EXISTS total_earnings;
ALTER TABLE farmer_profiles DROP COLUMN IF EXISTS pending_payout;
ALTER TABLE farmer_profiles DROP COLUMN IF EXISTS allows_pickup;
ALTER TABLE farmer_profiles DROP COLUMN IF EXISTS area_id;
ALTER TABLE farmer_profiles DROP COLUMN IF EXISTS paystack_recipient_code;
ALTER TABLE farmer_profiles DROP COLUMN IF EXISTS bank_name;
ALTER TABLE farmer_profiles DROP COLUMN IF EXISTS bank_account_number;
ALTER TABLE farmer_profiles DROP COLUMN IF EXISTS bank_account_name;

-- Clean products columns
ALTER TABLE products DROP COLUMN IF EXISTS weight_kg;
ALTER TABLE products DROP COLUMN IF EXISTS original_price;
ALTER TABLE products DROP COLUMN IF EXISTS discount_percentage;
ALTER TABLE products DROP COLUMN IF EXISTS average_rating;
ALTER TABLE products DROP COLUMN IF EXISTS review_count;

-- Clean profiles columns
ALTER TABLE profiles DROP COLUMN IF EXISTS average_rating;
ALTER TABLE profiles DROP COLUMN IF EXISTS review_count;

-- Recreate view without removed columns
CREATE VIEW public.farmer_profiles_public AS
SELECT 
  fp.id, fp.user_id, fp.farm_name, fp.farm_description,
  fp.state, fp.address, fp.farm_size, fp.produce_types,
  fp.verification_status, fp.verified_at,
  fp.created_at, fp.updated_at,
  fp.whatsapp_phone, fp.secondary_phone, fp.years_of_experience
FROM public.farmer_profiles fp;

-- Create listing_reports table
CREATE TABLE IF NOT EXISTS public.listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  farmer_profile_id uuid REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  reporter_session_id text,
  reporter_user_id uuid,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit reports" ON listing_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage reports" ON listing_reports FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Drop unused functions
DROP FUNCTION IF EXISTS public.check_order_update() CASCADE;
DROP FUNCTION IF EXISTS public.update_product_rating() CASCADE;
DROP FUNCTION IF EXISTS public.update_consumer_rating() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_single_default_address() CASCADE;

-- Update get_public_farmer_info
CREATE OR REPLACE FUNCTION public.get_public_farmer_info(_farmer_id uuid)
RETURNS TABLE(
  id uuid, user_id uuid, farm_name text, farm_description text, 
  state text, address text, farm_size text, produce_types text[], 
  verification_status verification_status, verified_at timestamptz, 
  created_at timestamptz, updated_at timestamptz,
  whatsapp_phone text, secondary_phone text, years_of_experience integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT fp.id, fp.user_id, fp.farm_name, fp.farm_description, fp.state,
    fp.address, fp.farm_size, fp.produce_types, fp.verification_status,
    fp.verified_at, fp.created_at, fp.updated_at,
    fp.whatsapp_phone, fp.secondary_phone, fp.years_of_experience
  FROM public.farmer_profiles fp
  WHERE fp.id = _farmer_id AND fp.verification_status = 'approved'
$$;
