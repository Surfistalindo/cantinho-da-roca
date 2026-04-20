
-- 1) Adicionar coluna updated_at para rastreio de edições
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

-- 2) Trigger para manter updated_at sincronizado em qualquer UPDATE
DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Normalizar telefones existentes (apenas dígitos) antes de impor unicidade
UPDATE public.leads
   SET phone = regexp_replace(phone, '\D', '', 'g')
 WHERE phone IS NOT NULL
   AND phone <> regexp_replace(phone, '\D', '', 'g');

-- 4) Deduplicar telefones existentes mantendo o lead mais antigo (caso já existam duplicatas)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) AS rn
    FROM public.leads
   WHERE phone IS NOT NULL AND phone <> ''
)
DELETE FROM public.leads l
 USING ranked r
 WHERE l.id = r.id AND r.rn > 1;

-- 5) Índice único PARCIAL em phone (só onde phone não é nulo/vazio)
CREATE UNIQUE INDEX IF NOT EXISTS leads_phone_unique_idx
  ON public.leads (phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- 6) Garantir status default 'new' (já está, mas reafirma para futuros leads)
ALTER TABLE public.leads
  ALTER COLUMN status SET DEFAULT 'new';

-- 7) Index para acelerar filtros frequentes
CREATE INDEX IF NOT EXISTS leads_status_created_idx
  ON public.leads (status, created_at DESC);
