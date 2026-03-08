
-- 1. Add email column
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Fix RLS policies
DROP POLICY IF EXISTS "Farmers can update their own non-verification fields" ON farmer_profiles;
DROP POLICY IF EXISTS "Admins can update farmer profiles" ON farmer_profiles;
DROP POLICY IF EXISTS "Admins can view all farmer profiles" ON farmer_profiles;
DROP POLICY IF EXISTS "Farmers can view own full profile" ON farmer_profiles;

CREATE POLICY "Farmers can update own profile" ON farmer_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update any farmer profile" ON farmer_profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all farmer profiles" ON farmer_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Farmers can view own full profile" ON farmer_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete farmer profiles" ON farmer_profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all roles" ON user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Platform states
CREATE TABLE IF NOT EXISTS public.platform_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text UNIQUE NOT NULL, label text NOT NULL,
  is_active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE platform_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view states" ON platform_states FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert states" ON platform_states FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update states" ON platform_states FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete states" ON platform_states FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Platform areas
CREATE TABLE IF NOT EXISTS public.platform_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_value text NOT NULL REFERENCES platform_states(value) ON DELETE CASCADE,
  name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(state_value, name)
);
ALTER TABLE platform_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view areas" ON platform_areas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert areas" ON platform_areas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update areas" ON platform_areas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete areas" ON platform_areas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Admin notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, user_id uuid, metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view notifications" ON admin_notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update notifications" ON admin_notifications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. Seed
INSERT INTO platform_states (value, label, sort_order) VALUES
  ('abuja','Abuja',1),('kaduna','Kaduna',2),('bauchi','Bauchi',3),('kano','Kano',4)
ON CONFLICT (value) DO NOTHING;

INSERT INTO platform_areas (state_value, name) VALUES
  ('abuja','Gwarimpa'),('abuja','Wuse'),('abuja','Wuse 2'),('abuja','Maitama'),('abuja','Garki'),('abuja','Asokoro'),('abuja','Kubwa'),('abuja','Jabi'),('abuja','Lugbe'),('abuja','Karu'),('abuja','Nyanya'),('abuja','Bwari'),('abuja','Gwagwalada'),('abuja','Kuje'),('abuja','Dutse'),('abuja','Lifecamp'),('abuja','Utako'),('abuja','Gudu'),('abuja','Apo'),('abuja','Lokogoma'),('abuja','Karmo'),('abuja','Mpape'),('abuja','Durumi'),('abuja','Galadimawa'),('abuja','Katampe'),('abuja','Mabushi'),
  ('kaduna','Kabala'),('kaduna','Barnawa'),('kaduna','Sabon Tasha'),('kaduna','Tudun Wada'),('kaduna','Kakuri'),('kaduna','Ungwan Rimi'),('kaduna','Narayi'),('kaduna','Rigasa'),('kaduna','Malali'),('kaduna','Kawo'),('kaduna','Ungwan Boro'),('kaduna','Sabo'),('kaduna','Television'),('kaduna','Gonin Gora'),('kaduna','Millennium City'),('kaduna','Nasarawa'),('kaduna','Zaria Road'),('kaduna','Kafanchan'),('kaduna','Zangon Kataf'),('kaduna','Kachia'),('kaduna','Chikun'),
  ('kano','Sabon Gari'),('kano','Nassarawa'),('kano','Fagge'),('kano','Gwale'),('kano','Tarauni'),('kano','Kumbotso'),('kano','Ungogo'),('kano','Dala'),('kano','Kano Municipal'),('kano','Bompai'),('kano','Zoo Road'),('kano','Hotoro'),('kano','Sharada'),('kano','Dakata'),('kano','Wudil'),('kano','Gwarzo'),
  ('bauchi','Bauchi Central'),('bauchi','Yelwa'),('bauchi','Wunti'),('bauchi','Bayara'),('bauchi','Fadaman Mada'),('bauchi','GRA'),('bauchi','Dass'),('bauchi','Tafawa Balewa'),('bauchi','Azare'),('bauchi','Misau'),('bauchi','Ningi'),('bauchi','Alkaleri'),('bauchi','Bogoro')
ON CONFLICT (state_value, name) DO NOTHING;

-- 7. Update view
DROP VIEW IF EXISTS farmer_profiles_public;
CREATE VIEW farmer_profiles_public AS
SELECT id, user_id, farm_name, farm_description, state, address, area, farm_size,
  produce_types, whatsapp_phone, secondary_phone, email,
  verification_status, verified_at, created_at, updated_at, years_of_experience
FROM farmer_profiles;

-- 8. Update function (drop first to change return type)
DROP FUNCTION IF EXISTS public.get_public_farmer_info(uuid);
CREATE FUNCTION public.get_public_farmer_info(_farmer_id uuid)
RETURNS TABLE(id uuid, user_id uuid, farm_name text, farm_description text, state text,
  address text, farm_size text, produce_types text[], verification_status verification_status,
  verified_at timestamptz, created_at timestamptz, updated_at timestamptz,
  whatsapp_phone text, secondary_phone text, years_of_experience integer, area text, email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT fp.id, fp.user_id, fp.farm_name, fp.farm_description, fp.state,
    fp.address, fp.farm_size, fp.produce_types, fp.verification_status,
    fp.verified_at, fp.created_at, fp.updated_at,
    fp.whatsapp_phone, fp.secondary_phone, fp.years_of_experience, fp.area, fp.email
  FROM public.farmer_profiles fp
  WHERE fp.id = _farmer_id AND fp.verification_status = 'approved'
$$;

-- 9. Notification triggers
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO admin_notifications (type, user_id, metadata)
  VALUES ('new_user', NEW.user_id, jsonb_build_object('email', COALESCE(NEW.email, ''), 'full_name', COALESCE(NEW.full_name, '')));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_farmer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO admin_notifications (type, user_id, metadata)
  VALUES ('new_farmer', NEW.user_id, jsonb_build_object('farm_name', NEW.farm_name, 'state', NEW.state));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_profile_notify_admin
AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION notify_admin_new_user();

CREATE TRIGGER on_new_farmer_notify_admin
AFTER INSERT ON farmer_profiles FOR EACH ROW EXECUTE FUNCTION notify_admin_new_farmer();

-- 10. Grants
GRANT SELECT ON platform_states TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON platform_states TO authenticated;
GRANT SELECT ON platform_areas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON platform_areas TO authenticated;
GRANT SELECT, UPDATE ON admin_notifications TO authenticated;
