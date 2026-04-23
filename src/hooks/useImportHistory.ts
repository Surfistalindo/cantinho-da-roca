import { useCallback, useEffect, useMemo, useState } from 'react';
import { listRecentImports, type ImportLog } from '@/services/ia/importLogService';
import { supabase } from '@/integrations/supabase/client';

export function useImportHistory(limit = 5) {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRecentImports(limit);
      setLogs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar histórico');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('ia_import_logs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ia_import_logs' },
        (payload) => {
          setLogs((prev) => {
            if (payload.eventType === 'INSERT') {
              const next = [payload.new as ImportLog, ...prev];
              return next.slice(0, limit);
            }
            if (payload.eventType === 'UPDATE') {
              const updated = payload.new as ImportLog;
              return prev.map((l) => (l.id === updated.id ? updated : l));
            }
            if (payload.eventType === 'DELETE') {
              const old = payload.old as { id?: string };
              return prev.filter((l) => l.id !== old.id);
            }
            return prev;
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  const inProgress = useMemo(() => logs.filter((l) => !l.finished_at), [logs]);
  const recent = useMemo(() => logs.filter((l) => !!l.finished_at), [logs]);

  return { logs, inProgress, recent, loading, error, refresh };
}
