import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { RecencyFilter, PriorityFilter } from '@/components/admin/LeadFilters';

export interface LeadsUrlState {
  search: string;
  status: string;
  origin: string;
  priority: PriorityFilter;
  recency: RecencyFilter;
  from: Date | null;
  to: Date | null;
}

const isPriority = (v: string | null): v is PriorityFilter =>
  v === 'all' || v === 'hot' || v === 'warm' || v === 'cold';
const isRecency = (v: string | null): v is RecencyFilter =>
  v === 'all' || v === 'recent' || v === 'attention' || v === 'overdue';

const parseDate = (v: string | null): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const fmtDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export function useLeadsUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initial = useMemo<LeadsUrlState>(() => {
    const priority = searchParams.get('priority');
    const recency = searchParams.get('recency') ?? (searchParams.get('followup') === '1' ? 'overdue' : null);
    return {
      search: searchParams.get('q') ?? '',
      status: searchParams.get('status') ?? 'all',
      origin: searchParams.get('origin') ?? 'all',
      priority: isPriority(priority) ? priority : 'all',
      recency: isRecency(recency) ? recency : 'all',
      from: parseDate(searchParams.get('from')),
      to: parseDate(searchParams.get('to')),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, setState] = useState<LeadsUrlState>(initial);

  // Debounce write of "q" to avoid history flood
  const writeTimer = useRef<number | null>(null);
  const writeUrl = useCallback(
    (next: LeadsUrlState, immediate = false) => {
      if (writeTimer.current) window.clearTimeout(writeTimer.current);
      const apply = () => {
        const params = new URLSearchParams(searchParams);
        const setOrDel = (k: string, v: string | null | undefined) => {
          if (!v || v === 'all' || v === '') params.delete(k);
          else params.set(k, v);
        };
        setOrDel('q', next.search.trim());
        setOrDel('status', next.status);
        setOrDel('origin', next.origin);
        setOrDel('priority', next.priority);
        setOrDel('recency', next.recency);
        setOrDel('from', fmtDate(next.from));
        setOrDel('to', fmtDate(next.to));
        params.delete('followup');
        setSearchParams(params, { replace: true });
      };
      if (immediate) apply();
      else writeTimer.current = window.setTimeout(apply, 250);
    },
    [searchParams, setSearchParams],
  );

  const set = useCallback(
    (partial: Partial<LeadsUrlState>) => {
      setState((prev) => {
        const next = { ...prev, ...partial };
        const immediate = !('search' in partial);
        writeUrl(next, immediate);
        return next;
      });
    },
    [writeUrl],
  );

  // Cleanup
  useEffect(() => () => { if (writeTimer.current) window.clearTimeout(writeTimer.current); }, []);

  return { ...state, set };
}
