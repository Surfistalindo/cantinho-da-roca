import { useMouseTilt } from '@/hooks/useMouseTilt';
import { MSym } from '@/components/crm/MSym';
import { cn } from '@/lib/utils';
import MetaRing from './MetaRing';
import type { ReactNode } from 'react';

export type KpiTone = 'success' | 'destructive' | 'warning' | 'info' | 'primary';

interface Props {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  sub?: string;
  sparkline: number[];
  tone?: KpiTone;
  ringValue?: number;       // se setado, mostra MetaRing no canto
  ringTone?: KpiTone;
  action?: ReactNode;
  icon?: string;
}

const TONE_STROKE: Record<KpiTone, string> = {
  success: 'stroke-success',
  destructive: 'stroke-destructive',
  warning: 'stroke-warning',
  info: 'stroke-info',
  primary: 'stroke-primary',
};
const TONE_FILL_ID: Record<KpiTone, string> = {
  success: 'kpi-grad-success',
  destructive: 'kpi-grad-destructive',
  warning: 'kpi-grad-warning',
  info: 'kpi-grad-info',
  primary: 'kpi-grad-primary',
};
const TONE_BADGE: Record<'up' | 'down' | 'flat', string> = {
  up: 'bg-success/15 text-success border-success/20',
  down: 'bg-destructive/15 text-destructive border-destructive/20',
  flat: 'bg-muted text-muted-foreground border-border',
};
const TONE_GLOW: Record<KpiTone, string> = {
  success: 'hsl(var(--success) / 0.18)',
  destructive: 'hsl(var(--destructive) / 0.18)',
  warning: 'hsl(var(--warning) / 0.18)',
  info: 'hsl(var(--info) / 0.18)',
  primary: 'hsl(var(--primary) / 0.18)',
};

function AreaSpark({ values, tone, gradId }: { values: number[]; tone: KpiTone; gradId: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 36;
  const step = w / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => [i * step, h - ((v - min) / range) * h] as const);
  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={`hsl(var(--${tone}))`} stopOpacity="0.45" />
          <stop offset="100%" stopColor={`hsl(var(--${tone}))`} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" strokeWidth="1.6" className={TONE_STROKE[tone]} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function KpiCard({
  label, value, delta, trend = 'flat', sub, sparkline, tone = 'info', ringValue, ringTone, action, icon,
}: Props) {
  const { ref, tilt, onMouseMove, onMouseLeave } = useMouseTilt(4);
  const trendIcon = trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'trending_flat';

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative rounded-2xl border border-border bg-card p-5 overflow-hidden transition-[transform,box-shadow,border-color] duration-300 will-change-transform hover:border-border-strong motion-reduce:transform-none"
      style={{
        transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        boxShadow: `0 1px 0 0 hsl(0 0% 100% / 0.04) inset, 0 12px 28px -16px hsl(0 0% 0% / 0.55), 0 0 0 1px hsl(0 0% 100% / 0.02) inset`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* gradient mesh + spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80 transition-opacity duration-500"
        style={{
          background: `radial-gradient(420px circle at ${tilt.lightX}% ${tilt.lightY}%, ${TONE_GLOW[tone]}, transparent 55%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(180deg, hsl(0 0% 100% / 0.04) 0%, transparent 35%)`,
        }}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', `bg-${tone}/15 text-${tone}`)}>
                <MSym name={icon} size={16} filled />
              </div>
            )}
            <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground truncate">{label}</p>
          </div>
          {delta && (
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border', TONE_BADGE[trend])}>
              <MSym name={trendIcon} size={11} />
              {delta}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-3">
          <p className="text-[34px] font-bold text-foreground tabular-nums leading-none tracking-tight">{value}</p>
          {ringValue != null && <MetaRing value={ringValue} tone={ringTone ?? tone} label="meta" />}
        </div>

        <div className="mt-3 -mx-1">
          <AreaSpark values={sparkline} tone={tone} gradId={TONE_FILL_ID[tone] + '-' + label.replace(/\s/g, '')} />
        </div>

        <div className="flex items-center justify-between mt-1.5 gap-2">
          {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
          {action}
        </div>
      </div>
    </div>
  );
}
