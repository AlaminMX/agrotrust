-- Add policy for admins to update farmer profiles
CREATE POLICY "Admins can update farmer profiles" 
ON public.farmer_profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));