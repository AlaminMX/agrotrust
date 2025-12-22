-- Create a SECURITY DEFINER function to check if a farmer is approved
-- This allows unauthenticated users to check farmer status without direct table access
CREATE OR REPLACE FUNCTION public.is_farmer_approved(farmer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farmer_profiles 
    WHERE id = farmer_id 
    AND verification_status = 'approved'
  )
$$;

-- Drop the existing policy that doesn't work for guests
DROP POLICY IF EXISTS "Anyone can view active products from verified farmers" ON public.products;

-- Create a new policy using the SECURITY DEFINER function
CREATE POLICY "Anyone can view active products from verified farmers" 
ON public.products 
FOR SELECT
USING (is_active = true AND public.is_farmer_approved(farmer_id));