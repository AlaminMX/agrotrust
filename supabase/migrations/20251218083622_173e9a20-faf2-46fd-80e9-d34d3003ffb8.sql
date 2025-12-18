-- Fix the view to use SECURITY INVOKER instead of SECURITY DEFINER
DROP VIEW IF EXISTS public.farmer_profiles_public;

CREATE VIEW public.farmer_profiles_public
WITH (security_invoker = on) AS
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
FROM public.farmer_profiles
WHERE verification_status = 'approved'::verification_status;

-- Re-grant access to the public view
GRANT SELECT ON public.farmer_profiles_public TO anon, authenticated;

COMMENT ON VIEW public.farmer_profiles_public IS 'Public view of farmer profiles excluding sensitive banking and document information. Uses SECURITY INVOKER so RLS policies are applied based on the querying user.';
