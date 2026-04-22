import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';

export type RecencyFilter = 'all' | 'recent' | 'attention' | 'overdue';
export type PriorityFilter = 'all' | 'hot' | 'warm' | 'cold';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  originFilter: string;
  onOriginChange: (v: string) => void;
  recencyFilter?: RecencyFilter;
  onRecencyChange?: (v: RecencyFilter) => void;
  priorityFilter?: PriorityFilter;
  onPriorityChange?: (v: PriorityFilter) => void;
}

export default function LeadFilters({
  search, onSearchChange,
  statusFilter, onStatusChange,
  originFilter, onOriginChange,
  recencyFilter, onRecencyChange,
  priorityFilter, onPriorityChange,
}: Props) {
  const hasFilters =
    search.length > 0 ||
    statusFilter !== 'all' ||
    originFilter !== 'all' ||
    (recencyFilter && recencyFilter !== 'all') ||
    (priorityFilter && priorityFilter !== 'all');

  const clearAll = () => {
    onSearchChange('');
    onStatusChange('all');
    onOriginChange('all');
    onRecencyChange?.('all');
    onPriorityChange?.('all');
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-5">
      <div className="relative flex-1 min-w-[220px]">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
        />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 bg-muted/40 border-transparent focus-visible:bg-card focus-visible:border-input"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[150px] h-10 text-xs bg-muted/40 border-transparent">
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
        <SelectTrigger className="w-[150px] h-10 text-xs bg-muted/40 border-transparent">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas origens</SelectItem>
          {APP_CONFIG.leadOrigins.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onPriorityChange && (
        <Select value={priorityFilter ?? 'all'} onValueChange={(v) => onPriorityChange(v as PriorityFilter)}>
          <SelectTrigger className="w-[160px] h-10 text-xs bg-muted/40 border-transparent">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda prioridade</SelectItem>
            <SelectItem value="hot">🔥 Quentes</SelectItem>
            <SelectItem value="warm">🌤 Mornos</SelectItem>
            <SelectItem value="cold">❄ Frios</SelectItem>
          </SelectContent>
        </Select>
      )}
      {onRecencyChange && (
        <Select value={recencyFilter ?? 'all'} onValueChange={(v) => onRecencyChange(v as RecencyFilter)}>
          <SelectTrigger className="w-[180px] h-10 text-xs bg-muted/40 border-transparent">
            <SelectValue placeholder="Recência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda recência</SelectItem>
            <SelectItem value="recent">Recentes (≤ 2 dias)</SelectItem>
            <SelectItem value="attention">Atenção (3–6 dias)</SelectItem>
            <SelectItem value="overdue">Atrasados (7+ dias)</SelectItem>
          </SelectContent>
        </Select>
      )}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-10 text-xs text-muted-foreground hover:text-foreground"
        >
          <FontAwesomeIcon icon={faXmark} className="h-3 w-3 mr-1.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}
