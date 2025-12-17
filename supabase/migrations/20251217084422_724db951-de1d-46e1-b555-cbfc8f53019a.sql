-- Fix 1 & 2: Add proper RLS policies for admin operations

-- Drop the existing farmer_profiles UPDATE policy that's too permissive
DROP POLICY IF EXISTS "Users can update their own farmer profile" ON farmer_profiles;

-- Create a more restrictive policy: farmers can only update non-verification fields
CREATE POLICY "Farmers can update their own non-verification fields"
ON farmer_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
);

-- Create a trigger function to prevent farmers from updating verification fields
CREATE OR REPLACE FUNCTION public.check_farmer_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is not an admin, prevent updates to verification fields
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    -- Prevent changes to verification-related fields
    IF (OLD.verification_status IS DISTINCT FROM NEW.verification_status) OR
       (OLD.verification_notes IS DISTINCT FROM NEW.verification_notes) OR
       (OLD.verified_at IS DISTINCT FROM NEW.verified_at) THEN
      RAISE EXCEPTION 'Only admins can update verification fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_farmer_verification_update ON farmer_profiles;
CREATE TRIGGER enforce_farmer_verification_update
BEFORE UPDATE ON farmer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_farmer_profile_update();

-- Add admin SELECT policy for all farmer profiles (for verification management)
DROP POLICY IF EXISTS "Admins can view all farmer profiles" ON farmer_profiles;
CREATE POLICY "Admins can view all farmer profiles"
ON farmer_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix user_roles: prevent non-admins from inserting 'admin' role
DROP POLICY IF EXISTS "Only admins can insert admin roles" ON user_roles;
CREATE POLICY "Users can insert non-admin roles"
ON user_roles FOR INSERT
WITH CHECK (
  role != 'admin' OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Fix orders: restrict what farmers can update (block escrow/payment fields)
DROP POLICY IF EXISTS "Farmers can update their orders" ON orders;
CREATE POLICY "Farmers can update their orders"
ON orders FOR UPDATE
USING (farmer_id = public.get_farmer_profile_id(auth.uid()));

-- Create trigger to prevent farmers from manipulating payment fields
CREATE OR REPLACE FUNCTION public.check_order_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is the farmer for this order
  IF OLD.farmer_id = public.get_farmer_profile_id(auth.uid()) THEN
    -- Farmers cannot modify escrow or payment fields
    IF (OLD.escrow_released IS DISTINCT FROM NEW.escrow_released) OR
       (OLD.escrow_released_at IS DISTINCT FROM NEW.escrow_released_at) OR
       (OLD.payment_reference IS DISTINCT FROM NEW.payment_reference) OR
       (OLD.total_amount IS DISTINCT FROM NEW.total_amount) OR
       (OLD.subtotal IS DISTINCT FROM NEW.subtotal) THEN
      RAISE EXCEPTION 'Farmers cannot modify payment-related fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_order_update ON orders;
CREATE TRIGGER enforce_order_update
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION public.check_order_update();

-- Fix payouts: add admin-only policies
DROP POLICY IF EXISTS "Only admins can update payouts" ON payouts;
CREATE POLICY "Only admins can update payouts"
ON payouts FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all payouts
DROP POLICY IF EXISTS "Admins can view all payouts" ON payouts;
CREATE POLICY "Admins can view all payouts"
ON payouts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add admin policies for order management
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders"
ON orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add admin policies for order_items
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items"
ON order_items FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add admin policies for order_tracking
DROP POLICY IF EXISTS "Admins can view all order tracking" ON order_tracking;
CREATE POLICY "Admins can view all order tracking"
ON order_tracking FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert order tracking" ON order_tracking;
CREATE POLICY "Admins can insert order tracking"
ON order_tracking FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Add admin storage policy for farmer documents
CREATE POLICY "Admins can view farmer documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'farmer-documents' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow farmers to view their own documents
CREATE POLICY "Farmers can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'farmer-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);