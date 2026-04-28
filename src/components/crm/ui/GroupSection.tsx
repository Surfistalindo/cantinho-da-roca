import { useState, type ReactNode, type CSSProperties } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GroupColor =
  | 'blue' | 'green' | 'orange' | 'red' | 'purple'
  | 'pink' | 'cyan' | 'yellow' | 'teal' | 'indigo' | 'neutral';

const COLOR_VAR: Record<GroupColor, string> = {
  blue:    'hsl(var(--status-progress))',
  green:   'hsl(var(--status-done))',
  orange:  'hsl(var(--status-paused))',
  red:     'hsl(var(--status-blocked))',
  purple:  'hsl(var(--status-review))',
  pink:    'hsl(var(--tag-pink))',
  cyan:    'hsl(var(--tag-cyan))',
  yellow:  'hsl(var(--tag-yellow))',
  teal:    'hsl(var(--tag-teal))',
  indigo:  'hsl(var(--tag-indigo))',
  neutral: 'hsl(var(--status-neutral))',
};

interface Props {
  title: string;
  count: number;
  color?: GroupColor;
  defaultOpen?: boolean;
  /** Texto adicional ao lado do contador (ex.: "2 hoje") */
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Cabeçalho colapsável estilo Monday Work Management ("Sprint 18 - 22/04 a 11/05").
 * Apenas UI — não altera dados nem queries.
 */
export default function GroupSection({
  title,
  count,
  color = 'neutral',
  defaultOpen = true,
  meta,
  children,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const style = { '--group-color': COLOR_VAR[color] } as CSSProperties;

  return (
    <section className={cn('group-section', className)} style={style}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn('group-header', open && 'is-open')}
        aria-expanded={open}
      >
        <ChevronRight className="chev h-4 w-4" />
        <span className="group-color-bar" />
        <span className="group-title">{title}</span>
        <span className="group-count">{count} {count === 1 ? 'item' : 'itens'}</span>
        {meta && <span className="ml-auto text-[11px] text-muted-foreground">{meta}</span>}
      </button>
      {open && <div className="group-body">{children}</div>}
    </section>
  );
}
