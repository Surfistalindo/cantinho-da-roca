import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import LoadingState from '@/components/admin/LoadingState';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import LeadScoreBadge from '@/components/admin/LeadScoreBadge';
import ContactRecencyBadge from '@/components/admin/ContactRecencyBadge';
import WhatsAppQuickAction from '@/components/admin/WhatsAppQuickAction';
import ReengagementQueue from '@/components/admin/ReengagementQueue';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LEAD_STATUS } from '@/lib/leadStatus';
import { getContactRecency } from '@/lib/contactRecency';
import { getLeadScore, compareByScore } from '@/lib/leadScore';
import { getReengagementCandidates } from '@/lib/reengagement';
import { useInteractionCounts } from '@/hooks/useInteractionCounts';
import { MSym } from '@/components/crm/MSym';
import { cn } from '@/lib/utils';
import KpiCard from '@/components/admin/dashboard/KpiCard';
import FunnelDonut, { type FunnelSegment } from '@/components/admin/dashboard/FunnelDonut';
import TrendArea from '@/components/admin/dashboard/TrendArea';
import OriginBars, { type OriginRow } from '@/components/admin/dashboard/OriginBars';
import DashboardFilters from '@/components/admin/dashboard/DashboardFilters';
import ActivityHeatmap from '@/components/admin/dashboard/ActivityHeatmap';
import FunnelVelocity from '@/components/admin/dashboard/FunnelVelocity';
import ChannelPerformance from '@/components/admin/dashboard/ChannelPerformance';
import RetentionCohort from '@/components/admin/dashboard/RetentionCohort';
import ActivityFeed from '@/components/admin/dashboard/ActivityFeed';
import {
  applyLeadFilters,
  bucketByDate,
  decodeFiltersFromParams,
  encodeFiltersToParams,
  DEFAULT_FILTERS,
  getPreviousRange,
  PERIOD_LABEL,
} from '@/lib/dashboardFilters';
import {
  buildHeatmap,
  buildVelocity,
  buildChannels,
  buildCohort,
  type WAMessageLite,
} from '@/lib/dashboardAnalytics';
import { toast } from 'sonner';

interface LeadLite {
  id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  product_interest: string | null;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  next_contact_at: string | null;
}
interface CustomerLite {
  id: string;
  name: string;
  phone: string | null;
  product_bought: string | null;
  purchase_date: string | null;
  last_contact_at: string | null;
}
interface InteractionLite {
  id: string;
  contact_type: string;
  description: string;
  interaction_date: string;
  lead_id: string | null;
  customer_id: string | null;
}

const STATUS_LABEL_PT: Record<string, string> = {
  new: 'Novo',
  contacting: 'Em contato',
  negotiating: 'Negociação',
  won: 'Cliente',
  lost: 'Perdido',
};

const STATUS_TONE: Record<string, string> = {
  new: 'bg-info/15 text-info',
  contacting: 'bg-primary/15 text-primary',
  negotiating: 'bg-warning/15 text-warning',
  won: 'bg-success/15 text-success',
  lost: 'bg-muted text-muted-foreground',
};

