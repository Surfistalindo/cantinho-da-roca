
-- Tabela de configuração Z-API (singleton, só campos não-sensíveis)
CREATE TABLE public.whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'zapi',
  instance_id text,
  is_configured boolean NOT NULL DEFAULT false,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view config" ON public.whatsapp_config
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert config" ON public.whatsapp_config
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update config" ON public.whatsapp_config
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Singleton: garantir uma única linha (constraint via unique provider)
CREATE UNIQUE INDEX whatsapp_config_provider_unique ON public.whatsapp_config(provider);

-- Linha inicial vazia
INSERT INTO public.whatsapp_config (provider, is_configured) VALUES ('zapi', false);

-- Trigger updated_at
CREATE TRIGGER trg_whatsapp_config_updated
  BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar image_url em whatsapp_messages (envios de imagem)
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text';
