import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APP_CONFIG } from '@/config/app';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  leadId: string;
  currentStatus: string;
  onUpdated: () => void;
}

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

  return (
    <Select value={currentStatus} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[140px] text-xs bg-transparent border-transparent hover:bg-muted/60 transition-colors">
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
