-- Create consumer_reviews table for farmers to rate consumers
CREATE TABLE public.consumer_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, farmer_id)
);

-- Add consumer rating fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Enable RLS on consumer_reviews
ALTER TABLE public.consumer_reviews ENABLE ROW LEVEL SECURITY;

-- Farmers can create reviews for consumers who bought from them
CREATE POLICY "Farmers can create consumer reviews for their orders" 
ON public.consumer_reviews 
FOR INSERT 
WITH CHECK (
  farmer_id = get_farmer_profile_id(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = consumer_reviews.order_id 
    AND orders.farmer_id = consumer_reviews.farmer_id
    AND orders.status = 'confirmed'
  )
);

-- Farmers can view their own reviews
CREATE POLICY "Farmers can view their own consumer reviews" 
ON public.consumer_reviews 
FOR SELECT 
USING (farmer_id = get_farmer_profile_id(auth.uid()));

-- Consumers can view reviews about themselves
CREATE POLICY "Consumers can view reviews about themselves" 
ON public.consumer_reviews 
FOR SELECT 
USING (consumer_id = auth.uid());

-- Admins can view all reviews
CREATE POLICY "Admins can view all consumer reviews" 
ON public.consumer_reviews 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to update consumer's average rating
CREATE OR REPLACE FUNCTION public.update_consumer_rating()
RETURNS TRIGGER AS $$
DECLARE
  consumer_uuid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    consumer_uuid := OLD.consumer_id;
  ELSE
    consumer_uuid := NEW.consumer_id;
  END IF;

  UPDATE public.profiles
  SET 
    average_rating = COALESCE((
      SELECT AVG(rating)::numeric(2,1)
      FROM public.consumer_reviews
      WHERE consumer_id = consumer_uuid
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM public.consumer_reviews
      WHERE consumer_id = consumer_uuid
    )
  WHERE user_id = consumer_uuid;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic consumer rating updates
CREATE TRIGGER update_consumer_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.consumer_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_consumer_rating();

-- Also make sure the existing update_product_rating trigger exists and works
-- (This is already in the database)