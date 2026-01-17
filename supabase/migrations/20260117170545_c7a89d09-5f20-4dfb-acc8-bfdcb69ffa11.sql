-- Allow anyone (including guests) to view approved farmer profiles for product display
-- This fixes the issue where farmer_profiles_public view returns nothing for anonymous users
CREATE POLICY "Anyone can view approved farmers basic info"
ON public.farmer_profiles
FOR SELECT
USING (verification_status = 'approved');