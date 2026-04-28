-- =====================================================================
-- 1. Reescrever INSERT público de leads — aplicar bounds para QUALQUER
--    inserção feita por quem NÃO é admin/vendedor (anon ou user comum)
-- =====================================================================

DROP POLICY IF EXISTS "Public can submit a lead (restricted fields)" ON public.leads;
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;

CREATE POLICY "Public/non-staff can submit a lead (restricted)"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Caminho 1: staff (admin/vendedor) — pode setar qualquer campo
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'vendedor'::app_role)
  -- Caminho 2: anon ou user logado sem papel — só campos básicos, com bounds
  OR (
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
    AND last_contact_at IS NULL
    AND next_contact_at IS NULL
    AND cadence_state = 'idle'
    AND cadence_step = 0
    AND cadence_next_at IS NULL
    AND cadence_started_at IS NULL
    AND cadence_exhausted = false
    AND cadence_last_sent_at IS NULL
    AND whatsapp_opt_out = false
  )
);

-- Atualizar trigger: aplicar saneamento sempre que NÃO for staff (não só anon)
CREATE OR REPLACE FUNCTION public.sanitize_public_lead_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_staff boolean := false;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    v_is_staff := has_role(auth.uid(), 'admin'::app_role)
               OR has_role(auth.uid(), 'vendedor'::app_role);
  END IF;

  IF NOT v_is_staff THEN
    -- Validação de nome
    IF NEW.name IS NULL OR length(trim(NEW.name)) < 2 THEN
      RAISE EXCEPTION 'Nome inválido';
    END IF;
    IF length(NEW.name) > 200 THEN NEW.name := substring(NEW.name from 1 for 200); END IF;

    -- Telefone
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

    -- Reset defensivo
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

REVOKE EXECUTE ON FUNCTION public.sanitize_public_lead_insert() FROM PUBLIC, anon, authenticated;

-- =====================================================================
-- 2. lead_notes — consolidar policies SELECT
-- =====================================================================

DROP POLICY IF EXISTS "Owner or admin can view notes"   ON public.lead_notes;
DROP POLICY IF EXISTS "Vendedores e admins veem notas"  ON public.lead_notes;

CREATE POLICY "Staff (admin/vendedor) can view notes"
ON public.lead_notes
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'vendedor'::app_role)
);

-- =====================================================================
-- 3. whatsapp_messages — bloqueio explícito de INSERT/UPDATE/DELETE pelo cliente
-- =====================================================================

DROP POLICY IF EXISTS "Block client insert wa msgs" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Block client update wa msgs" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Block client delete wa msgs" ON public.whatsapp_messages;

CREATE POLICY "Block client insert wa msgs"
ON public.whatsapp_messages FOR INSERT TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Block client update wa msgs"
ON public.whatsapp_messages FOR UPDATE TO authenticated, anon
USING (false);

CREATE POLICY "Block client delete wa msgs"
ON public.whatsapp_messages FOR DELETE TO authenticated, anon
USING (false);