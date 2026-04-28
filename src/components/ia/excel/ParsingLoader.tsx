import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faTableColumns, faWandMagicSparkles, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

/**
 * ParsingLoader — animação narrativa para a etapa "lendo planilha".
 * Visual: mini-planilha animada (linhas/colunas que pulsam em onda) +
 * 3 passos que acendem em sequência + barra indeterminada.
 * 100% CSS, tokens semânticos, sem libs novas.
 */
const STEPS = [
  { icon: faFileLines, label: 'Lendo arquivo' },
  { icon: faTableColumns, label: 'Detectando colunas' },
  { icon: faWandMagicSparkles, label: 'Sugerindo mapeamento' },
] as const;

const ROWS = 4;
const COLS = 6;

export default function ParsingLoader() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((s) => (s + 1) % STEPS.length), 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-6 sm:px-10 pt-10 pb-8 flex flex-col items-center text-center">
        {/* Mini planilha animada */}
        <div
          className="relative rounded-xl border border-border bg-background/60 p-3 shadow-sm"
          aria-hidden
        >
          {/* Header simulado */}
          <div className="flex gap-1.5 mb-1.5">
            {Array.from({ length: COLS }).map((_, c) => (
              <div
                key={`h-${c}`}
                className="h-2.5 w-10 rounded-sm bg-primary/25"
                style={{
                  animation: `pl-pulse 1.6s ease-in-out ${c * 0.08}s infinite`,
                }}
              />
            ))}
          </div>
          {/* Linhas */}
          <div className="space-y-1.5">
            {Array.from({ length: ROWS }).map((_, r) => (
              <div key={`r-${r}`} className="flex gap-1.5">
                {Array.from({ length: COLS }).map((_, c) => (
                  <div
                    key={`c-${r}-${c}`}
                    className="h-2 w-10 rounded-sm bg-muted-foreground/20"
                    style={{
                      animation: `pl-pulse 1.6s ease-in-out ${(r + c) * 0.09}s infinite`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* Linha-luz que varre verticalmente */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
            style={{ animation: 'pl-scan 2.2s ease-in-out infinite' }}
          />
        </div>

        {/* Título + subtítulo */}
        <h3 className="mt-6 text-[14.5px] font-semibold text-foreground tracking-tight">
          Lendo e interpretando sua planilha
        </h3>
        <p className="mt-1 text-[12.5px] text-muted-foreground max-w-sm">
          A IA está analisando o conteúdo de cada coluna para sugerir o melhor mapeamento.
        </p>

        {/* Stepper de progresso */}
        <ol className="mt-7 grid grid-cols-3 gap-2 w-full max-w-md" aria-label="Etapas do processamento">
          {STEPS.map((step, i) => {
            const done = i < active;
            const current = i === active;
            return (
              <li
                key={step.label}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border px-2 py-3 transition-all duration-300',
                  done && 'border-primary/30 bg-primary/5',
                  current && 'border-primary/60 bg-primary/10 shadow-sm',
                  !done && !current && 'border-border bg-background/40'
                )}
                aria-current={current ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                    done && 'bg-primary text-primary-foreground',
                    current && 'bg-primary/20 text-primary',
                    !done && !current && 'bg-muted text-muted-foreground'
                  )}
                >
                  <FontAwesomeIcon
                    icon={done ? faCircleCheck : step.icon}
                    className={cn('h-3.5 w-3.5', current && 'animate-pulse')}
                  />
                </span>
                <span
                  className={cn(
                    'text-[11px] leading-tight font-medium',
                    current ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Barra indeterminada */}
        <div
          className="mt-6 h-1 w-full max-w-md overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Carregando"
        >
          <div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40"
            style={{ animation: 'pl-bar 1.4s ease-in-out infinite' }}
          />
        </div>
      </div>

      {/* Keyframes locais */}
      <style>{`
        @keyframes pl-pulse {
          0%, 100% { opacity: 0.35; transform: scaleX(1); }
          50%      { opacity: 1;    transform: scaleX(1.04); }
        }
        @keyframes pl-scan {
          0%   { transform: translateY(0);   opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(80px); opacity: 0; }
        }
        @keyframes pl-bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rounded-2xl [style*="pl-pulse"],
          .rounded-2xl [style*="pl-scan"],
          .rounded-2xl [style*="pl-bar"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