const TABS = [
  { key: 'overview', label: 'Visão geral', icon: 'dashboard' },
  { key: 'funnel', label: 'Funil & Velocidade', icon: 'filter_alt' },
  { key: 'channels', label: 'Canais', icon: 'hub' },
  { key: 'activity', label: 'Atividade & Retenção', icon: 'monitor_heart' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState<LeadLite[]>([]);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [interactions, setInteractions] = useState<InteractionLite[]>([]);
  const [waMessages, setWaMessages] = useState<WAMessageLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(() => decodeFiltersFromParams(searchParams));
  const initialTab = (searchParams.get('tab') as TabKey) || 'overview';
  const [tab, setTab] = useState<TabKey>(initialTab);

  const updateFilters = useCallback((next: typeof filters) => {
    setFilters(next);
    const enc = encodeFiltersToParams(next);
    const newParams = new URLSearchParams(searchParams);
    ['period', 'status', 'origin', 'score', 'q'].forEach((k) => newParams.delete(k));
    Object.entries(enc).forEach(([k, v]) => newParams.set(k, v));
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const updateTab = useCallback((next: TabKey) => {
    setTab(next);
    const newParams = new URLSearchParams(searchParams);
    if (next === 'overview') newParams.delete('tab');
    else newParams.set('tab', next);
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const interactionCounts = useInteractionCounts(leads.map((l) => l.id));

  const fetchData = useCallback(async () => {
    const [leadsRes, customersRes, interactionsRes, waRes] = await Promise.all([
      supabase
        .from('leads')
        .select('id, name, phone, origin, product_interest, status, created_at, last_contact_at, next_contact_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('customers')
        .select('id, name, phone, product_bought, purchase_date, last_contact_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('interactions')
        .select('id, contact_type, description, interaction_date, lead_id, customer_id')
        .order('interaction_date', { ascending: false })
        .limit(500),
      supabase
        .from('whatsapp_messages')
        .select('id, lead_id, direction, status, created_at')
        .order('created_at', { ascending: false })
        .limit(1000),
    ]);
    setLeads((leadsRes.data as LeadLite[]) ?? []);
    setCustomers((customersRes.data as CustomerLite[]) ?? []);
    setInteractions((interactionsRes.data as InteractionLite[]) ?? []);
    setWaMessages((waRes.data as WAMessageLite[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeTable('leads', fetchData);
  useRealtimeTable('customers', fetchData);
  useRealtimeTable('interactions', fetchData);

  const availableOrigins = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => set.add(l.origin ?? '__none__'));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const scoreOf = useCallback((l: LeadLite) => {
    const s = getLeadScore(l, { interactionCount: interactionCounts[l.id] ?? 0 });
    return { level: s.level, urgent: s.urgent };
  }, [interactionCounts]);

  const filteredLeads = useMemo(
    () => applyLeadFilters(leads, filters, scoreOf),
    [leads, filters, scoreOf],
  );

  const prevLeads = useMemo(() => {
    if (filters.period === 'all') return [];
    const { start, end } = getPreviousRange(filters.period);
    return leads.filter((l) => {
      const t = new Date(l.created_at).getTime();
      return t >= start && t < end;
    });
  }, [leads, filters.period]);

  const stats = useMemo(() => {
    const total = filteredLeads.length;
    const sold = filteredLeads.filter((l) => l.status === LEAD_STATUS.WON).length;
    const inProgress = filteredLeads.filter((l) => l.status === LEAD_STATUS.CONTACTING || l.status === LEAD_STATUS.NEGOTIATING).length;

    let attention = 0; let overdue = 0; let hot = 0; let noResponse = 0;
    for (const l of filteredLeads) {
      const info = getContactRecency(l.last_contact_at, l.status, l.created_at);
      if (info.level === 'attention') attention++;
      else if (info.level === 'overdue') {
        overdue++;
        if (l.status === LEAD_STATUS.CONTACTING || l.status === LEAD_STATUS.NEGOTIATING) noResponse++;
      }
      const score = getLeadScore(l, { interactionCount: interactionCounts[l.id] ?? 0 });
      if (score.level === 'hot' || score.urgent) hot++;
    }

    const conversionRate = total > 0 ? (sold / total) * 100 : 0;
    const prevTotal = prevLeads.length;
    const prevSold = prevLeads.filter((l) => l.status === LEAD_STATUS.WON).length;
    const totalDelta = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : (total > 0 ? 100 : 0);
    const prevConv = prevTotal > 0 ? (prevSold / prevTotal) * 100 : 0;
    const convDelta = conversionRate - prevConv;

    return {
      total, sold, inProgress, hot, attention, overdue, noResponse, conversionRate,
      newLeads: filteredLeads.filter((l) => l.status === LEAD_STATUS.NEW).length,
      contacting: filteredLeads.filter((l) => l.status === LEAD_STATUS.CONTACTING).length,
      negotiating: filteredLeads.filter((l) => l.status === LEAD_STATUS.NEGOTIATING).length,
      lostCount: filteredLeads.filter((l) => l.status === LEAD_STATUS.LOST).length,
      totalDelta, convDelta,
      customerCount: customers.length,
    };
  }, [filteredLeads, customers, interactionCounts, prevLeads]);

  const bucketsAll = useMemo(() => bucketByDate(filteredLeads, filters.period), [filteredLeads, filters.period]);
  const bucketsWon = useMemo(
    () => bucketByDate(filteredLeads.filter((l) => l.status === LEAD_STATUS.WON), filters.period),
    [filteredLeads, filters.period],
  );

  const reengagementCandidates = useMemo(() => getReengagementCandidates(leads, customers), [leads, customers]);

  const hotLeads = useMemo(() => {
    return filteredLeads
      .map((l) => ({ ...l, _scoreInfo: getLeadScore(l, { interactionCount: interactionCounts[l.id] ?? 0 }) }))
      .filter((l) => l._scoreInfo.level === 'hot' || l._scoreInfo.urgent)
      .sort(compareByScore)
      .slice(0, 5);
  }, [filteredLeads, interactionCounts]);

  const upcomingSchedule = useMemo(() => {
    const now = Date.now();
    return filteredLeads
      .filter((l) => l.next_contact_at && new Date(l.next_contact_at).getTime() >= now - 86400e3)
      .sort((a, b) => new Date(a.next_contact_at!).getTime() - new Date(b.next_contact_at!).getTime())
      .slice(0, 4);
  }, [filteredLeads]);

  const funnelSegments: FunnelSegment[] = useMemo(() => ([
    { key: 'new', label: 'Novos', value: stats.newLeads, tone: 'info' },
    { key: 'contacting', label: 'Em contato', value: stats.contacting, tone: 'primary' },
    { key: 'negotiating', label: 'Negociação', value: stats.negotiating, tone: 'warning' },
    { key: 'won', label: 'Cliente', value: stats.sold, tone: 'success' },
    { key: 'lost', label: 'Perdido', value: stats.lostCount, tone: 'muted' },
  ]), [stats]);

  const originRows: OriginRow[] = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    for (const l of filteredLeads) {
      const k = l.origin ?? '(sem origem)';
      const cur = map.get(k) ?? { new: 0, contacting: 0, negotiating: 0, won: 0, lost: 0 };
      cur[l.status] = (cur[l.status] ?? 0) + 1;
      map.set(k, cur);
    }
    return Array.from(map.entries())
      .map(([origin, segs]) => ({
        origin,
        segments: [
          { key: 'new', label: 'Novos', value: segs.new ?? 0, tone: 'info' as const },
          { key: 'contacting', label: 'Contato', value: segs.contacting ?? 0, tone: 'primary' as const },
          { key: 'negotiating', label: 'Negoc.', value: segs.negotiating ?? 0, tone: 'warning' as const },
          { key: 'won', label: 'Cliente', value: segs.won ?? 0, tone: 'success' as const },
          { key: 'lost', label: 'Perdido', value: segs.lost ?? 0, tone: 'muted' as const },
        ],
      }))
      .sort((a, b) => b.segments.reduce((x, s) => x + s.value, 0) - a.segments.reduce((x, s) => x + s.value, 0))
      .slice(0, 6);
  }, [filteredLeads]);

  // ---- Novos analytics ----
  const heatmap = useMemo(() => buildHeatmap(interactions), [interactions]);
  const velocity = useMemo(() => buildVelocity(filteredLeads), [filteredLeads]);
  const channels = useMemo(() => buildChannels(filteredLeads, waMessages), [filteredLeads, waMessages]);
  const cohort = useMemo(() => buildCohort(leads, customers), [leads, customers]);

  // Mapas de nomes para o feed
  const leadNames = useMemo(() => Object.fromEntries(leads.map((l) => [l.id, l.name])), [leads]);
  const customerNames = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c.name])), [customers]);

  // Export CSV
  const handleExport = useCallback(() => {
    if (filteredLeads.length === 0) {
      toast.error('Nada para exportar com os filtros atuais.');
      return;
    }
    const header = ['Nome', 'Telefone', 'Origem', 'Interesse', 'Status', 'Criado em', 'Último contato'];
    const rows = filteredLeads.map((l) => [
      l.name, l.phone ?? '', l.origin ?? '', l.product_interest ?? '',
      STATUS_LABEL_PT[l.status] ?? l.status,
      new Date(l.created_at).toLocaleString('pt-BR'),
      l.last_contact_at ? new Date(l.last_contact_at).toLocaleString('pt-BR') : '',
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${filters.period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filteredLeads.length} leads exportados.`);
  }, [filteredLeads, filters.period]);

  if (loading) return <LoadingState variant="cards" />;

  const periodLabel = PERIOD_LABEL[filters.period];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-[1480px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[26px] font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Visão geral da operação · <span className="text-foreground font-semibold">{periodLabel}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/leads"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:opacity-90 transition-opacity"
            >
              <MSym name="add_circle" size={16} filled />
              Adicionar lead
            </Link>
          </div>
        </div>

        {/* Filters */}
        <DashboardFilters
          filters={filters}
          availableOrigins={availableOrigins}
          onChange={updateFilters}
          onReset={() => updateFilters(DEFAULT_FILTERS)}
          onExport={handleExport}
        />

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => updateTab(v as TabKey)}>
          <TabsList data-tour="dashboard-tabs" className="w-full sm:w-auto h-auto p-1 bg-muted/50 grid grid-cols-2 sm:flex">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5 text-[12px] font-semibold"
              >
                <MSym name={t.icon} size={15} />
                <span>{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ===== OVERVIEW ===== */}
          <TabsContent value="overview" className="mt-5 space-y-5 animate-fade-in-up">
            <div data-tour="dashboard-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Total de Leads" icon="group" value={stats.total.toString()}
                delta={`${stats.totalDelta >= 0 ? '+' : ''}${stats.totalDelta}%`}
                trend={stats.totalDelta >= 0 ? 'up' : 'down'}
                sub={`${stats.customerCount} clientes ativos`}
                sparkline={bucketsAll.values} tone="info" />
              <KpiCard label="Em andamento" icon="autorenew" value={stats.inProgress.toString()}
                delta={`${stats.negotiating} negoc.`} trend="flat"
                sub={`${stats.contacting} em contato ativo`}
                sparkline={[stats.newLeads, stats.contacting, stats.negotiating, stats.sold]}
                tone="warning" />
              <KpiCard label="Conversão" icon="rocket_launch" value={`${stats.conversionRate.toFixed(1)}%`}
                delta={`${stats.convDelta >= 0 ? '+' : ''}${stats.convDelta.toFixed(1)}pp`}
                trend={stats.convDelta >= 0 ? 'up' : 'down'} sub="Meta: 18.0%"
                sparkline={bucketsWon.values}
                tone={stats.convDelta >= 0 ? 'success' : 'destructive'}
                ringValue={(stats.conversionRate / 18) * 100} ringTone="success" />
              <KpiCard label="Sem resposta" icon="warning" value={stats.noResponse.toString()}
                delta={`${stats.overdue} atrasados`}
                trend={stats.noResponse > 0 ? 'down' : 'up'}
                sub="Reengaje hoje"
                sparkline={[0, stats.attention, stats.overdue, stats.noResponse]}
                tone="destructive" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div data-tour="dashboard-chart" className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MSym name="show_chart" size={18} className="text-primary" />
                    Tendência de leads
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{periodLabel}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4">Volume diário comparado a conversões.</p>
                <TrendArea
                  labels={bucketsAll.labels}
                  series={[
                    { key: 'all', label: 'Todos os leads', values: bucketsAll.values, tone: 'primary' },
                    { key: 'won', label: 'Ganhos', values: bucketsWon.values, tone: 'success' },
                  ]}
                />
              </div>

              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Snapshot</h3>
                <ul className="space-y-2.5">
                  {[
                    { label: 'Quentes', value: stats.hot, tone: 'text-warning', icon: 'local_fire_department' },
                    { label: 'Atenção', value: stats.attention, tone: 'text-info', icon: 'visibility' },
                    { label: 'Atrasados', value: stats.overdue, tone: 'text-destructive', icon: 'schedule' },
                    { label: 'Reengajar', value: reengagementCandidates.length, tone: 'text-primary', icon: 'replay' },
                  ].map((s) => (
                    <li key={s.label} className="flex items-center gap-2.5">
                      <MSym name={s.icon} size={16} className={s.tone} filled />
                      <span className="text-[12px] text-foreground/90">{s.label}</span>
                      <span className="ml-auto text-[14px] font-bold tabular-nums text-foreground">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <MSym name="local_fire_department" size={18} className="text-destructive" filled />
                      Priority Leads
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{hotLeads.length} leads quentes priorizados</p>
                  </div>
                </div>
                {hotLeads.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm font-medium text-foreground">Nenhum lead quente</p>
                    <p className="text-xs text-muted-foreground mt-1">Os leads mais promissores aparecerão aqui.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {hotLeads.map((l) => {
                      const meta = [l.origin, l.product_interest].filter(Boolean).join(' · ');
                      const statusLabel = STATUS_LABEL_PT[l.status] ?? l.status;
                      return (
                        <li key={l.id}>
                          <Link to={`/admin/leads?focus=${l.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                            <InitialsAvatar name={l.name} size="md" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-foreground truncate">{l.name}</p>
                                <span className={cn('inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full', STATUS_TONE[l.status] ?? 'bg-muted text-muted-foreground')}>
                                  {statusLabel}
                                </span>
                                <LeadScoreBadge lead={l} interactionCount={interactionCounts[l.id] ?? 0} size="sm" />
                              </div>
                              {meta && (
                                <p className="text-xs text-muted-foreground truncate mt-1">{meta}</p>
                              )}
                            </div>
                            {l.phone && (
                              <WhatsAppQuickAction lead={l} interactionCount={interactionCounts[l.id] ?? 0} variant="icon" size="sm" onSent={fetchData} />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MSym name="calendar_today" size={18} className="text-primary" />
                    Próximos contatos
                  </h3>
                </div>
                {upcomingSchedule.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">Nenhum retorno agendado.</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {upcomingSchedule.map((l) => {
                      const d = new Date(l.next_contact_at!);
                      const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
                      const day = d.getDate();
                      const hour = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <li key={l.id}>
                          <Link to={`/admin/leads?focus=${l.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                            <div className="shrink-0 w-12 h-12 rounded-lg bg-muted flex flex-col items-center justify-center leading-none">
                              <span className="text-[9px] font-bold text-muted-foreground">{month}</span>
                              <span className="text-[16px] font-bold text-foreground tabular-nums">{day}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold text-foreground truncate">{l.name}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{hour} · {l.product_interest ?? 'Retorno'}</p>
                            </div>
                            <ContactRecencyBadge lastContactAt={l.last_contact_at} status={l.status} createdAt={l.created_at} size="sm" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ===== FUNNEL & VELOCITY ===== */}
          <TabsContent value="funnel" className="mt-5 space-y-5 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MSym name="donut_large" size={18} className="text-info" />
                    Funil de conversão
                  </h3>
                  <Link to="/admin/pipeline" className="text-[11px] font-semibold text-primary hover:opacity-80">Pipeline →</Link>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4">Distribuição por estágio.</p>
                <FunnelDonut segments={funnelSegments} />
              </div>

              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MSym name="speed" size={18} className="text-warning" />
                    Velocidade do funil
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4">Tempo médio em cada estágio. Quanto menor, melhor.</p>
                <FunnelVelocity rows={velocity} />
              </div>
            </div>
          </TabsContent>

          {/* ===== CHANNELS ===== */}
          <TabsContent value="channels" className="mt-5 space-y-5 animate-fade-in-up">
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MSym name="hub" size={18} className="text-primary" />
                  Performance por canal
                </h3>
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{channels.length} canais</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">Volume, conversão e taxa de resposta por origem do lead.</p>
              <ChannelPerformance
                rows={channels}
                activeOrigin={filters.origins.length === 1 ? filters.origins[0] : null}
                onSelect={(origin) => {
                  const isActive = filters.origins.length === 1 && filters.origins[0] === origin;
                  updateFilters({ ...filters, origins: isActive ? [] : [origin] });
                }}
              />
            </div>

            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MSym name="bar_chart" size={18} className="text-warning" />
                  Origem dos leads — composição por estágio
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">Como os leads de cada origem se distribuem no funil.</p>
              <OriginBars rows={originRows} />
            </div>
          </TabsContent>

          {/* ===== ACTIVITY & RETENTION ===== */}
          <TabsContent value="activity" className="mt-5 space-y-5 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MSym name="grid_on" size={18} className="text-primary" />
                    Heatmap de atividade
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{heatmap.total} interações</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4">Quando seus leads mais respondem? Use para agendar contatos.</p>
                <ActivityHeatmap cells={heatmap.cells} max={heatmap.max} total={heatmap.total} />
              </div>

              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MSym name="timeline" size={18} className="text-success" />
                    Cohort de conversão
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4">% de leads que viraram cliente, por semana de entrada.</p>
                <RetentionCohort rows={cohort.rows} bucketLabels={cohort.bucketLabels} />
              </div>
            </div>

            <ActivityFeed
              items={interactions}
              leadNames={leadNames}
              customerNames={customerNames}
            />

            <ReengagementQueue candidates={reengagementCandidates} onSent={fetchData} />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
