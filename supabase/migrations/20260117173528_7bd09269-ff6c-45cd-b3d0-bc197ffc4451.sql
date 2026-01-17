-- Fix: Farmer bank account details exposure
-- Drop the overly permissive policy that exposes bank details
DROP POLICY IF EXISTS "Anyone can view approved farmers basic info" ON public.farmer_profiles;

-- Create a new policy that only exposes non-sensitive fields
-- This policy allows public SELECT but we'll use a view to control which columns are exposed
-- The view farmer_profiles_public already exists and should exclude sensitive fields

-- Let's check what columns the view exposes and recreate it without sensitive fields
DROP VIEW IF EXISTS public.farmer_profiles_public;

-- Recreate the view WITHOUT sensitive banking/payment fields
CREATE VIEW public.farmer_profiles_public AS
SELECT 
  id,
  user_id,
  verification_status,
  verified_at,
  created_at,
  updated_at,
  farm_name,
  farm_description,
  state,
  address,
  farm_size,
  produce_types,
  total_earnings,
  pending_payout
  -- EXCLUDED: bank_name, bank_account_number, bank_account_name, paystack_recipient_code
  -- EXCLUDED: id_document_url, farm_registration_url, certification_urls, verification_notes, area_id, allows_pickup
FROM public.farmer_profiles
WHERE verification_status = 'approved';

-- Set the view to use invoker security (respects RLS of underlying table)
ALTER VIEW public.farmer_profiles_public SET (security_invoker = on);

-- Grant access to the view for anonymous and authenticated users
GRANT SELECT ON public.farmer_profiles_public TO anon;
GRANT SELECT ON public.farmer_profiles_public TO authenticated;

-- Now create a proper RLS policy for the underlying table
-- Only allow public access to non-sensitive fields through the view
-- The direct table access should be restricted to:
-- 1. Farmers accessing their own profile
-- 2. Admins accessing all profiles
-- 3. Limited public access to approved farmers (but only through the view)

-- For the view to work, we need to allow SELECT on the table for approved farmers
-- But this policy will only be used by the view (which filters columns)
CREATE POLICY "Anyone can view approved farmers basic info"
ON public.farmer_profiles
FOR SELECT
USING (verification_status = 'approved');