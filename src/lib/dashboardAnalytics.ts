// Pure helpers for dashboard analytics. No I/O.

export interface LeadLite {
  id: string;
  name: string;
  origin: string | null;
  status: string;
  created_at: string;
  last_contact_at: string | null;
}
export interface CustomerLite {
  id: string;
  purchase_date: string | null;
  created_at?: string;
}
export interface InteractionLite {
  id: string;
  contact_type: string;
  description: string;
  interaction_date: string;
  lead_id: string | null;
  customer_id: string | null;
}
export interface WAMessageLite {
  id: string;
  lead_id: string | null;
  direction: 'in' | 'out';
  status: string;
  created_at: string;
}

// ---------------- HEATMAP 7x24 ----------------
export interface HeatCell { day: number; hour: number; value: number }
export function buildHeatmap(items: { interaction_date: string }[]): {
  cells: HeatCell[]; max: number; total: number;
} {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  let total = 0;
  for (const it of items) {
    const d = new Date(it.interaction_date);
    if (isNaN(d.getTime())) continue;
    grid[d.getDay()][d.getHours()]++;
    total++;
  }
  let max = 0;
  const cells: HeatCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const v = grid[day][hour];
      if (v > max) max = v;
      cells.push({ day, hour, value: v });
    }
  }
  return { cells, max, total };
}

// ---------------- FUNNEL VELOCITY ----------------
// Heurística: tempo médio (dias) entre created_at e last_contact_at por estágio atual
export interface VelocityRow { stage: string; label: string; avgDays: number; count: number; tone: 'info' | 'primary' | 'warning' | 'success' | 'muted'; }
export function buildVelocity(leads: LeadLite[]): VelocityRow[] {
  const stages: { key: string; label: string; tone: VelocityRow['tone'] }[] = [
    { key: 'new', label: 'Novos sem contato', tone: 'info' },
    { key: 'contacting', label: 'Em contato', tone: 'primary' },
    { key: 'negotiating', label: 'Negociação', tone: 'warning' },
    { key: 'won', label: 'Fechamento', tone: 'success' },
  ];
  const now = Date.now();
  return stages.map((s) => {
    const subset = leads.filter((l) => l.status === s.key);
    if (subset.length === 0) return { stage: s.key, label: s.label, avgDays: 0, count: 0, tone: s.tone };
    const totalDays = subset.reduce((acc, l) => {
      const start = new Date(l.created_at).getTime();
      const end = l.last_contact_at ? new Date(l.last_contact_at).getTime() : now;
      const days = Math.max(0, (end - start) / 86400e3);
      return acc + days;
    }, 0);
    return {
      stage: s.key,
      label: s.label,
      avgDays: totalDays / subset.length,
      count: subset.length,
      tone: s.tone,
    };
  });
}

// ---------------- CHANNEL PERFORMANCE ----------------
export interface ChannelRow {
  origin: string;
  total: number;
  won: number;
  conversionRate: number;
  msgsOut: number;
  msgsIn: number;
  responseRate: number;
  spark: number[]; // 7 buckets
}
export function buildChannels(
  leads: LeadLite[],
  messages: WAMessageLite[],
  weeks = 7,
): ChannelRow[] {
  const leadsByOrigin = new Map<string, LeadLite[]>();
  for (const l of leads) {
    const k = l.origin ?? '(sem origem)';
    if (!leadsByOrigin.has(k)) leadsByOrigin.set(k, []);
    leadsByOrigin.get(k)!.push(l);
  }
  const leadOrigin = new Map<string, string>();
  for (const l of leads) leadOrigin.set(l.id, l.origin ?? '(sem origem)');

  const msgsByOrigin = new Map<string, WAMessageLite[]>();
  for (const m of messages) {
    const k = m.lead_id ? leadOrigin.get(m.lead_id) ?? '(sem origem)' : '(sem origem)';
    if (!msgsByOrigin.has(k)) msgsByOrigin.set(k, []);
    msgsByOrigin.get(k)!.push(m);
  }

  const now = Date.now();
  const dayMs = 86400e3;

  const rows: ChannelRow[] = [];
  for (const [origin, ls] of leadsByOrigin) {
    const total = ls.length;
    const won = ls.filter((l) => l.status === 'won').length;
    const ms = msgsByOrigin.get(origin) ?? [];
    const msgsOut = ms.filter((m) => m.direction === 'out').length;
    const msgsIn = ms.filter((m) => m.direction === 'in').length;

    // sparkline: novos leads por dia nos últimos `weeks` dias
    const spark = Array(weeks).fill(0);
    for (const l of ls) {
      const diff = Math.floor((now - new Date(l.created_at).getTime()) / dayMs);
      const idx = weeks - 1 - diff;
      if (idx >= 0 && idx < weeks) spark[idx]++;
    }

    rows.push({
      origin,
      total,
      won,
      conversionRate: total > 0 ? (won / total) * 100 : 0,
      msgsOut,
      msgsIn,
      responseRate: msgsOut > 0 ? (msgsIn / msgsOut) * 100 : 0,
      spark,
    });
  }
  return rows.sort((a, b) => b.total - a.total);
}

// ---------------- COHORT (semanal) ----------------
export interface CohortRow {
  weekLabel: string;
  weekStart: number;
  size: number;
  buckets: (number | null)[]; // % conv acumulado por W0..W3+
}
export function buildCohort(
  leads: LeadLite[],
  customers: CustomerLite[],
  weeksBack = 6,
): { rows: CohortRow[]; bucketLabels: string[] } {
  const bucketLabels = ['W0', 'W1', 'W2', 'W3+'];
  // assume customer corresponds to converted lead by purchase_date or created_at
  // Aproximação: usamos won leads como conversões e diff de updated->created seria ideal,
  // mas só temos created_at e last_contact_at. Usamos last_contact_at como proxy de fechamento.
  const conversions: { leadId: string; createdAt: number; closedAt: number }[] = [];
  for (const l of leads) {
    if (l.status === 'won') {
      const createdAt = new Date(l.created_at).getTime();
      const closedAt = l.last_contact_at ? new Date(l.last_contact_at).getTime() : createdAt;
      conversions.push({ leadId: l.id, createdAt, closedAt });
    }
  }

  // buckets de semanas (segunda-feira como início)
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const dow = (start.getDay() + 6) % 7; // 0=monday
  start.setDate(start.getDate() - dow);

  const rows: CohortRow[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const cohortLeads = leads.filter((l) => {
      const t = new Date(l.created_at).getTime();
      return t >= weekStart.getTime() && t < weekEnd.getTime();
    });
    const size = cohortLeads.length;
    const cohortIds = new Set(cohortLeads.map((l) => l.id));
    const cohortConv = conversions.filter((c) => cohortIds.has(c.leadId));

    const cumByWeek: number[] = [0, 0, 0, 0];
    for (const c of cohortConv) {
      const weeksToClose = Math.floor((c.closedAt - c.createdAt) / (7 * 86400e3));
      const idx = Math.min(3, Math.max(0, weeksToClose));
      cumByWeek[idx]++;
    }
    // acumulado
    for (let k = 1; k < cumByWeek.length; k++) cumByWeek[k] += cumByWeek[k - 1];

    const ageWeeks = i;
    const buckets = cumByWeek.map((c, k) => {
      if (k > ageWeeks) return null; // ainda não tem dados
      return size > 0 ? (c / size) * 100 : 0;
    });

    rows.push({
      weekLabel: `${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')}`,
      weekStart: weekStart.getTime(),
      size,
      buckets,
    });
  }
  return { rows, bucketLabels };
}
