
DROP FUNCTION IF EXISTS public.get_public_farmer_info(uuid);

CREATE FUNCTION public.get_public_farmer_info(_farmer_id uuid)
RETURNS TABLE(
  id uuid, user_id uuid, farm_name text, farm_description text, state text,
  address text, farm_size text, produce_types text[], verification_status verification_status,
  verified_at timestamp with time zone, created_at timestamp with time zone,
  updated_at timestamp with time zone, whatsapp_phone text, secondary_phone text,
  years_of_experience integer, area text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT fp.id, fp.user_id, fp.farm_name, fp.farm_description, fp.state,
    fp.address, fp.farm_size, fp.produce_types, fp.verification_status,
    fp.verified_at, fp.created_at, fp.updated_at,
    fp.whatsapp_phone, fp.secondary_phone, fp.years_of_experience, fp.area
  FROM public.farmer_profiles fp
  WHERE fp.id = _farmer_id AND fp.verification_status = 'approved'
$$;

CREATE OR REPLACE FUNCTION public.set_product_state()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.state IS NULL THEN
    SELECT state INTO NEW.state FROM public.farmer_profiles WHERE id = NEW.farmer_id;
  END IF;
  IF NEW.area IS NULL THEN
    SELECT area INTO NEW.area FROM public.farmer_profiles WHERE id = NEW.farmer_id;
  END IF;
  RETURN NEW;
END;
$function$;
