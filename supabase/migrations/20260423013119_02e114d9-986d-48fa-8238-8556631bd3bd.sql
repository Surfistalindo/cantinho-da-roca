-- 1. Adicionar colunas de IA em leads (todas opcionais)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS ai_score              smallint,
  ADD COLUMN IF NOT EXISTS ai_score_reason       text,
  ADD COLUMN IF NOT EXISTS ai_score_updated_at   timestamptz,
  ADD COLUMN IF NOT EXISTS ai_suggested_status   text,
  ADD COLUMN IF NOT EXISTS ai_status_confidence  numeric,
  ADD COLUMN IF NOT EXISTS ai_summary            text,
  ADD COLUMN IF NOT EXISTS ai_summary_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_priority           text;

-- 2. Tabela de mensagens do Assistente IA
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_chat_messages select own"
  ON public.ai_chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ai_chat_messages insert own"
  ON public.ai_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_chat_messages delete own"
  ON public.ai_chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ai_chat_messages_conv_created_idx
  ON public.ai_chat_messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS ai_chat_messages_user_idx
  ON public.ai_chat_messages (user_id, created_at DESC);