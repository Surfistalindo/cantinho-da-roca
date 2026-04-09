import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import { Search, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  originFilter: string;
  onOriginChange: (v: string) => void;
  followUpFilter?: boolean;
  onFollowUpChange?: (v: boolean) => void;
}

export default function LeadFilters({ search, onSearchChange, statusFilter, onStatusChange, originFilter, onOriginChange, followUpFilter, onFollowUpChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {APP_CONFIG.leadStatuses.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={originFilter} onValueChange={onOriginChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas origens</SelectItem>
          {APP_CONFIG.leadOrigins.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onFollowUpChange && (
        <Button
          variant={followUpFilter ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFollowUpChange(!followUpFilter)}
          className={cn('gap-1.5', followUpFilter && 'bg-orange-500 hover:bg-orange-600')}
        >
          <AlertTriangle className="h-3.5 w-3.5" /> Follow-up
        </Button>
      )}
    </div>
  );
}
