import { cn } from '@/lib/utils';

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'cyan'
  | 'indigo'
  | 'teal';

const VARIANT_CLASS: Record<StatusVariant, string> = {
  success:  'bg-success/15 text-success ring-success/30',
  warning:  'bg-warning/15 text-warning ring-warning/30',
  danger:   'bg-destructive/15 text-destructive ring-destructive/30',
  info:     'bg-info/15 text-info ring-info/30',
  neutral:  'bg-muted text-muted-foreground ring-border',
  purple:   'text-white ring-0',
  pink:     'text-white ring-0',
  orange:   'text-white ring-0',
  cyan:     'text-white ring-0',
  indigo:   'text-white ring-0',
  teal:     'text-white ring-0',
};

const SOLID_BG: Partial<Record<StatusVariant, string>> = {
  purple: 'bg-tag-purple',
  pink:   'bg-tag-pink',
  orange: 'bg-tag-orange',
  cyan:   'bg-tag-cyan',
  indigo: 'bg-tag-indigo',
  teal:   'bg-tag-teal',
};

interface Props {
  variant?: StatusVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export default function StatusBadge({ variant = 'neutral', children, dot = true, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold leading-5 ring-1 ring-inset whitespace-nowrap',
        VARIANT_CLASS[variant],
        SOLID_BG[variant],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
