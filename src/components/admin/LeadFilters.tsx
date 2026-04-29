import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { APP_CONFIG } from '@/config/app';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass, faXmark, faFire, faCircleHalfStroke, faSnowflake,
  faPhoneSlash, faCalendarDays, faTag, faUser,
} from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

export type RecencyFilter = 'all' | 'recent' | 'attention' | 'overdue';
export type PriorityFilter = 'all' | 'hot' | 'warm' | 'cold';

export interface InterestOption { value: string; count: number }
export interface AssigneeOption { id: string; name: string }

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
  /** Lista de origens reais presentes nos dados (sobrepõe APP_CONFIG.leadOrigins) */
  availableOrigins?: string[];
  /** Lista de interesses únicos extraídos dos leads */
  interestFilter?: string;
  onInterestChange?: (v: string) => void;
  availableInterests?: InterestOption[];
  /** Filtro de responsável */
  assigneeFilter?: string;
  onAssigneeChange?: (v: string) => void;
  availableAssignees?: AssigneeOption[];
  /** Intervalo de datas (created_at) */
  dateFrom?: Date | null;
  dateTo?: Date | null;
  onDateRangeChange?: (from: Date | null, to: Date | null) => void;
}

export default function LeadFilters({
  search, onSearchChange,
  statusFilter, onStatusChange,
  originFilter, onOriginChange,
  recencyFilter, onRecencyChange,
  priorityFilter, onPriorityChange,
  availableOrigins,
  interestFilter, onInterestChange, availableInterests,
  assigneeFilter, onAssigneeChange, availableAssignees,
  dateFrom, dateTo, onDateRangeChange,
}: Props) {
  const hasFilters =
    search.length > 0 ||
    statusFilter !== 'all' ||
    originFilter !== 'all' ||
    (interestFilter && interestFilter !== 'all') ||
    (assigneeFilter && assigneeFilter !== 'all') ||
    (recencyFilter && recencyFilter !== 'all') ||
    (priorityFilter && priorityFilter !== 'all') ||
    !!dateFrom || !!dateTo;

  const clearAll = () => {
    onSearchChange('');
    onStatusChange('all');
    onOriginChange('all');
    onInterestChange?.('all');
    onAssigneeChange?.('all');
    onRecencyChange?.('all');
    onPriorityChange?.('all');
    onDateRangeChange?.(null, null);
  };

  const noResponseActive =
    recencyFilter === 'overdue' && (statusFilter === 'contacting' || statusFilter === 'negotiating');

  const applyNoResponse = () => {
    if (noResponseActive) {
      onStatusChange('all');
      onRecencyChange?.('all');
    } else {
      onStatusChange('contacting');
      onRecencyChange?.('overdue');
    }
  };

  const dateLabel = (() => {
    if (dateFrom && dateTo) return `${format(dateFrom, 'dd/MM', { locale: ptBR })} – ${format(dateTo, 'dd/MM', { locale: ptBR })}`;
    if (dateFrom) return `Desde ${format(dateFrom, 'dd/MM/yy', { locale: ptBR })}`;
    if (dateTo) return `Até ${format(dateTo, 'dd/MM/yy', { locale: ptBR })}`;
    return 'Período';
  })();

  const presetRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    onDateRangeChange?.(from, to);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-3" role="search" aria-label="Filtros de leads">
      {onRecencyChange && (
        <Button
          variant={noResponseActive ? 'default' : 'outline'}
          size="sm"
          onClick={applyNoResponse}
          aria-pressed={noResponseActive}
          className={cn(
            'h-8 text-[12px] px-2.5',
            noResponseActive && 'bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive',
          )}
        >
          <FontAwesomeIcon icon={faPhoneSlash} className="h-3 w-3 mr-1.5" aria-hidden="true" />
          Sem resposta
        </Button>
      )}
      <div className="relative flex-1 min-w-[240px]">
        <label htmlFor="leads-search" className="sr-only">Buscar em todos os campos</label>
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="leads-search"
          placeholder="Buscar em tudo: nome, telefone, interesse, origem, status, observações…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-[12px] bg-muted/60 border-transparent focus-visible:bg-card focus-visible:border-input"
          title="Pesquisa em tempo real em nome, telefone, interesse, origem, status, observações, resumo de IA e responsável"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px] h-8 text-[12px] bg-muted/60 border-transparent" aria-label="Filtrar por status">
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
        <SelectTrigger className="w-[140px] h-8 text-[12px] bg-muted/60 border-transparent" aria-label="Filtrar por origem">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas origens</SelectItem>
          {(availableOrigins && availableOrigins.length > 0 ? availableOrigins : APP_CONFIG.leadOrigins).map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onInterestChange && availableInterests && availableInterests.length > 0 && (
        <Select value={interestFilter ?? 'all'} onValueChange={onInterestChange}>
          <SelectTrigger className="w-[180px] h-8 text-[12px] bg-muted/60 border-transparent" aria-label="Filtrar por interesse">
            <span className="inline-flex items-center gap-1.5 truncate">
              <FontAwesomeIcon icon={faTag} className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              <SelectValue placeholder="Interesse" />
            </span>
          </SelectTrigger>
          <SelectContent className="max-h-[320px]">
            <SelectItem value="all">Todo interesse</SelectItem>
            {availableInterests.map((it) => (
              <SelectItem key={it.value} value={it.value}>
                <span className="inline-flex items-center justify-between gap-2 w-full">
                  <span className="truncate">{it.value}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{it.count}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {onAssigneeChange && availableAssignees && (
        <Select value={assigneeFilter ?? 'all'} onValueChange={onAssigneeChange}>
          <SelectTrigger className="w-[170px] h-8 text-[12px] bg-muted/60 border-transparent" aria-label="Filtrar por responsável">
            <span className="inline-flex items-center gap-1.5 truncate">
              <FontAwesomeIcon icon={faUser} className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              <SelectValue placeholder="Responsável" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos responsáveis</SelectItem>
            <SelectItem value="none">Sem responsável</SelectItem>
            {availableAssignees.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {onPriorityChange && (
        <Select value={priorityFilter ?? 'all'} onValueChange={(v) => onPriorityChange(v as PriorityFilter)}>
          <SelectTrigger className="w-[150px] h-8 text-[12px] bg-muted/60 border-transparent" aria-label="Filtrar por prioridade">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda prioridade</SelectItem>
            <SelectItem value="hot">
              <span className="inline-flex items-center"><FontAwesomeIcon icon={faFire} className="h-3 w-3 mr-2 text-destructive" aria-hidden="true" />Quentes</span>
            </SelectItem>
            <SelectItem value="warm">
              <span className="inline-flex items-center"><FontAwesomeIcon icon={faCircleHalfStroke} className="h-3 w-3 mr-2 text-warning" aria-hidden="true" />Mornos</span>
            </SelectItem>
            <SelectItem value="cold">
              <span className="inline-flex items-center"><FontAwesomeIcon icon={faSnowflake} className="h-3 w-3 mr-2 text-muted-foreground" aria-hidden="true" />Frios</span>
            </SelectItem>
          </SelectContent>
        </Select>
      )}
      {onRecencyChange && (
        <Select value={recencyFilter ?? 'all'} onValueChange={(v) => onRecencyChange(v as RecencyFilter)}>
          <SelectTrigger className="w-[170px] h-8 text-[12px] bg-muted/60 border-transparent" aria-label="Filtrar por recência">
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
      {onDateRangeChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={dateFrom || dateTo ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-8 text-[12px] px-2.5 gap-1.5',
                (dateFrom || dateTo) && 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15',
              )}
              aria-label="Filtrar por intervalo de datas"
            >
              <FontAwesomeIcon icon={faCalendarDays} className="h-3 w-3" aria-hidden="true" />
              {dateLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex items-center gap-1 border-b border-border p-2">
              <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => presetRange(7)}>7 dias</Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => presetRange(30)}>30 dias</Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => presetRange(90)}>90 dias</Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] ml-auto text-muted-foreground" onClick={() => onDateRangeChange(null, null)}>Limpar</Button>
            </div>
            <Calendar
              mode="range"
              selected={{ from: dateFrom ?? undefined, to: dateTo ?? undefined } as DateRange}
              onSelect={(r) => onDateRangeChange((r as DateRange | undefined)?.from ?? null, (r as DateRange | undefined)?.to ?? null)}
              numberOfMonths={2}
              initialFocus
              locale={ptBR}
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>
      )}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-8 text-[12px] px-2 text-muted-foreground hover:text-foreground"
        >
          <FontAwesomeIcon icon={faXmark} className="h-3 w-3 mr-1" aria-hidden="true" />
          Limpar
        </Button>
      )}
    </div>
  );
}
