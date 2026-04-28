import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const LeafSvg = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
    <path d="M8 56 C 14 28, 32 10, 56 8 C 56 32, 38 50, 12 56 Z" fill="currentColor" opacity="0.92" />
    <path d="M10 54 C 22 42, 36 28, 52 14" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M22 46 C 26 40, 32 36, 38 34" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    <path d="M28 50 C 32 45, 38 42, 44 41" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.1" strokeLinecap="round" fill="none" />
  </svg>
);

interface EmptyStateProps {
  title: string;
  /** Microcopy curto, em Caveat moss. Ex.: "nada por aqui hoje 🌿" */
  hint?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Tom da ilustração — moss (default) ou clay */
  tone?: 'moss' | 'clay' | 'honey';
}

/**
 * EmptyState ilustrado warm-farmstand. Usado no CRM nos lugares
 * onde antes mostrávamos "Nenhum resultado".
 */
export function EmptyState({
  title,
  hint,
  description,
  action,
  className,
  tone = 'moss',
}: EmptyStateProps) {
  const toneClass =
    tone === 'clay' ? 'text-clay' : tone === 'honey' ? 'text-honey' : 'text-moss';
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      <div className={cn('w-16 h-16 mb-4 opacity-80', toneClass)}>
        <LeafSvg className="w-full h-full" />
      </div>
      {hint && (
        <span className={cn('font-hand text-lg mb-1', toneClass)}>{hint}</span>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
