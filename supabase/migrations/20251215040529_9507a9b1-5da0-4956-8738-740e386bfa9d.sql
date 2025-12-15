-- Add discount columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS original_price numeric,
ADD COLUMN IF NOT EXISTS discount_percentage integer DEFAULT 0;

-- Create trigger function to auto-fill product state from farmer profile
CREATE OR REPLACE FUNCTION public.set_product_state()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.state IS NULL THEN
    SELECT state INTO NEW.state
    FROM public.farmer_profiles
    WHERE id = NEW.farmer_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-filling state
DROP TRIGGER IF EXISTS product_state_trigger ON public.products;
CREATE TRIGGER product_state_trigger
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_product_state();