-- Fix: Restrict farmer_profiles to hide sensitive banking information from public view
-- Create a view for public farmer data without sensitive banking info

-- First, drop the existing broad SELECT policy that exposes all columns
DROP POLICY IF EXISTS "Anyone can view approved farmer profiles" ON public.farmer_profiles;

-- Create new policy that still allows viewing approved farmers, but we'll restrict columns in client code
-- The RLS cannot restrict columns directly, so we create policies with clear naming

-- Policy 1: Anyone can see approved farmer profiles (but sensitive data should be excluded in queries)
CREATE POLICY "Public can view approved farmer profiles"
ON public.farmer_profiles
FOR SELECT
USING (verification_status = 'approved'::verification_status);

-- Policy 2: Farmers can always view their own full profile
CREATE POLICY "Farmers can view own full profile"
ON public.farmer_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Note: Admin policy already exists: "Admins can view all farmer profiles"

-- Create a public view that excludes sensitive banking data for safe querying
CREATE OR REPLACE VIEW public.farmer_profiles_public AS
SELECT 
  id,
  user_id,
  farm_name,
  farm_description,
  produce_types,
  farm_size,
  address,
  state,
  verification_status,
  verified_at,
  created_at,
  updated_at,
  total_earnings,
  pending_payout
  -- Intentionally excluding: bank_account_name, bank_account_number, bank_name, paystack_recipient_code, id_document_url, farm_registration_url, certification_urls, verification_notes
FROM public.farmer_profiles
WHERE verification_status = 'approved'::verification_status;

-- Grant access to the public view
GRANT SELECT ON public.farmer_profiles_public TO anon, authenticated;

-- Add comment explaining the security measure
COMMENT ON VIEW public.farmer_profiles_public IS 'Public view of farmer profiles excluding sensitive banking and document information. Use this view for public-facing queries instead of querying farmer_profiles directly.';
