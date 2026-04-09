
-- =====================
-- 1. CUSTOMERS TABLE
-- =====================
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  product_bought text,
  purchase_date date,
  last_contact_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customers"
  ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create customers"
  ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers"
  ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete customers"
  ON public.customers FOR DELETE TO authenticated USING (true);

-- =====================
-- 2. PROFILES TABLE
-- =====================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- 3. USER ROLES TABLE
-- =====================
CREATE TYPE public.app_role AS ENUM ('admin', 'vendedor', 'usuario');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- 4. RESTRUCTURE INTERACTIONS
-- =====================
-- Add customer_id
ALTER TABLE public.interactions ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE;

-- Rename columns
ALTER TABLE public.interactions RENAME COLUMN type TO contact_type;
ALTER TABLE public.interactions RENAME COLUMN content TO description;
ALTER TABLE public.interactions RENAME COLUMN user_id TO created_by;

-- Add interaction_date
ALTER TABLE public.interactions ADD COLUMN interaction_date timestamptz NOT NULL DEFAULT now();

-- Make lead_id nullable (can be lead OR customer)
ALTER TABLE public.interactions ALTER COLUMN lead_id DROP NOT NULL;

-- Add constraint: must have lead_id or customer_id
ALTER TABLE public.interactions ADD CONSTRAINT interactions_must_have_reference
  CHECK (lead_id IS NOT NULL OR customer_id IS NOT NULL);

-- Update RLS policies for interactions
DROP POLICY IF EXISTS "Authenticated users can create interactions" ON public.interactions;
DROP POLICY IF EXISTS "Authenticated users can view interactions" ON public.interactions;
DROP POLICY IF EXISTS "Authenticated users can update interactions" ON public.interactions;
DROP POLICY IF EXISTS "Authenticated users can delete interactions" ON public.interactions;

CREATE POLICY "Authenticated users can view interactions"
  ON public.interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create interactions"
  ON public.interactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update own interactions"
  ON public.interactions FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Authenticated users can delete own interactions"
  ON public.interactions FOR DELETE TO authenticated USING (auth.uid() = created_by);
