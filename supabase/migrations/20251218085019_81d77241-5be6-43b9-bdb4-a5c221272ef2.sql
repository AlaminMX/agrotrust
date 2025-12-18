-- Restrict product image uploads to verified farmers only
-- Drop existing permissive policy
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

-- Create restricted policy for verified farmers only
CREATE POLICY "Verified farmers can upload product images" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM public.farmer_profiles
    WHERE user_id = auth.uid()
    AND verification_status = 'approved'::verification_status
  )
);