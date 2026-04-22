import { cn } from '@/lib/utils';
import { getLeadStatusConfig } from '@/lib/leadStatus';

export default function LeadStatusBadge({ status, className }: { status: string; className?: string }) {
  const cfg = getLeadStatusConfig(status);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap',
        cfg.color,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}
