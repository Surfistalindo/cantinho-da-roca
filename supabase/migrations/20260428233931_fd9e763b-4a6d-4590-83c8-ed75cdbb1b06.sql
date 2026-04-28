-- =====================================================================
-- 1. INSERT PÚBLICO DE LEADS — restringir colunas e validar payload
-- =====================================================================

DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;

CREATE POLICY "Public can submit a lead (restricted fields)"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Quando autenticado, deixa o RLS normal mais permissivo passar pelas outras policies
  (auth.uid() IS NOT NULL)
  OR (
    -- Anônimo: aceita só campos esperados, com limites
    name IS NOT NULL
    AND length(trim(name)) BETWEEN 2 AND 200
    AND (phone IS NULL OR length(phone) BETWEEN 6 AND 30)
    AND (origin IS NULL OR length(origin) <= 80)
    AND (product_interest IS NULL OR length(product_interest) <= 500)
    AND notes IS NULL
    AND assigned_to IS NULL
    AND ai_score IS NULL
    AND ai_priority IS NULL
    AND ai_summary IS NULL
    AND ai_suggested_status IS NULL
  )
);

-- Reforçar trigger de saneamento (anônimo)
CREATE OR REPLACE FUNCTION public.sanitize_public_lead_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    -- Validação de nome
    IF NEW.name IS NULL OR length(trim(NEW.name)) < 2 THEN
      RAISE EXCEPTION 'Nome inválido';
    END IF;
    IF length(NEW.name) > 200 THEN NEW.name := substring(NEW.name from 1 for 200); END IF;

    -- Validação de telefone (somente dígitos, +, -, espaço, parênteses)
    IF NEW.phone IS NOT NULL THEN
      IF NEW.phone !~ '^[0-9+()\-\s]{6,30}$' THEN
        RAISE EXCEPTION 'Telefone inválido';
      END IF;
    END IF;

    IF NEW.product_interest IS NOT NULL AND length(NEW.product_interest) > 500 THEN
      NEW.product_interest := substring(NEW.product_interest from 1 for 500);
    END IF;
    IF NEW.origin IS NOT NULL AND length(NEW.origin) > 80 THEN
      NEW.origin := substring(NEW.origin from 1 for 80);
    END IF;

    -- Reset defensivo de TODOS os campos sensíveis
    NEW.status := 'new';
    NEW.notes := NULL;
    NEW.last_contact_at := NULL;
    NEW.next_contact_at := NULL;
    NEW.assigned_to := NULL;
    NEW.ai_score := NULL;
    NEW.ai_score_reason := NULL;
    NEW.ai_score_updated_at := NULL;
    NEW.ai_priority := NULL;
    NEW.ai_summary := NULL;
    NEW.ai_summary_updated_at := NULL;
    NEW.ai_suggested_status := NULL;
    NEW.ai_status_confidence := NULL;
    NEW.cadence_state := 'idle';
    NEW.cadence_step := 0;
    NEW.cadence_next_at := NULL;
    NEW.cadence_started_at := NULL;
    NEW.cadence_exhausted := false;
    NEW.cadence_last_sent_at := NULL;
    NEW.whatsapp_opt_out := false;
    IF NEW.origin IS NULL OR length(trim(NEW.origin)) = 0 THEN
      NEW.origin := 'Site';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Garantir trigger ativo
DROP TRIGGER IF EXISTS sanitize_public_lead_insert_trg ON public.leads;
CREATE TRIGGER sanitize_public_lead_insert_trg
BEFORE INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.sanitize_public_lead_insert();

-- =====================================================================
-- 2. lead_notes — vendedores precisam ver notas dos colegas
-- =====================================================================

DROP POLICY IF EXISTS "Vendedores e admins veem notas" ON public.lead_notes;
CREATE POLICY "Vendedores e admins veem notas"
ON public.lead_notes
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'vendedor'::app_role)
);

-- =====================================================================
-- 3. whatsapp_config — remover instance_id (vai pro vault)
-- =====================================================================

ALTER TABLE public.whatsapp_config DROP COLUMN IF EXISTS instance_id;

-- =====================================================================
-- 4. SECURITY DEFINER — revogar EXECUTE de quem não precisa
-- =====================================================================

-- Funções de trigger (não devem ser chamáveis por API)
REVOKE EXECUTE ON FUNCTION public.assign_default_role()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sanitize_public_lead_insert()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_last_contact_from_interaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()         FROM PUBLIC, anon, authenticated;

-- has_role: usado em policies, manter chamável só por authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- =====================================================================
-- 5. STORAGE — restringir buckets 'video' e 'skill' a admins
-- =====================================================================

-- Limpar policies antigas (se existirem) com nomes idempotentes
DROP POLICY IF EXISTS "Admin read video/skill"   ON storage.objects;
DROP POLICY IF EXISTS "Admin insert video/skill" ON storage.objects;
DROP POLICY IF EXISTS "Admin update video/skill" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete video/skill" ON storage.objects;

CREATE POLICY "Admin read video/skill"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('video','skill')
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin insert video/skill"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('video','skill')
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin update video/skill"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('video','skill')
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin delete video/skill"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('video','skill')
  AND has_role(auth.uid(), 'admin'::app_role)
);