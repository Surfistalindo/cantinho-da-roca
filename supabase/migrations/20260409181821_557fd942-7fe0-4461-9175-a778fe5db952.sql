
-- Rename columns
ALTER TABLE public.leads RENAME COLUMN origem TO origin;
ALTER TABLE public.leads RENAME COLUMN interesse TO product_interest;

-- Add new columns
ALTER TABLE public.leads ADD COLUMN last_contact_at timestamp with time zone;
ALTER TABLE public.leads ADD COLUMN next_contact_at timestamp with time zone;
ALTER TABLE public.leads ADD COLUMN notes text;

-- Remove unused columns
ALTER TABLE public.leads DROP COLUMN IF EXISTS email;
ALTER TABLE public.leads DROP COLUMN IF EXISTS utm_source;
ALTER TABLE public.leads DROP COLUMN IF EXISTS utm_medium;
ALTER TABLE public.leads DROP COLUMN IF EXISTS utm_campaign;
ALTER TABLE public.leads DROP COLUMN IF EXISTS updated_at;

-- Remove the trigger that was on updated_at since we dropped that column
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
