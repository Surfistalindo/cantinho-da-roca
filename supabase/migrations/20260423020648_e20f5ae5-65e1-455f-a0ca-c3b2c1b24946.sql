
-- ============================================================
-- FASE 1: Endurecimento de RLS e segurança do banco
-- ============================================================

-- ---------- PROFILES ----------
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users view own profile or admins view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ---------- LEADS ----------
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;

CREATE POLICY "Admins and vendedores can view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor'));

CREATE POLICY "Admins and vendedores can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor'));

CREATE POLICY "Admins and vendedores can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor'));

-- Trigger: sanitiza inserts anônimos no formulário público
CREATE OR REPLACE FUNCTION public.sanitize_public_lead_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se não há usuário autenticado, é insert anônimo (formulário público)
  IF auth.uid() IS NULL THEN
    -- Validar campos mínimos
    IF NEW.name IS NULL OR length(trim(NEW.name)) < 2 THEN
      RAISE EXCEPTION 'Nome inválido';
    END IF;
    IF length(NEW.name) > 200 THEN
      NEW.name := substring(NEW.name from 1 for 200);
    END IF;
    IF NEW.phone IS NOT NULL AND length(NEW.phone) > 30 THEN
      NEW.phone := substring(NEW.phone from 1 for 30);
    END IF;
    IF NEW.product_interest IS NOT NULL AND length(NEW.product_interest) > 500 THEN
      NEW.product_interest := substring(NEW.product_interest from 1 for 500);
    END IF;

    -- Forçar valores seguros
    NEW.status := 'new';
    NEW.notes := NULL;
    NEW.last_contact_at := NULL;
    NEW.next_contact_at := NULL;
    NEW.ai_score := NULL;
    NEW.ai_score_reason := NULL;
    NEW.ai_score_updated_at := NULL;
    NEW.ai_priority := NULL;
    NEW.ai_summary := NULL;
    NEW.ai_summary_updated_at := NULL;
    NEW.ai_suggested_status := NULL;
    NEW.ai_status_confidence := NULL;
    -- Origem default se não informada
    IF NEW.origin IS NULL OR length(trim(NEW.origin)) = 0 THEN
      NEW.origin := 'Site';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_public_lead_insert_trigger ON public.leads;
CREATE TRIGGER sanitize_public_lead_insert_trigger
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_public_lead_insert();

-- ---------- CUSTOMERS ----------
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

CREATE POLICY "Admins and vendedores can view customers"
ON public.customers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor'));

CREATE POLICY "Admins and vendedores can create customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor'));

CREATE POLICY "Admins and vendedores can update customers"
ON public.customers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor'));

CREATE POLICY "Admins and vendedores can delete customers"
ON public.customers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor'));

-- ---------- INTERACTIONS ----------
DROP POLICY IF EXISTS "Authenticated users can view interactions" ON public.interactions;
DROP POLICY IF EXISTS "Authenticated users can create interactions" ON public.interactions;
DROP POLICY IF EXISTS "Authenticated users can update own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Authenticated users can delete own interactions" ON public.interactions;

CREATE POLICY "Admins and vendedores can view interactions"
ON public.interactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor'));

CREATE POLICY "Admins and vendedores can create interactions"
ON public.interactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor'))
);

CREATE POLICY "Admins and vendedores can update own interactions"
ON public.interactions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor'))
);

CREATE POLICY "Admins can delete any, vendedores own interactions"
ON public.interactions
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (auth.uid() = created_by AND public.has_role(auth.uid(), 'vendedor'))
);

-- ---------- LEAD_NOTES ----------
DROP POLICY IF EXISTS "Authenticated users can view notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Authenticated users can create notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Authenticated users can delete notes" ON public.lead_notes;

CREATE POLICY "Owner or admin can view notes"
ON public.lead_notes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and vendedores can create notes"
ON public.lead_notes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor'))
);

CREATE POLICY "Owner or admin can delete notes"
ON public.lead_notes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ---------- REALTIME ----------
-- Remover ia_import_logs da publicação realtime (evita vazamento entre usuários)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'ia_import_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.ia_import_logs;
  END IF;
END $$;

-- ---------- DEFAULT ROLE ----------
-- Novos usuários passam a ser 'vendedor' por padrão (admin se for o primeiro)
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'vendedor');
  END IF;
  RETURN NEW;
END;
$$;
