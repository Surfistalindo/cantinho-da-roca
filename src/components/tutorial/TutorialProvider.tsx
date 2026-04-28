import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { Tour } from './types';
import { resolveTour } from './tours';

const STORAGE_KEY = 'tutorial:state:v1';

interface PersistedState {
  completed: Record<string, number>; // tourId -> version concluída
}

function loadState(): PersistedState {
  if (typeof window === 'undefined') return { completed: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: {} };
    const p = JSON.parse(raw);
    return { completed: p.completed ?? {} };
  } catch {
    return { completed: {} };
  }
}

function saveState(s: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

interface TutorialCtx {
  /** Tour resolvido para a rota atual */
  currentTour: Tour;
  /** Se o tour está rodando agora */
  active: boolean;
  /** Índice do passo atual quando active */
  index: number;
  start: (tour?: Tour) => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
  goTo: (i: number) => void;
  /** True se o usuário já completou a versão atual deste tour */
  isCompleted: (tourId: string, version?: number) => boolean;
}

const Ctx = createContext<TutorialCtx | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const currentTour = useMemo(() => resolveTour(location.pathname), [location.pathname]);

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [activeTour, setActiveTour] = useState<Tour>(currentTour);
  const [persisted, setPersisted] = useState<PersistedState>(() => loadState());

  // Para o tour ao mudar de rota, evitando highlights órfãos.
  useEffect(() => {
    setActive(false);
    setIndex(0);
  }, [location.pathname]);

  const stop = useCallback(() => {
    setActive(false);
    setIndex(0);
  }, []);

  const markCompleted = useCallback((tour: Tour) => {
    const next = {
      completed: { ...persisted.completed, [tour.id]: tour.version ?? 1 },
    };
    setPersisted(next);
    saveState(next);
  }, [persisted]);

  const start = useCallback((tour?: Tour) => {
    const t = tour ?? currentTour;
    setActiveTour(t);
    setIndex(0);
    setActive(true);
  }, [currentTour]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= activeTour.steps.length) {
        markCompleted(activeTour);
        setActive(false);
        return 0;
      }
      return i + 1;
    });
  }, [activeTour, markCompleted]);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goTo = useCallback((i: number) => {
    if (i < 0 || i >= activeTour.steps.length) return;
    setIndex(i);
  }, [activeTour]);

  const isCompleted = useCallback((tourId: string, version = 1) => {
    return (persisted.completed[tourId] ?? 0) >= version;
  }, [persisted]);

  // Atalhos: ESC sai do tour, ← / → navegam.
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { stop(); }
      else if (e.key === 'ArrowRight') { next(); }
      else if (e.key === 'ArrowLeft') { prev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, next, prev, stop]);

  // Dispara ação do passo, se houver.
  useEffect(() => {
    if (!active) return;
    const step = activeTour.steps[index];
    if (step?.action) {
      try { void step.action(); } catch { /* noop */ }
    }
  }, [active, activeTour, index]);

  const value: TutorialCtx = {
    currentTour: active ? activeTour : currentTour,
    active,
    index,
    start,
    next,
    prev,
    stop,
    goTo,
    isCompleted,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const NOOP_CTX: TutorialCtx = {
  currentTour: { id: 'noop', title: '', summary: '', steps: [], version: 0 },
  active: false,
  index: 0,
  start: () => {},
  next: () => {},
  prev: () => {},
  stop: () => {},
  goTo: () => {},
  isCompleted: () => true,
};

export function useTutorial() {
  const c = useContext(Ctx);
  if (!c) {
    // Em vez de derrubar a árvore (blank screen), devolve um contexto inerte.
    // Isso protege contra HMR stale e usos do HelpButton fora do CrmLayout.
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('useTutorial usado fora de <TutorialProvider> — retornando contexto vazio.');
    }
    return NOOP_CTX;
  }
  return c;
}

