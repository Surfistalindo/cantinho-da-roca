import { cn } from '@/lib/utils';

export type StatusCellVariant =
  | 'done'        // verde
  | 'progress'    // azul
  | 'blocked'     // vermelho
  | 'paused'      // laranja
  | 'working'     // azul claro
  | 'review'      // roxo
  | 'neutral';    // cinza

interface Props {
  variant?: StatusCellVariant;
  children: React.ReactNode;
  className?: string;
  /** Quando true, aplica como bloco que ocupa célula inteira (sem cantos). */
  fillCell?: boolean;
  title?: string;
}

const VARIANT_CLASS: Record<StatusCellVariant, string> = {
  done:     'status-done',
  progress: 'status-progress',
  blocked:  'status-blocked',
  paused:   'status-paused',
  working:  'status-working',
  review:   'status-review',
  neutral:  'status-neutral',
};

export default function StatusCell({ variant = 'neutral', children, className, fillCell = false, title }: Props) {
  return (
    <span
      title={title}
      className={cn(
        'status-cell',
        VARIANT_CLASS[variant],
        fillCell ? '' : 'rounded-md',
        className,
      )}
    >
      {children}
    </span>
  );
}
