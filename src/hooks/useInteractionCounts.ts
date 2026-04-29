import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';

/**
 * Aggregates the count of interactions per lead in a single query.
 * Refetches automatically when the `interactions` table changes.
 *
 * Returns a stable Record<leadId, count>. Missing leads default to 0.
 */
export function useInteractionCounts(leadIds: string[]): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Stable key to avoid refetch loops when array identity changes but contents don't
  const idsKey = useMemo(() => [...leadIds].sort().join(','), [leadIds]);

  const fetchCounts = useCallback(async () => {
    if (!idsKey) {
      setCounts({});
      return;
    }
    const ids = idsKey.split(',').filter(Boolean);
    if (ids.length === 0) {
      setCounts({});
      return;
    }
    const { data } = await supabase
      .from('interactions')
      .select('lead_id')
      .in('lead_id', ids)
      .limit(5000);

    const next: Record<string, number> = {};
    for (const row of (data ?? []) as { lead_id: string | null }[]) {
      if (!row.lead_id) continue;
      next[row.lead_id] = (next[row.lead_id] ?? 0) + 1;
    }
    setCounts(next);
  }, [idsKey]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  useRealtimeTable('interactions', fetchCounts, { debounceMs: 400 });

  return counts;
}
