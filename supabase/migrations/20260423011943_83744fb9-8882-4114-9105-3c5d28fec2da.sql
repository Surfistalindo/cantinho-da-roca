ALTER PUBLICATION supabase_realtime ADD TABLE public.ia_import_logs;
ALTER TABLE public.ia_import_logs REPLICA IDENTITY FULL;