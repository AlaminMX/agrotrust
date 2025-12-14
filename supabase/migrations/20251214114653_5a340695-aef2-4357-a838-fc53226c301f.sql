-- Add state column to products table (auto-filled from farmer's state)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS state text;

-- Update existing products to have the farmer's state
UPDATE public.products p
SET state = f.state
FROM public.farmer_profiles f
WHERE p.farmer_id = f.id AND p.state IS NULL;

-- Create index for faster state-based queries
CREATE INDEX IF NOT EXISTS idx_products_state ON public.products(state);

-- Create index for combined state and is_active queries
CREATE INDEX IF NOT EXISTS idx_products_state_active ON public.products(state, is_active);