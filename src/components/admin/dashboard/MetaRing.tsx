import { cn } from '@/lib/utils';

interface Props {
  value: number;            // 0–100
  size?: number;
  stroke?: number;
  tone?: 'success' | 'destructive' | 'warning' | 'info' | 'primary';
  label?: string;
}

const TONE_CLASS: Record<NonNullable<Props['tone']>, string> = {
  success: 'stroke-success',
  destructive: 'stroke-destructive',
  warning: 'stroke-warning',
  info: 'stroke-info',
  primary: 'stroke-primary',
};

export default function MetaRing({ value, size = 56, stroke = 5, tone = 'primary', label }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-muted fill-none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          className={cn('fill-none transition-[stroke-dashoffset] duration-700 ease-out', TONE_CLASS[tone])}
          style={{ filter: `drop-shadow(0 0 4px hsl(var(--${tone}) / 0.5))` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[11px] font-bold tabular-nums text-foreground">{Math.round(pct)}%</span>
        {label && <span className="text-[8px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</span>}
      </div>
    </div>
  );
}
