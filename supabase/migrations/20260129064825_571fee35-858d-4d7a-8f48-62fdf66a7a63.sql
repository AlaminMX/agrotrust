-- Fix 1: EXPOSED_SENSITIVE_DATA - Verify profiles table is protected
-- The profiles table should only be viewable by the owner and admins
-- Current policies look correct but let's ensure there's no public access

-- First, let's verify the current policies are sufficient
-- The existing policies are:
-- "Users can view their own profile" - USING (auth.uid() = user_id)
-- "Admins can view all profiles" - USING (has_role(auth.uid(), 'admin'::app_role))
-- These are correct - only owner and admin can view. No additional changes needed.

-- Fix 2: MISSING_RLS_PROTECTION - Remove financial data from public view
-- The farmer_profiles_public view currently exposes total_earnings and pending_payout
-- This could be used for competitive intelligence or to target high-earning farmers

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
  updated_at
  -- REMOVED: total_earnings, pending_payout (financial data should not be public)
FROM public.farmer_profiles
WHERE verification_status = 'approved';

-- Add comment for documentation
COMMENT ON VIEW public.farmer_profiles_public IS 
  'Public view of farmer profiles that excludes ALL sensitive information:
   - Financial: total_earnings, pending_payout
   - Banking: bank_name, bank_account_number, bank_account_name, paystack_recipient_code
   - Documents: id_document_url, farm_registration_url, certification_urls
   - Admin: verification_notes
   Only shows approved farmers with public-safe information.';

-- Also update the get_public_farmer_info function to exclude financial data
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

-- Update the comment
COMMENT ON FUNCTION public.get_public_farmer_info IS 
  'Returns public farmer information excluding ALL sensitive data:
   - No financial data (total_earnings, pending_payout)
   - No banking details (bank_name, bank_account_number, etc.)
   - No documents (id_document_url, etc.)
   Use this function for public-facing farmer profile lookups.';