import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTutorial } from './TutorialProvider';
import TourPopover from './TourPopover';

interface Rect { x: number; y: number; w: number; h: number; }

const PADDING = 8; // respiro ao redor do alvo
const RADIUS = 10;

/**
 * Overlay fullscreen com "spotlight" no elemento alvo.
 * Implementação: SVG com máscara — retângulo branco (mostra) + retângulo preto arredondado (esconde overlay).
 */
export default function TourOverlay() {
  const { active, currentTour, index } = useTutorial();
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);

  const step = active ? currentTour.steps[index] : null;
  const isViewport = step?.target === '__viewport__';

  // Recalcula posição do alvo em cada frame durante o tour (cobre scroll/resize/animação).
  useLayoutEffect(() => {
    if (!active || !step) {
      setRect(null);
      return;
    }
    if (isViewport) {
      setRect(null);
      return;
    }

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const el = document.querySelector(step.target) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        setRect((prev) => {
          const nr = { x: r.left, y: r.top, w: r.width, h: r.height };
          if (prev && prev.x === nr.x && prev.y === nr.y && prev.w === nr.w && prev.h === nr.h) return prev;
          return nr;
        });
        // garante que o alvo está visível
        if (r.top < 0 || r.bottom > window.innerHeight) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      } else {
        setRect(null);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [active, step, isViewport]);

  // Bloqueia scroll do body durante o tour pra evitar layout shift.
  useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [active]);

  if (!active || !step) return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;

  // Spotlight rect (com padding)
  const sx = rect ? Math.max(0, rect.x - PADDING) : vw / 2;
  const sy = rect ? Math.max(0, rect.y - PADDING) : vh / 2;
  const sw = rect ? rect.w + PADDING * 2 : 0;
  const sh = rect ? rect.h + PADDING * 2 : 0;

  return (
    <div
      className="fixed inset-0 z-[80] tutorial-overlay-root"
      role="dialog"
      aria-modal="true"
      aria-label={`Tutorial: ${currentTour.title}`}
    >
      {/* Overlay com máscara SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        aria-hidden
      >
        <defs>
          <mask id="tutorial-spot-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && !isViewport && (
              <rect
                x={sx}
                y={sy}
                width={sw}
                height={sh}
                rx={RADIUS}
                ry={RADIUS}
                fill="black"
                style={{ transition: 'all 220ms cubic-bezier(.4,0,.2,1)' }}
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="hsl(var(--foreground))"
          fillOpacity={0.55}
          mask="url(#tutorial-spot-mask)"
        />
        {/* Anel destacando o alvo */}
        {rect && !isViewport && (
          <rect
            x={sx}
            y={sy}
            width={sw}
            height={sh}
            rx={RADIUS}
            ry={RADIUS}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            style={{ transition: 'all 220ms cubic-bezier(.4,0,.2,1)', filter: 'drop-shadow(0 0 12px hsl(var(--primary)/0.45))' }}
          />
        )}
      </svg>

      {/* Popover */}
      <TourPopover targetRect={rect} placement={step.placement ?? 'auto'} />
    </div>
  );
}
