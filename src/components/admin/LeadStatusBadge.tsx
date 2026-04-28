import { cn } from '@/lib/utils';
import { getLeadStatusConfig } from '@/lib/leadStatus';

/**
 * Mapeia status do lead → classe sólida Monday-style.
 * `new` → azul claro, `contacting` → azul, `negotiating` → laranja,
 * `won` → verde, `lost` → vermelho.
 */
const STATUS_SOLID: Record<string, string> = {
  new:         'status-working',     // azul claro
  contacting:  'status-progress',    // azul "em andamento"
  negotiating: 'status-paused',      // laranja
  won:         'status-done',        // verde
  lost:        'status-blocked',     // vermelho
};

interface Props {
  status: string;
  className?: string;
  /** 'pill' (default) = pílula compacta colorida; 'solid' = bloco sólido cheio. */
  variant?: 'pill' | 'solid';
}

export default function LeadStatusBadge({ status, className, variant = 'pill' }: Props) {
  const cfg = getLeadStatusConfig(status);
  const solidClass = STATUS_SOLID[status] ?? 'status-neutral';

  if (variant === 'solid') {
    return (
      <span className={cn('status-cell rounded-md', solidClass, className)}>
        {cfg.label}
      </span>
    );
  }

  // Pill — pílula colorida sólida (Monday-style compacto)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-semibold leading-5 whitespace-nowrap text-white',
        solidClass,
        className,
      )}
    >
      {cfg.label}
    </span>
  );
}
