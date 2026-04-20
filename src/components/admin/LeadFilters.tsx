import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APP_CONFIG } from '@/config/app';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

export type RecencyFilter = 'all' | 'recent' | 'attention' | 'overdue';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  originFilter: string;
  onOriginChange: (v: string) => void;
  recencyFilter?: RecencyFilter;
  onRecencyChange?: (v: RecencyFilter) => void;
}

export default function LeadFilters({
  search, onSearchChange,
  statusFilter, onStatusChange,
  originFilter, onOriginChange,
  recencyFilter, onRecencyChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
      {onRecencyChange && (
        <Select value={recencyFilter ?? 'all'} onValueChange={(v) => onRecencyChange(v as RecencyFilter)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Recência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda recência</SelectItem>
            <SelectItem value="recent">Recentes (≤ 2 dias)</SelectItem>
            <SelectItem value="attention">Atenção (3–6 dias)</SelectItem>
            <SelectItem value="overdue">Atrasados (7+ dias / nunca)</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
