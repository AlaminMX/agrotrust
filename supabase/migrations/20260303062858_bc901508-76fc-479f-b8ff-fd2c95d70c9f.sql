
-- Update farmer_profiles_public view with contact fields
DROP VIEW IF EXISTS public.farmer_profiles_public;
CREATE VIEW public.farmer_profiles_public
WITH (security_invoker = on)
AS SELECT 
  id, user_id, farm_name, farm_description, state, address,
  farm_size, produce_types, verification_status, verified_at,
  created_at, updated_at, whatsapp_phone, secondary_phone,
  years_of_experience, allows_pickup
FROM public.farmer_profiles
WHERE verification_status = 'approved';

-- Drop and recreate function with new columns
DROP FUNCTION IF EXISTS public.get_public_farmer_info(uuid);
CREATE FUNCTION public.get_public_farmer_info(_farmer_id uuid)
RETURNS TABLE (
  id uuid, user_id uuid, farm_name text, farm_description text,
  state text, address text, farm_size text, produce_types text[],
  verification_status public.verification_status, verified_at timestamptz,
  created_at timestamptz, updated_at timestamptz,
  whatsapp_phone text, secondary_phone text, years_of_experience integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT fp.id, fp.user_id, fp.farm_name, fp.farm_description, fp.state,
    fp.address, fp.farm_size, fp.produce_types, fp.verification_status,
    fp.verified_at, fp.created_at, fp.updated_at,
    fp.whatsapp_phone, fp.secondary_phone, fp.years_of_experience
  FROM public.farmer_profiles fp
  WHERE fp.id = _farmer_id AND fp.verification_status = 'approved'
$$;
