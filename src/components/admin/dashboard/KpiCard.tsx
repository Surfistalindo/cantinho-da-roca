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
  ringValue?: number;
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
  up: 'bg-success/12 text-success',
  down: 'bg-destructive/12 text-destructive',
  flat: 'bg-muted text-muted-foreground',
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
          <stop offset="0%" stopColor={`hsl(var(--${tone}))`} stopOpacity="0.28" />
          <stop offset="100%" stopColor={`hsl(var(--${tone}))`} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" strokeWidth="1.4" className={TONE_STROKE[tone]} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function KpiCard({
  label, value, delta, trend = 'flat', sub, sparkline, tone = 'info', ringValue, ringTone, action, icon,
}: Props) {
  const trendIcon = trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'trending_flat';

  return (
    <div className="surface-card--hair crm-card-hover group relative p-5 overflow-hidden">
      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', `bg-${tone}/12 text-${tone}`)}>
                <MSym name={icon} size={16} filled />
              </div>
            )}
            <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground truncate">{label}</p>
          </div>
          {delta && (
            <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums', TONE_BADGE[trend])}>
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
