import { cn } from '@/lib/utils';
import { getLeadStatusConfig } from '@/lib/leadStatus';

export default function LeadStatusBadge({ status }: { status: string }) {
  const cfg = getLeadStatusConfig(status);
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.color)}>
      {cfg.label}
    </span>
  );
}
