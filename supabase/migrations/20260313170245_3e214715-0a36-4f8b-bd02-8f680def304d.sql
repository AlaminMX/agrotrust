DROP VIEW IF EXISTS farmer_profiles_public;
CREATE VIEW farmer_profiles_public AS
  SELECT id, user_id, farm_name, farm_description, state, address, area,
         farm_size, produce_types, whatsapp_phone, secondary_phone, email,
         verification_status, verified_at, created_at, updated_at, years_of_experience
  FROM farmer_profiles
  WHERE verification_status = 'approved';

GRANT SELECT ON farmer_profiles_public TO anon, authenticated;