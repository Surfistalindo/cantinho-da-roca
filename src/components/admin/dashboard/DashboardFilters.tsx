import { useMemo } from 'react';
import { MSym } from '@/components/crm/MSym';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  type DashboardFilterState,
  type DashboardPeriod,
  type DashboardScore,
  PERIOD_LABEL,
  countActiveFilters,
} from '@/lib/dashboardFilters';
import { APP_CONFIG } from '@/config/app';

const PERIODS: DashboardPeriod[] = ['today', '7d', '30d', '90d', 'all'];
const SCORES: { key: DashboardScore; label: string; tone: string }[] = [
  { key: 'urgent', label: 'Urgente', tone: 'bg-destructive/15 text-destructive border-destructive/30' },
  { key: 'hot', label: 'Quente', tone: 'bg-warning/15 text-warning border-warning/30' },
  { key: 'warm', label: 'Morno', tone: 'bg-info/15 text-info border-info/30' },
  { key: 'cold', label: 'Frio', tone: 'bg-muted text-muted-foreground border-border' },
];

interface Props {
  filters: DashboardFilterState;
  availableOrigins: string[];
  onChange: (next: DashboardFilterState) => void;
  onReset: () => void;
  onExport?: () => void;
}

export default function DashboardFilters({ filters, availableOrigins, onChange, onReset, onExport }: Props) {
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  const toggleStatus = (s: string) => {
    const next = filters.statuses.includes(s)
      ? filters.statuses.filter((x) => x !== s)
      : [...filters.statuses, s];
    onChange({ ...filters, statuses: next });
  };
  const toggleOrigin = (o: string) => {
    const next = filters.origins.includes(o)
      ? filters.origins.filter((x) => x !== o)
      : [...filters.origins, o];
    onChange({ ...filters, origins: next });
  };
  const toggleScore = (s: DashboardScore) => {
    const next = filters.scores.includes(s)
      ? filters.scores.filter((x) => x !== s)
      : [...filters.scores, s];
    onChange({ ...filters, scores: next });
  };

  return (
    <div className="sticky top-0 z-20 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Period segmented */}
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5 shadow-sm">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ ...filters, period: p })}
              className={cn(
                'px-3 h-7 text-[11px] font-semibold rounded-md transition-all',
                filters.period === p
                  ? 'bg-primary text-primary-foreground shadow-[0_1px_0_0_hsl(0_0%_100%/0.15)_inset]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>

        {/* Status popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[11px] font-semibold transition-colors',
                filters.statuses.length
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <MSym name="flag" size={13} />
              Status
              {filters.statuses.length > 0 && (
                <span className="ml-0.5 inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                  {filters.statuses.length}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-2">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-2 pb-1.5">Status do lead</p>
            <div className="space-y-0.5">
              {APP_CONFIG.leadStatuses.map((s) => {
                const checked = filters.statuses.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleStatus(s.value)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-left text-[12px]"
                  >
                    <span className={cn('w-4 h-4 rounded border flex items-center justify-center', checked ? 'bg-primary border-primary' : 'border-border')}>
                      {checked && <MSym name="check" size={11} className="text-primary-foreground" />}
                    </span>
                    <span className="text-foreground">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Origin popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[11px] font-semibold transition-colors',
                filters.origins.length
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <MSym name="hub" size={13} />
              Origem
              {filters.origins.length > 0 && (
                <span className="ml-0.5 inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                  {filters.origins.length}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-2 max-h-72 overflow-auto">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-2 pb-1.5">Origem</p>
            <div className="space-y-0.5">
              {availableOrigins.length === 0 && (
                <p className="text-[11px] text-muted-foreground px-2 py-2">Nenhuma origem cadastrada.</p>
              )}
              {availableOrigins.map((o) => {
                const checked = filters.origins.includes(o);
                const display = o === '__none__' ? '(sem origem)' : o;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => toggleOrigin(o)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-left text-[12px]"
                  >
                    <span className={cn('w-4 h-4 rounded border flex items-center justify-center', checked ? 'bg-primary border-primary' : 'border-border')}>
                      {checked && <MSym name="check" size={11} className="text-primary-foreground" />}
                    </span>
                    <span className="text-foreground truncate">{display}</span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Score chips */}
        <div className="hidden md:inline-flex items-center gap-1">
          {SCORES.map((s) => {
            const active = filters.scores.includes(s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggleScore(s.key)}
                className={cn(
                  'h-8 px-2.5 rounded-lg border text-[11px] font-semibold transition-all',
                  active ? s.tone : 'bg-card border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative ml-auto w-full sm:w-56">
          <MSym name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Buscar nome ou telefone…"
            className="h-8 pl-8 text-[12px] bg-card border-border"
          />
        </div>

        {/* Active count + clear */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <MSym name="close" size={13} />
            Limpar ({activeCount})
          </button>
        )}

        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-border bg-card text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <MSym name="download" size={13} />
            Exportar
          </button>
        )}
      </div>
    </div>
  );
}
