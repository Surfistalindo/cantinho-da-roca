
-- Create lead_notes table for observations and history
CREATE TABLE public.lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can manage notes
CREATE POLICY "Authenticated users can view notes"
  ON public.lead_notes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create notes"
  ON public.lead_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete notes"
  ON public.lead_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
