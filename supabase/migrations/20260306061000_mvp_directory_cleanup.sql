-- Remove non-MVP commerce/logistics/reviews tables and columns for directory-only model
DROP TABLE IF EXISTS public.consumer_reviews CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.payouts CASCADE;
DROP TABLE IF EXISTS public.delivery_addresses CASCADE;
DROP TABLE IF EXISTS public.delivery_pricing CASCADE;
DROP TABLE IF EXISTS public.delivery_areas CASCADE;
DROP TABLE IF EXISTS public.delivery_zones CASCADE;

ALTER TABLE public.products
  DROP COLUMN IF EXISTS original_price,
  DROP COLUMN IF EXISTS discount_percentage,
  DROP COLUMN IF EXISTS average_rating,
  DROP COLUMN IF EXISTS review_count;
