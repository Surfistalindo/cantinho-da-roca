-- 1) Coluna assigned_to em leads (sem FK para auth.users, conforme guideline)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_to uuid;
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON public.leads(assigned_to);

-- 2) Permitir que vendedores também vejam perfis (hoje só admin + dono)
DROP POLICY IF EXISTS "Vendedores e admins veem perfis" ON public.profiles;
CREATE POLICY "Vendedores e admins veem perfis"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'vendedor'::app_role)
);
