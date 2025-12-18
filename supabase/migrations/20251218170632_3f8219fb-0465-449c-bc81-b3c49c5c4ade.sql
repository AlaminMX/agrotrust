-- Drop the overly permissive public policy that exposes bank details
DROP POLICY IF EXISTS "Public can view approved farmer profiles" ON public.farmer_profiles;

-- The existing RLS policies remain:
-- - "Farmers can view own full profile" (auth.uid() = user_id)
-- - "Admins can view all farmer profiles" (has_role admin)
-- - "Farmers can update their own non-verification fields"
-- - "Admins can update farmer profiles"
-- - "Users can insert their own farmer profile"

-- Public access will now only be through farmer_profiles_public view
-- which excludes sensitive fields (bank details, documents, etc.)