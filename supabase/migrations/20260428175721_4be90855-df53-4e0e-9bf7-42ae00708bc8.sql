-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Templates
CREATE TABLE public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  meta_name text NOT NULL,
  language text NOT NULL DEFAULT 'pt_BR',
  category text NOT NULL DEFAULT 'MARKETING',
  body_preview text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  step_order int,
  delay_hours int,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view templates"
ON public.whatsapp_templates FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor'));

CREATE POLICY "Admins can insert templates"
ON public.whatsapp_templates FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update templates"
ON public.whatsapp_templates FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete templates"
ON public.whatsapp_templates FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_whatsapp_templates_updated
BEFORE UPDATE ON public.whatsapp_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  direction text NOT NULL CHECK (direction IN ('out','in')),
  status text NOT NULL DEFAULT 'queued',
  template_name text,
  body text,
  wa_message_id text,
  error_code text,
  error_message text,
  cadence_step int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_msg_lead ON public.whatsapp_messages(lead_id, created_at DESC);
CREATE INDEX idx_wa_msg_wa_id ON public.whatsapp_messages(wa_message_id);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view messages"
ON public.whatsapp_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendedor'));

-- Inserts/updates restritos ao service_role (edge functions). Sem policy = bloqueado para anon/auth.

CREATE TRIGGER trg_whatsapp_messages_updated
BEFORE UPDATE ON public.whatsapp_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lead columns
ALTER TABLE public.leads
  ADD COLUMN cadence_state text NOT NULL DEFAULT 'idle',
  ADD COLUMN cadence_step int NOT NULL DEFAULT 0,
  ADD COLUMN cadence_next_at timestamptz,
  ADD COLUMN cadence_started_at timestamptz,
  ADD COLUMN cadence_exhausted boolean NOT NULL DEFAULT false,
  ADD COLUMN cadence_last_sent_at timestamptz,
  ADD COLUMN whatsapp_opt_out boolean NOT NULL DEFAULT false;

CREATE INDEX idx_leads_cadence_due
  ON public.leads(cadence_next_at)
  WHERE cadence_state IN ('idle','active') AND cadence_exhausted = false;

-- Update sanitize trigger to ignore new fields on public insert
CREATE OR REPLACE FUNCTION public.sanitize_public_lead_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    IF NEW.name IS NULL OR length(trim(NEW.name)) < 2 THEN
      RAISE EXCEPTION 'Nome inválido';
    END IF;
    IF length(NEW.name) > 200 THEN NEW.name := substring(NEW.name from 1 for 200); END IF;
    IF NEW.phone IS NOT NULL AND length(NEW.phone) > 30 THEN NEW.phone := substring(NEW.phone from 1 for 30); END IF;
    IF NEW.product_interest IS NOT NULL AND length(NEW.product_interest) > 500 THEN NEW.product_interest := substring(NEW.product_interest from 1 for 500); END IF;

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
$function$;

-- Realtime
ALTER TABLE public.whatsapp_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_templates;

-- Seed templates da régua
INSERT INTO public.whatsapp_templates (name, meta_name, language, category, body_preview, variables, step_order, delay_hours)
VALUES
  ('regua_dia_2', 'regua_dia_2', 'pt_BR', 'MARKETING',
   'Oi {{1}}! Aqui é do Cantinho da Roça 🌿 Passando para saber se você ainda tem interesse em {{2}}. Posso te ajudar?',
   '["nome","interesse"]'::jsonb, 1, 48),
  ('regua_dia_5', 'regua_dia_5', 'pt_BR', 'MARKETING',
   'Oi {{1}}, tudo certo? Ficamos sem retorno e queríamos garantir que você não perca nossas novidades sobre {{2}}. Qualquer coisa estamos por aqui 🌱',
   '["nome","interesse"]'::jsonb, 2, 120),
  ('regua_dia_10', 'regua_dia_10', 'pt_BR', 'MARKETING',
   'Oi {{1}}! Última passadinha aqui pra confirmar se ainda faz sentido falarmos sobre {{2}}. Se preferir, é só responder PARAR que não te incomodamos mais 💚',
   '["nome","interesse"]'::jsonb, 3, 240);