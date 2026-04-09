
-- Clients table (converted leads)
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete clients" ON public.clients FOR DELETE TO authenticated USING (true);

-- Interactions table (lead history)
CREATE TABLE public.interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'observação',
  content TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view interactions" ON public.interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create interactions" ON public.interactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update interactions" ON public.interactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete interactions" ON public.interactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_interactions_lead_id ON public.interactions(lead_id);
CREATE INDEX idx_clients_lead_id ON public.clients(lead_id);
