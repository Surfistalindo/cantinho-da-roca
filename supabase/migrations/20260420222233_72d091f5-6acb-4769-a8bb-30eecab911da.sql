CREATE OR REPLACE FUNCTION public.sync_last_contact_from_interaction()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE public.leads
       SET last_contact_at = GREATEST(COALESCE(last_contact_at, NEW.interaction_date), NEW.interaction_date)
     WHERE id = NEW.lead_id;
  END IF;
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers
       SET last_contact_at = GREATEST(COALESCE(last_contact_at, NEW.interaction_date), NEW.interaction_date)
     WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_last_contact ON public.interactions;

CREATE TRIGGER trg_sync_last_contact
AFTER INSERT ON public.interactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_last_contact_from_interaction();