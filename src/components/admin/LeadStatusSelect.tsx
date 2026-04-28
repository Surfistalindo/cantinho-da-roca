import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APP_CONFIG } from '@/config/app';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  leadId: string;
  currentStatus: string;
  onUpdated: () => void;
}

const STATUS_SOLID: Record<string, string> = {
  new:         'bg-[hsl(var(--status-working))] text-white',
  contacting:  'bg-[hsl(var(--status-progress))] text-white',
  negotiating: 'bg-[hsl(var(--status-paused))] text-[hsl(30_80%_14%)]',
  won:         'bg-[hsl(var(--status-done))] text-white',
  lost:        'bg-[hsl(var(--status-blocked))] text-white',
};

export default function LeadStatusSelect({ leadId, currentStatus, onUpdated }: Props) {
  const handleChange = async (value: string) => {
    const { error } = await supabase.from('leads').update({ status: value }).eq('id', leadId);
    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }
    toast.success('Status atualizado');
    onUpdated();
  };

  const colorClass = STATUS_SOLID[currentStatus] ?? 'bg-[hsl(var(--status-neutral))] text-foreground';

  return (
    <Select value={currentStatus} onValueChange={handleChange}>
      <SelectTrigger
        className={cn(
          'h-7 w-full min-w-[120px] text-[11.5px] font-semibold border-0 rounded-md px-2.5 transition-opacity hover:opacity-90 focus:ring-2 focus:ring-primary/30',
          '[&>svg]:opacity-70 [&>svg]:h-3 [&>svg]:w-3',
          colorClass,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {APP_CONFIG.leadStatuses.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
