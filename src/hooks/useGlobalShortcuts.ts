import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Options {
  onOpenPalette: () => void;
  onShowHelp?: () => void;
  onNewLead?: () => void;
}

const NAV_MAP: Record<string, string> = {
  d: '/admin/dashboard',
  m: '/admin/my-work',
  l: '/admin/leads',
  p: '/admin/pipeline',
  c: '/admin/clients',
  i: '/admin/ia',
};

const isTyping = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
};

export function useGlobalShortcuts({ onOpenPalette, onShowHelp, onNewLead }: Options) {
  const navigate = useNavigate();

  useEffect(() => {
    let waitingG = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K — palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenPalette();
        return;
      }

      if (isTyping(e.target)) return;
      if (e.altKey || e.metaKey || e.ctrlKey) return;

      if (e.key === '?') { e.preventDefault(); onShowHelp?.(); return; }
      if (e.key === '/') { e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[placeholder^="Buscar"]');
        input?.focus(); return; }
      if (e.key.toLowerCase() === 'n') { e.preventDefault(); onNewLead?.(); return; }

      if (waitingG) {
        const path = NAV_MAP[e.key.toLowerCase()];
        waitingG = false;
        if (gTimer) clearTimeout(gTimer);
        if (path) { e.preventDefault(); navigate(path); }
        return;
      }
      if (e.key.toLowerCase() === 'g') {
        waitingG = true;
        gTimer = setTimeout(() => { waitingG = false; }, 900);
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (gTimer) clearTimeout(gTimer);
    };
  }, [navigate, onOpenPalette, onShowHelp, onNewLead]);
}
