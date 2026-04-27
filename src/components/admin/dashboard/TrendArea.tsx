import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface TrendSeries {
  key: string;
  label: string;
  values: number[];
  tone: 'primary' | 'success' | 'info' | 'warning' | 'destructive';
}

const TONE_HSL: Record<TrendSeries['tone'], string> = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  info: 'hsl(var(--info))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
};
const TONE_DOT: Record<TrendSeries['tone'], string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
};

interface Props {
  series: TrendSeries[];
  labels: string[];
  height?: number;
}

export default function TrendArea({ series, labels, height = 220 }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const w = 600;
  const h = height;
  const padX = 12;
  const padTop = 16;
  const padBottom = 28;
  const innerW = w - padX * 2;
  const innerH = h - padTop - padBottom;
  const allMax = Math.max(1, ...series.flatMap((s) => s.values));
  const n = labels.length;
  const step = innerW / Math.max(n - 1, 1);

  const xAt = (i: number) => padX + i * step;
  const yAt = (v: number) => padTop + innerH - (v / allMax) * innerH;

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * w;
    const idx = Math.round((x - padX) / step);
    if (idx >= 0 && idx < n) setHoverIdx(idx);
  };

  // gridlines (4 horizontais)
  const gridLines = [0.25, 0.5, 0.75].map((p) => padTop + innerH * (1 - p));

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex items-center gap-3 flex-wrap mb-2">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn('w-2.5 h-2.5 rounded-full', TONE_DOT[s.tone])} />
            {s.label}
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        style={{ height }}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`trend-grad-${s.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={TONE_HSL[s.tone]} stopOpacity="0.35" />
              <stop offset="100%" stopColor={TONE_HSL[s.tone]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {gridLines.map((y, i) => (
          <line key={i} x1={padX} x2={w - padX} y1={y} y2={y} className="stroke-border" strokeDasharray="2 4" strokeWidth="0.5" />
        ))}

        {series.map((s) => {
          const pts = s.values.map((v, i) => [xAt(i), yAt(v)] as const);
          if (pts.length === 0) return null;
          const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
          const areaPath = `${linePath} L ${xAt(s.values.length - 1)} ${padTop + innerH} L ${xAt(0)} ${padTop + innerH} Z`;
          return (
            <g key={s.key}>
              <path d={areaPath} fill={`url(#trend-grad-${s.key})`} />
              <path d={linePath} fill="none" stroke={TONE_HSL[s.tone]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {hoverIdx != null && (
                <circle cx={xAt(hoverIdx)} cy={yAt(s.values[hoverIdx] ?? 0)} r="4" fill={TONE_HSL[s.tone]} stroke="hsl(var(--card))" strokeWidth="2" />
              )}
            </g>
          );
        })}

        {/* x labels */}
        {labels.map((lab, i) => {
          if (n > 14 && i % Math.ceil(n / 7) !== 0 && i !== n - 1) return null;
          return (
            <text key={i} x={xAt(i)} y={h - 8} className="fill-muted-foreground" fontSize="9" textAnchor="middle">
              {lab}
            </text>
          );
        })}

        {hoverIdx != null && (
          <line x1={xAt(hoverIdx)} x2={xAt(hoverIdx)} y1={padTop} y2={padTop + innerH} className="stroke-border" strokeWidth="1" />
        )}
      </svg>

      {hoverIdx != null && (
        <div className="mt-2 flex items-center gap-3 text-[11px] flex-wrap">
          <span className="font-semibold text-foreground">{labels[hoverIdx]}</span>
          {series.map((s) => (
            <span key={s.key} className="text-muted-foreground">
              <span className={cn('inline-block w-2 h-2 rounded-full mr-1 align-middle', TONE_DOT[s.tone])} />
              {s.label}: <span className="text-foreground font-semibold tabular-nums">{s.values[hoverIdx] ?? 0}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
