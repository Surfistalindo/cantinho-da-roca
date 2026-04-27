/**
 * Filtros do Dashboard — helpers puros.
 * Estado de filtro centralizado, aplicação determinística e
 * cálculo de granularidade temporal para gráficos.
 */

export type DashboardPeriod = 'today' | '7d' | '30d' | '90d' | 'all';
export type DashboardScore = 'hot' | 'warm' | 'cold' | 'urgent';

export interface DashboardFilterState {
  period: DashboardPeriod;
  statuses: string[];          // [] = todos
  origins: string[];           // [] = todas
  scores: DashboardScore[];    // [] = todos
  search: string;              // nome/telefone
}

export const DEFAULT_FILTERS: DashboardFilterState = {
  period: '30d',
  statuses: [],
  origins: [],
  scores: [],
  search: '',
};

export const PERIOD_LABEL: Record<DashboardPeriod, string> = {
  today: 'Hoje',
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
  all: 'Tudo',
};

export function getPeriodRange(period: DashboardPeriod): { start: number; end: number } {
  const end = Date.now();
  if (period === 'all') return { start: 0, end };
  const days = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return { start: end - days * 86400e3, end };
}

export function getPreviousRange(period: DashboardPeriod): { start: number; end: number } {
  if (period === 'all') return { start: 0, end: 0 };
  const days = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const end = Date.now() - days * 86400e3;
  return { start: end - days * 86400e3, end };
}

/** quantos buckets e tamanho (ms) para a tendência */
export function getTrendBuckets(period: DashboardPeriod): { count: number; sizeMs: number; format: 'hour' | 'day' | 'week' } {
  if (period === 'today') return { count: 12, sizeMs: 2 * 60 * 60 * 1000, format: 'hour' };
  if (period === '7d') return { count: 7, sizeMs: 86400e3, format: 'day' };
  if (period === '30d') return { count: 30, sizeMs: 86400e3, format: 'day' };
  if (period === '90d') return { count: 13, sizeMs: 7 * 86400e3, format: 'week' };
  return { count: 12, sizeMs: 30 * 86400e3, format: 'week' };
}

export function countActiveFilters(f: DashboardFilterState): number {
  let n = 0;
  if (f.period !== '30d') n++;
  if (f.statuses.length) n++;
  if (f.origins.length) n++;
  if (f.scores.length) n++;
  if (f.search.trim()) n++;
  return n;
}

interface AnyLead {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  origin: string | null;
  created_at: string;
}

export function applyLeadFilters<T extends AnyLead>(
  leads: T[],
  filters: DashboardFilterState,
  scoreOf?: (l: T) => { level: string; urgent: boolean },
): T[] {
  const { start, end } = getPeriodRange(filters.period);
  const q = filters.search.trim().toLowerCase();
  return leads.filter((l) => {
    const t = new Date(l.created_at).getTime();
    if (filters.period !== 'all' && (t < start || t > end)) return false;
    if (filters.statuses.length && !filters.statuses.includes(l.status)) return false;
    if (filters.origins.length && !filters.origins.includes(l.origin ?? '__none__')) return false;
    if (q) {
      const inName = l.name.toLowerCase().includes(q);
      const inPhone = (l.phone ?? '').toLowerCase().includes(q);
      if (!inName && !inPhone) return false;
    }
    if (filters.scores.length && scoreOf) {
      const s = scoreOf(l);
      const matches = filters.scores.some((sc) => {
        if (sc === 'urgent') return s.urgent;
        return s.level === sc;
      });
      if (!matches) return false;
    }
    return true;
  });
}

export function bucketByDate<T extends { created_at: string }>(
  items: T[],
  period: DashboardPeriod,
): { values: number[]; labels: string[] } {
  const { count, sizeMs, format } = getTrendBuckets(period);
  const end = Date.now();
  const start = end - count * sizeMs;
  const values = Array(count).fill(0);
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start + i * sizeMs);
    if (format === 'hour') labels.push(d.getHours().toString().padStart(2, '0') + 'h');
    else if (format === 'day') labels.push(d.getDate() + '/' + (d.getMonth() + 1));
    else labels.push('S' + Math.ceil(d.getDate() / 7));
  }
  for (const it of items) {
    const t = new Date(it.created_at).getTime();
    const idx = Math.floor((t - start) / sizeMs);
    if (idx >= 0 && idx < count) values[idx]++;
  }
  return { values, labels };
}

export function encodeFiltersToParams(f: DashboardFilterState): Record<string, string> {
  const out: Record<string, string> = {};
  if (f.period !== '30d') out.period = f.period;
  if (f.statuses.length) out.status = f.statuses.join(',');
  if (f.origins.length) out.origin = f.origins.join(',');
  if (f.scores.length) out.score = f.scores.join(',');
  if (f.search.trim()) out.q = f.search.trim();
  return out;
}

export function decodeFiltersFromParams(p: URLSearchParams): DashboardFilterState {
  const period = (p.get('period') as DashboardPeriod) || '30d';
  return {
    period: ['today', '7d', '30d', '90d', 'all'].includes(period) ? period : '30d',
    statuses: p.get('status')?.split(',').filter(Boolean) ?? [],
    origins: p.get('origin')?.split(',').filter(Boolean) ?? [],
    scores: (p.get('score')?.split(',').filter(Boolean) as DashboardScore[]) ?? [],
    search: p.get('q') ?? '',
  };
}
