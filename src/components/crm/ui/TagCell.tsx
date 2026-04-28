import { cn } from '@/lib/utils';

export type TagColor =
  | 'blue' | 'cyan' | 'green' | 'yellow' | 'orange'
  | 'red' | 'pink' | 'purple' | 'indigo' | 'teal' | 'neutral';

interface Props {
  color?: TagColor;
  children: React.ReactNode;
  className?: string;
}

/**
 * Mapeamento estável: dado um texto qualquer (ex.: "Site", "WhatsApp"),
 * retorna sempre a mesma cor de tag para manter consistência visual.
 */
const PALETTE: TagColor[] = ['blue', 'pink', 'purple', 'cyan', 'orange', 'green', 'teal', 'indigo', 'yellow', 'red'];

export function colorForLabel(label: string | null | undefined): TagColor {
  if (!label) return 'neutral';
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function TagCell({ color = 'neutral', children, className }: Props) {
  return (
    <span className={cn('tag-cell', `tag-${color}`, className)}>
      {children}
    </span>
  );
}
