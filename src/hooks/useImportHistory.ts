import { useCallback, useEffect, useState } from 'react';
import { listRecentImports, type ImportLog } from '@/services/ia/importLogService';

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

  return { logs, loading, error, refresh };
}
