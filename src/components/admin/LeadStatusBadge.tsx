import { APP_CONFIG } from '@/config/app';
import { cn } from '@/lib/utils';

export default function LeadStatusBadge({ status }: { status: string }) {
  const cfg = APP_CONFIG.leadStatuses.find((s) => s.value === status);
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', cfg?.color ?? 'bg-muted text-muted-foreground')}>
      {cfg?.label ?? status}
    </span>
  );
}
