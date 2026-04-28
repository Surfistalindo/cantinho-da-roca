import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTutorial } from './TutorialProvider';
import type { TourPlacement } from './types';

interface Props {
  targetRect: { x: number; y: number; w: number; h: number } | null;
  placement: TourPlacement;
}

const POPOVER_W = 340;
const GAP = 14;
const SAFE = 12;

export default function TourPopover({ targetRect, placement }: Props) {
  const { currentTour, index, next, prev, stop } = useTutorial();
  const step = currentTour.steps[index];
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [resolvedPlacement, setResolvedPlacement] = useState<TourPlacement>(placement);

  const total = currentTour.steps.length;
  const isLast = index === total - 1;

  // Foca o card ao mudar de passo (acessibilidade)
  useEffect(() => { cardRef.current?.focus(); }, [index]);

  // Calcula posição do popover relativo ao alvo.
  useLayoutEffect(() => {
    const card = cardRef.current;
    const ch = card?.offsetHeight ?? 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!targetRect) {
      // Centro da tela
      setResolvedPlacement('auto');
      setPos({
        left: Math.max(SAFE, (vw - POPOVER_W) / 2),
        top: Math.max(SAFE, (vh - ch) / 2),
      });
      return;
    }

    const r = targetRect;
    const spaces = {
      top: r.y,
      bottom: vh - (r.y + r.h),
      left: r.x,
      right: vw - (r.x + r.w),
    };

    let p: TourPlacement = placement;
    if (p === 'auto') {
      // Escolhe o lado com mais espaço, preferindo bottom > right > top > left.
      const order: TourPlacement[] = ['bottom', 'right', 'top', 'left'];
      p = order.reduce((best, cur) => (spaces[cur] > spaces[best] ? cur : best), 'bottom' as TourPlacement);
    }

    let left = 0; let top = 0;
    switch (p) {
      case 'bottom':
        left = r.x + r.w / 2 - POPOVER_W / 2;
        top = r.y + r.h + GAP;
        break;
      case 'top':
        left = r.x + r.w / 2 - POPOVER_W / 2;
        top = r.y - ch - GAP;
        break;
      case 'left':
        left = r.x - POPOVER_W - GAP;
        top = r.y + r.h / 2 - ch / 2;
        break;
      case 'right':
        left = r.x + r.w + GAP;
        top = r.y + r.h / 2 - ch / 2;
        break;
    }

    // Clamp dentro da viewport.
    left = Math.max(SAFE, Math.min(vw - POPOVER_W - SAFE, left));
    top = Math.max(SAFE, Math.min(vh - ch - SAFE, top));

    setResolvedPlacement(p);
    setPos({ left, top });
  }, [targetRect, placement, index, step?.body]);

  if (!step) return null;

  return (
    <div
      ref={cardRef}
      tabIndex={-1}
      role="document"
      aria-labelledby="tour-step-title"
      className="absolute pointer-events-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl outline-none"
      style={{
        left: pos.left,
        top: pos.top,
        width: POPOVER_W,
        transition: 'left 220ms cubic-bezier(.4,0,.2,1), top 220ms cubic-bezier(.4,0,.2,1)',
        animation: 'tour-pop-in 220ms ease-out',
      }}
      data-placement={resolvedPlacement}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-1.5">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[10.5px] uppercase tracking-wider font-semibold text-primary">
            {currentTour.title} · {index + 1}/{total}
          </span>
          <h3 id="tour-step-title" className="text-[14px] font-semibold tracking-tight text-foreground">
            {step.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={stop}
          aria-label="Encerrar tutorial"
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div
        className="px-4 pb-3 text-[12.5px] leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_strong]:font-semibold"
        // step.body é estático e curado — sem entrada de usuário.
        dangerouslySetInnerHTML={{ __html: step.body }}
      />

      {/* Progresso (dots) */}
      <div className="px-4 pb-3 flex items-center gap-1">
        {currentTour.steps.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === index ? 'w-5 bg-primary' : i < index ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-border'
            }`}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5 bg-card/40 rounded-b-xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={stop}
          className="h-7 px-2 text-[11.5px] text-muted-foreground hover:text-foreground"
        >
          Pular
        </Button>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={prev}
            disabled={index === 0}
            className="h-7 px-2 text-[12px]"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Anterior
          </Button>
          <Button
            size="sm"
            onClick={next}
            className="h-7 px-3 text-[12px] bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {step.nextLabel ?? (isLast ? 'Concluir' : 'Próximo')}
            {!isLast && <ChevronRight className="h-3.5 w-3.5 ml-1" />}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes tour-pop-in {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-placement] { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
