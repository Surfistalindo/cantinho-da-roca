import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'crm:theme';
type CrmTheme = 'light' | 'dark';

function readInitial(): CrmTheme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY) as CrmTheme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return 'light';
}

function applyTheme(theme: CrmTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-crm-theme', theme);
}

/**
 * CRM-only theme toggle (light / focus-dark editorial).
 * Persists in localStorage and applies `data-crm-theme` on <html>.
 * Scoped CSS in index.css uses [data-crm-theme="dark"] .font-crm — landing untouched.
 */
export function useCrmTheme() {
  const [theme, setThemeState] = useState<CrmTheme>(readInitial);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: CrmTheme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
