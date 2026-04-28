import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'leads:pageSize';
export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

function readStoredSize(): PageSize {
  if (typeof window === 'undefined') return 50;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = Number(raw);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? (n as PageSize) : 50;
}

/**
 * Per-group pagination state for the Leads page.
 *
 * - One global `pageSize` shared across groups (persisted in localStorage).
 * - Independent `currentPage` per group key.
 * - Pages auto-clamp when the underlying list shrinks (e.g. after filtering).
 * - `resetAll()` should be called whenever filters/search change.
 */
export function useLeadsPaged() {
  const [pageSize, setPageSizeState] = useState<PageSize>(() => readStoredSize());
  const [pages, setPages] = useState<Record<string, number>>({});

  const setPageSize = useCallback((size: PageSize) => {
    setPageSizeState(size);
    setPages({}); // reset all when page size changes
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(size));
    }
  }, []);

  const setPage = useCallback((groupKey: string, page: number) => {
    setPages((prev) => ({ ...prev, [groupKey]: Math.max(1, page) }));
  }, []);

  const resetAll = useCallback(() => setPages({}), []);

  const paginate = useCallback(
    <T,>(items: T[], groupKey: string) => {
      const total = items.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const rawPage = pages[groupKey] ?? 1;
      const page = Math.min(Math.max(1, rawPage), totalPages);
      const start = (page - 1) * pageSize;
      const end = Math.min(start + pageSize, total);
      const pageItems = items.slice(start, end);
      return {
        pageItems,
        page,
        totalPages,
        total,
        rangeStart: total === 0 ? 0 : start + 1,
        rangeEnd: end,
        setPage: (p: number) => setPage(groupKey, p),
      };
    },
    [pageSize, pages, setPage],
  );

  return useMemo(
    () => ({ pageSize, setPageSize, paginate, resetAll }),
    [pageSize, setPageSize, paginate, resetAll],
  );
}

/** Helper to call resetAll whenever any of `deps` changes. */
export function useResetPagesOn(reset: () => void, deps: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reset, deps);
}
