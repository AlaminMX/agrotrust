-- Fix: EXPOSED_SENSITIVE_DATA - farmer_profiles exposes bank details
-- The "Anyone can view approved farmers basic info" policy exposes ALL columns
-- including sensitive fields like bank_account_number, paystack_recipient_code

-- Step 1: Drop the problematic policy that exposes all farmer_profiles columns
DROP POLICY IF EXISTS "Anyone can view approved farmers basic info" ON public.farmer_profiles;

-- Step 2: The farmer_profiles_public view already exists and excludes sensitive fields.
-- Let's verify it has the right structure and enable RLS on the underlying access.

-- Step 3: Since farmer_profiles_public is a view, we need to add RLS on base table
-- to work with SECURITY INVOKER. Instead, let's create a function for public farmer lookup
-- that only returns safe fields.

-- Create a function to get public farmer info safely (excludes bank details)
CREATE OR REPLACE FUNCTION public.get_public_farmer_info(_farmer_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  farm_name text,
  farm_description text,
  state text,
  address text,
  farm_size text,
  produce_types text[],
  verification_status public.verification_status,
  verified_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    fp.id,
    fp.user_id,
    fp.farm_name,
    fp.farm_description,
    fp.state,
    fp.address,
    fp.farm_size,
    fp.produce_types,
    fp.verification_status,
    fp.verified_at,
    fp.created_at,
    fp.updated_at
  FROM public.farmer_profiles fp
  WHERE fp.id = _farmer_id 
    AND fp.verification_status = 'approved'
$$;

-- Add a comment documenting the security decision
COMMENT ON FUNCTION public.get_public_farmer_info IS 
  'Returns public farmer information excluding sensitive bank details. 
   Use this function for public-facing farmer profile lookups instead of 
   directly querying farmer_profiles table.';

-- Step 4: Update the farmer_profiles_public view to have security_invoker
-- and ensure it properly filters
DROP VIEW IF EXISTS public.farmer_profiles_public;

CREATE VIEW public.farmer_profiles_public
WITH (security_invoker = on)
AS SELECT 
  id,
  user_id,
  farm_name,
  farm_description,
  state,
  address,
  farm_size,
  produce_types,
  verification_status,
  verified_at,
  created_at,
  updated_at,
  total_earnings,
  pending_payout
FROM public.farmer_profiles
WHERE verification_status = 'approved';

-- Add comment for documentation
COMMENT ON VIEW public.farmer_profiles_public IS 
  'Public view of farmer profiles that excludes sensitive financial information 
   (bank_name, bank_account_number, bank_account_name, paystack_recipient_code, 
   id_document_url, farm_registration_url, certification_urls, verification_notes).
   Only shows approved farmers.';