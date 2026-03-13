ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'In Stock'
  CHECK (availability_status IN ('In Stock', 'Limited', 'Out of Stock'));

UPDATE public.products
SET availability_status = CASE
  WHEN available_quantity > 10 THEN 'In Stock'
  WHEN available_quantity > 0 THEN 'Limited'
  ELSE 'Out of Stock'
END
WHERE availability_status IS NULL;
