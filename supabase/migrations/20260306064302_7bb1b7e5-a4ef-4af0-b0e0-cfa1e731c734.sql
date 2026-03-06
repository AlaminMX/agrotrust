
-- Fix SECURITY DEFINER view by recreating as SECURITY INVOKER
DROP VIEW IF EXISTS farmer_profiles_public;
CREATE VIEW public.farmer_profiles_public 
WITH (security_invoker = true)
AS
SELECT 
  fp.id, fp.user_id, fp.farm_name, fp.farm_description,
  fp.state, fp.address, fp.farm_size, fp.produce_types,
  fp.verification_status, fp.verified_at,
  fp.created_at, fp.updated_at,
  fp.whatsapp_phone, fp.secondary_phone, fp.years_of_experience
FROM public.farmer_profiles fp;

-- Grant access so the view is usable publicly (read-only for approved farmers)
GRANT SELECT ON public.farmer_profiles_public TO anon, authenticated;
