import { cn } from '@/lib/utils';

interface Props {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

/**
 * Barra de ações compacta no topo de um board.
 * Apenas layout — recebe o conteúdo já com seus handlers/estados.
 */
export default function ActionToolbar({ left, right, className }: Props) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap py-2 px-3 border-b border-border bg-card/60', className)}>
      <div className="flex items-center gap-2 flex-wrap">{left}</div>
      <div className="ml-auto flex items-center gap-2 flex-wrap">{right}</div>
    </div>
  );
}
