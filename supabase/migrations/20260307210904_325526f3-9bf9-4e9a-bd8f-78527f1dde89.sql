
-- Grant table-level privileges so RLS policies can be evaluated

-- products: public browsing for everyone, full CRUD for authenticated (RLS controls row access)
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;

-- farmer_profiles: no anon access (sensitive docs); authenticated can read/write own (RLS enforced)
GRANT SELECT, INSERT, UPDATE ON public.farmer_profiles TO authenticated;

-- farmer_profiles_public (view): public directory browsing
GRANT SELECT ON public.farmer_profiles_public TO anon;
GRANT SELECT ON public.farmer_profiles_public TO authenticated;

-- profiles: authenticated only (RLS restricts to own profile)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- user_roles: authenticated can read own roles and insert non-admin roles (RLS enforced)
GRANT SELECT, INSERT ON public.user_roles TO authenticated;

-- listing_reports: anyone can submit reports, authenticated can also read (RLS enforced)
GRANT INSERT ON public.listing_reports TO anon;
GRANT SELECT, INSERT ON public.listing_reports TO authenticated;
