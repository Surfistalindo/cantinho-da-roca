import { cn } from '@/lib/utils';

interface Props {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
}

/** Lightweight wrapper around Google Material Symbols Outlined. */
export function MSym({ name, className, filled, size }: Props) {
  return (
    <span
      className={cn('material-symbols-outlined', filled && 'msym-fill', className)}
      style={size ? { fontSize: `${size}px` } : undefined}
      aria-hidden
    >
      {name}
    </span>
  );
}
