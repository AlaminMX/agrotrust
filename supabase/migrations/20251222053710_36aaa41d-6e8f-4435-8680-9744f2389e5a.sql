-- Create delivery zones table
CREATE TABLE public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_code TEXT UNIQUE NOT NULL,
  zone_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create delivery areas table
CREATE TABLE public.delivery_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_name TEXT NOT NULL,
  zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
  state TEXT NOT NULL DEFAULT 'abuja',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(area_name, state)
);

-- Create delivery pricing table
CREATE TABLE public.delivery_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE CASCADE,
  to_zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE CASCADE,
  weight_category TEXT NOT NULL CHECK (weight_category IN ('light', 'medium', 'heavy')),
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_zone_id, to_zone_id, weight_category)
);

-- Add area_id and allows_pickup to farmer_profiles
ALTER TABLE public.farmer_profiles ADD COLUMN area_id UUID REFERENCES public.delivery_areas(id);
ALTER TABLE public.farmer_profiles ADD COLUMN allows_pickup BOOLEAN DEFAULT false;

-- Add area_id to delivery_addresses
ALTER TABLE public.delivery_addresses ADD COLUMN area_id UUID REFERENCES public.delivery_areas(id);

-- Add weight_kg to products
ALTER TABLE public.products ADD COLUMN weight_kg NUMERIC DEFAULT 1;

-- Add delivery_method to orders
ALTER TABLE public.orders ADD COLUMN delivery_method TEXT DEFAULT 'delivery' CHECK (delivery_method IN ('delivery', 'pickup'));

-- Add awaiting_payout to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'awaiting_payout' AFTER 'delivered';

-- Enable RLS on new tables
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_zones (public read, admin write)
CREATE POLICY "Anyone can view active zones" ON public.delivery_zones
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage zones" ON public.delivery_zones
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for delivery_areas (public read, admin write)
CREATE POLICY "Anyone can view active areas" ON public.delivery_areas
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage areas" ON public.delivery_areas
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for delivery_pricing (public read, admin write)
CREATE POLICY "Anyone can view active pricing" ON public.delivery_pricing
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage pricing" ON public.delivery_pricing
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default zones
INSERT INTO public.delivery_zones (zone_code, zone_name) VALUES
  ('A', 'Central Abuja'),
  ('B', 'Inner Residential'),
  ('C', 'Outer Residential'),
  ('D', 'Periphery');

-- Insert default areas with zone assignments
WITH zones AS (
  SELECT id, zone_code FROM public.delivery_zones
)
INSERT INTO public.delivery_areas (area_name, zone_id, state) VALUES
  ('Wuse II', (SELECT id FROM zones WHERE zone_code = 'A'), 'abuja'),
  ('Maitama', (SELECT id FROM zones WHERE zone_code = 'A'), 'abuja'),
  ('Asokoro', (SELECT id FROM zones WHERE zone_code = 'A'), 'abuja'),
  ('Central Business District', (SELECT id FROM zones WHERE zone_code = 'A'), 'abuja'),
  ('Garki', (SELECT id FROM zones WHERE zone_code = 'A'), 'abuja'),
  ('Wuse', (SELECT id FROM zones WHERE zone_code = 'B'), 'abuja'),
  ('Jabi', (SELECT id FROM zones WHERE zone_code = 'B'), 'abuja'),
  ('Utako', (SELECT id FROM zones WHERE zone_code = 'B'), 'abuja'),
  ('Gwarinpa', (SELECT id FROM zones WHERE zone_code = 'B'), 'abuja'),
  ('Life Camp', (SELECT id FROM zones WHERE zone_code = 'B'), 'abuja'),
  ('Kubwa', (SELECT id FROM zones WHERE zone_code = 'C'), 'abuja'),
  ('Lugbe', (SELECT id FROM zones WHERE zone_code = 'C'), 'abuja'),
  ('Nyanya', (SELECT id FROM zones WHERE zone_code = 'C'), 'abuja'),
  ('Karu', (SELECT id FROM zones WHERE zone_code = 'C'), 'abuja'),
  ('Dutse', (SELECT id FROM zones WHERE zone_code = 'C'), 'abuja'),
  ('Bwari', (SELECT id FROM zones WHERE zone_code = 'D'), 'abuja'),
  ('Gwagwalada', (SELECT id FROM zones WHERE zone_code = 'D'), 'abuja'),
  ('Kuje', (SELECT id FROM zones WHERE zone_code = 'D'), 'abuja'),
  ('Abaji', (SELECT id FROM zones WHERE zone_code = 'D'), 'abuja'),
  ('Kwali', (SELECT id FROM zones WHERE zone_code = 'D'), 'abuja');

-- Insert default pricing for all zone combinations
WITH zones AS (
  SELECT id, zone_code FROM public.delivery_zones
)
INSERT INTO public.delivery_pricing (from_zone_id, to_zone_id, weight_category, price)
SELECT 
  fz.id as from_zone_id,
  tz.id as to_zone_id,
  wc.category as weight_category,
  CASE 
    -- Same zone
    WHEN fz.zone_code = tz.zone_code THEN
      CASE wc.category
        WHEN 'light' THEN 1500
        WHEN 'medium' THEN 2500
        WHEN 'heavy' THEN 4000
      END
    -- A <-> B
    WHEN (fz.zone_code = 'A' AND tz.zone_code = 'B') OR (fz.zone_code = 'B' AND tz.zone_code = 'A') THEN
      CASE wc.category
        WHEN 'light' THEN 2000
        WHEN 'medium' THEN 3000
        WHEN 'heavy' THEN 5000
      END
    -- A/B <-> C
    WHEN (fz.zone_code IN ('A', 'B') AND tz.zone_code = 'C') OR (fz.zone_code = 'C' AND tz.zone_code IN ('A', 'B')) THEN
      CASE wc.category
        WHEN 'light' THEN 3000
        WHEN 'medium' THEN 4500
        WHEN 'heavy' THEN 7000
      END
    -- C <-> D or A/B <-> D
    ELSE
      CASE wc.category
        WHEN 'light' THEN 4500
        WHEN 'medium' THEN 6500
        WHEN 'heavy' THEN 9000
      END
  END as price
FROM zones fz
CROSS JOIN zones tz
CROSS JOIN (VALUES ('light'), ('medium'), ('heavy')) AS wc(category);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_delivery_zones_updated_at
  BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_areas_updated_at
  BEFORE UPDATE ON public.delivery_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_pricing_updated_at
  BEFORE UPDATE ON public.delivery_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();