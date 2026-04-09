
ALTER TABLE public.leads ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN email SET DEFAULT '';
ALTER TABLE public.leads ADD COLUMN origem text;
ALTER TABLE public.leads ADD COLUMN interesse text;
