-- Step 1: Drop the RLS policy that depends on the function
DROP POLICY IF EXISTS "Anyone can view active products from verified farmers" ON public.products;

-- Step 2: Drop the old function
DROP FUNCTION IF EXISTS public.is_farmer_approved(uuid);

-- Step 3: Recreate the function with unambiguous parameter name
CREATE FUNCTION public.is_farmer_approved(_farmer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farmer_profiles 
    WHERE id = _farmer_id 
    AND verification_status = 'approved'
  )
$$;

-- Step 4: Recreate the RLS policy using the fixed function
CREATE POLICY "Anyone can view active products from verified farmers" 
ON public.products 
FOR SELECT
USING (is_active = true AND public.is_farmer_approved(farmer_id));