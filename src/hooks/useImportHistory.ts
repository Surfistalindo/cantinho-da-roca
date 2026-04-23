import { useCallback, useEffect, useMemo, useState } from 'react';
import { listRecentImports, type ImportLog } from '@/services/ia/importLogService';

/**
 * Histórico de importações.
 * Antes usava Realtime, mas a tabela ia_import_logs foi removida da
 * publicação por motivos de segurança (vazamento entre usuários). Agora
 * faz polling leve (a cada 5s enquanto houver import em andamento).
 */
export function useImportHistory(limit = 5) {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
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

  // Polling adaptativo: 5s se há import em andamento, 30s caso contrário.
  useEffect(() => {
    const hasInProgress = logs.some((l) => !l.finished_at);
    const interval = hasInProgress ? 5000 : 30000;
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [logs, refresh]);

  const inProgress = useMemo(() => logs.filter((l) => !l.finished_at), [logs]);
  const recent = useMemo(() => logs.filter((l) => !!l.finished_at), [logs]);

  return { logs, inProgress, recent, loading, error, refresh };
}
