import { useEffect, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark, faFire } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import AssigneePicker from '@/components/admin/AssigneePicker';

export type PriorityFilter = 'all' | 'hot' | 'warm' | 'cold' | 'urgent';

export interface PipelineFilters {
  q: string;
  origin: string; // 'all' or specific
  priority: PriorityFilter;
  assignee: { id: string | null; name: string | null } | null; // null = no filter
}

interface Props {
  filters: PipelineFilters;
  onChange: (next: PipelineFilters) => void;
  origins: string[];
}

const EMPTY: PipelineFilters = { q: '', origin: 'all', priority: 'all', assignee: null };

const PRIORITY_OPTIONS: { value: PriorityFilter; label: string; tone: string }[] = [
  { value: 'urgent', label: 'Urgente', tone: 'data-[on=true]:bg-destructive data-[on=true]:text-destructive-foreground' },
  { value: 'hot',    label: 'Hot',     tone: 'data-[on=true]:bg-success data-[on=true]:text-success-foreground' },
  { value: 'warm',   label: 'Warm',    tone: 'data-[on=true]:bg-warning data-[on=true]:text-warning-foreground' },
  { value: 'cold',   label: 'Cold',    tone: 'data-[on=true]:bg-muted-foreground/20 data-[on=true]:text-foreground' },
];

export default function PipelineToolbar({ filters, onChange, origins }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // shortcut "/" foca busca, Esc limpa
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        if (filters.q) onChange({ ...filters, q: '' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filters, onChange]);

  const hasFilters = useMemo(
    () => filters.q.length > 0 || filters.origin !== 'all' || filters.priority !== 'all' || !!filters.assignee,
    [filters],
  );

  const setPriority = (p: PriorityFilter) => {
    onChange({ ...filters, priority: filters.priority === p ? 'all' : p });
  };

  return (
    <div
      data-tour="pipeline-filters"
      className="surface-card--hair rounded-lg px-3 py-2 flex flex-wrap items-center gap-2"
    >
      {/* Busca */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none"
        />
        <Input
          ref={inputRef}
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Buscar nome ou telefone…"
          className="h-8 pl-7 pr-7 text-xs"
          aria-label="Buscar leads"
        />
        {filters.q && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, q: '' })}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Limpar busca"
          >
            <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      {/* Origem */}
      <Select
        value={filters.origin}
        onValueChange={(v) => onChange({ ...filters, origin: v })}
      >
        <SelectTrigger className="h-8 w-[140px] text-xs" aria-label="Filtrar por origem">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">Todas as origens</SelectItem>
          {origins.map((o) => (
            <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Responsável */}
      {filters.assignee ? (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => onChange({ ...filters, assignee: null })}
          title="Remover filtro de responsável"
        >
          <span className="truncate max-w-[120px]">{filters.assignee.name ?? 'Responsável'}</span>
          <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5 ml-1.5" />
        </Button>
      ) : (
        <AssigneePicker
          triggerLabel="Responsável"
          triggerSrLabel="Filtrar por responsável"
          align="start"
          side="bottom"
          onSelect={(id, name) => onChange({ ...filters, assignee: id ? { id, name } : null })}
        />
      )}

      {/* Prioridade */}
      <div className="flex items-center gap-1 ml-auto" role="group" aria-label="Prioridade">
        <FontAwesomeIcon icon={faFire} className="h-3 w-3 text-muted-foreground mr-0.5" />
        {PRIORITY_OPTIONS.map((p) => {
          const on = filters.priority === p.value;
          return (
            <button
              key={p.value}
              type="button"
              data-on={on}
              onClick={() => setPriority(p.value)}
              className={cn(
                'h-7 px-2 rounded-md border border-border text-[11px] font-medium transition-colors',
                'hover:bg-muted',
                p.tone,
              )}
              aria-pressed={on}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => onChange(EMPTY)}
        >
          <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}

export const EMPTY_PIPELINE_FILTERS = EMPTY;
