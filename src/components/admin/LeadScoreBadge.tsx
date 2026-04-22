import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire, faBolt, faSnowflake, faCircleHalfStroke, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getLeadScore, type LeadScoreInfo, type LeadScoreInput } from '@/lib/leadScore';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'badge' | 'dot';

interface Props {
  lead: LeadScoreInput;
  interactionCount?: number;
  size?: Size;
  variant?: Variant;
  className?: string;
  /** Hide the numeric score */
  hideScore?: boolean;
}

const ICONS = {
  fire: faFire,
  bolt: faBolt,
  half: faCircleHalfStroke,
  snow: faSnowflake,
  check: faCircleCheck,
};

const SIZES: Record<Size, { wrap: string; icon: string; text: string; dot: string }> = {
  sm: { wrap: 'h-5 px-1.5 gap-1 text-[10px]', icon: 'h-2.5 w-2.5', text: 'text-[10px]', dot: 'h-2 w-2' },
  md: { wrap: 'h-6 px-2 gap-1.5 text-[11px]', icon: 'h-3 w-3', text: 'text-[11px]', dot: 'h-2.5 w-2.5' },
  lg: { wrap: 'h-8 px-2.5 gap-2 text-xs', icon: 'h-3.5 w-3.5', text: 'text-xs', dot: 'h-3 w-3' },
};

export default function LeadScoreBadge({
  lead,
  interactionCount,
  size = 'sm',
  variant = 'badge',
  className,
  hideScore = false,
}: Props) {
  const info: LeadScoreInfo = getLeadScore(lead, { interactionCount });
  const sz = SIZES[size];
  const icon = ICONS[info.iconKey];
  const pulse = info.urgent;

  const tooltip = (
    <div className="space-y-1.5 max-w-[240px]">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">{info.label}</span>
        <span className="font-mono text-[11px] opacity-70">{info.score}/100</span>
      </div>
      {info.reasons.length > 0 && (
        <ul className="text-[11px] leading-relaxed space-y-0.5 opacity-90">
          {info.reasons.slice(0, 4).map((r, i) => (
            <li key={i}>· {r}</li>
          ))}
        </ul>
      )}
    </div>
  );

  if (variant === 'dot') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex rounded-full shrink-0',
              sz.dot,
              info.dotClass,
              pulse && 'animate-pulse',
              className,
            )}
            aria-label={`Prioridade ${info.label}`}
          />
        </TooltipTrigger>
        <TooltipContent side="top">{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center rounded-full border font-semibold tabular-nums select-none',
            sz.wrap,
            info.toneClass,
            pulse && 'animate-pulse',
            className,
          )}
          aria-label={`Prioridade ${info.label} ${info.score}`}
        >
          <FontAwesomeIcon icon={icon} className={sz.icon} />
          <span>{info.label}</span>
          {!hideScore && info.level !== 'closed' && (
            <span className="opacity-70 font-mono">· {info.score}</span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
