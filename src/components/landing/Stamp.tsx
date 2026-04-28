import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StampProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  /** Override the default -3deg rotation. */
  rotate?: number;
}

/**
 * Selo manuscrito "warm farmstand" — Caveat sobre cream com borda dashed clay.
 * Usar com moderação como acento (hero, seções de destaque).
 */
export function Stamp({ children, className, icon, rotate = -3 }: StampProps) {
  return (
    <span
      className={cn('warm-stamp', className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {icon}
      {children}
    </span>
  );
}

export default Stamp;
