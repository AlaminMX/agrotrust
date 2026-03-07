-- Recreate view as security definer (not invoker) so anonymous users can read it
DROP VIEW IF EXISTS public.farmer_profiles_public;

CREATE VIEW public.farmer_profiles_public
WITH (security_barrier = true)
AS
SELECT
  id, user_id, farm_name, farm_description, state, address, farm_size,
  produce_types, verification_status, verified_at, created_at, updated_at,
  whatsapp_phone, secondary_phone, years_of_experience
FROM public.farmer_profiles
WHERE verification_status = 'approved';