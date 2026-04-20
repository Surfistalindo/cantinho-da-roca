import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribe to all changes on a Supabase table and call onChange().
 * The callback should refetch data — payload is intentionally not exposed
 * to keep usage simple and consistent across pages.
 */
export function useRealtimeTable(table: string, onChange: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onChange]);
}
