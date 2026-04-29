import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Options {
  /** Debounce em ms para coalescer rajadas de eventos. Default: 0 (imediato). */
  debounceMs?: number;
}

/**
 * Subscribe to all changes on a Supabase table and call onChange().
 * The callback should refetch data — payload is intentionally not exposed
 * to keep usage simple and consistent across pages.
 *
 * Use `debounceMs` para evitar refetch em cascata quando muitos eventos chegam juntos.
 */
export function useRealtimeTable(table: string, onChange: () => void, options: Options = {}) {
  const { debounceMs = 0 } = options;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (debounceMs <= 0) {
        onChangeRef.current();
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        onChangeRef.current();
      }, debounceMs);
    };

    const channel = supabase
      .channel(`realtime-${table}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        trigger,
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [table, debounceMs]);
}
