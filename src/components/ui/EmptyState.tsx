import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import LeafSvg from '@/assets/illustrations/leaf.svg?react';

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
