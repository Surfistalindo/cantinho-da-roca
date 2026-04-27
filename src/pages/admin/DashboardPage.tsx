import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import LoadingState from '@/components/admin/LoadingState';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import LeadScoreBadge from '@/components/admin/LeadScoreBadge';
import ContactRecencyBadge from '@/components/admin/ContactRecencyBadge';
import WhatsAppQuickAction from '@/components/admin/WhatsAppQuickAction';
import ReengagementQueue from '@/components/admin/ReengagementQueue';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LEAD_STATUS } from '@/lib/leadStatus';
import { getContactRecency } from '@/lib/contactRecency';
import { getLeadScore, compareByScore } from '@/lib/leadScore';
import { getReengagementCandidates } from '@/lib/reengagement';
import { useInteractionCounts } from '@/hooks/useInteractionCounts';
import { MSym } from '@/components/crm/MSym';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

function Sparkline({ values, tone = 'success' }: { values: number[]; tone?: 'success' | 'destructive' | 'info' | 'warning' }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 32;
  const step = w / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');
  const colorClass = {
    success: 'stroke-success',
    destructive: 'stroke-destructive',
    info: 'stroke-info',
    warning: 'stroke-warning',
  }[tone];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline points={points} fill="none" strokeWidth="1.8" className={colorClass} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<LeadLite[]>([]);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [interactions, setInteractions] = useState<InteractionLite[]>([]);
  const [loading, setLoading] = useState(true);

  const interactionCounts = useInteractionCounts(leads.map((l) => l.id));

  const fetchData = useCallback(async () => {
    const [leadsRes, customersRes, interactionsRes] = await Promise.all([
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
        .limit(8),
    ]);
    setLeads((leadsRes.data as LeadLite[]) ?? []);
    setCustomers((customersRes.data as CustomerLite[]) ?? []);
    setInteractions((interactionsRes.data as InteractionLite[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeTable('leads', fetchData);
  useRealtimeTable('customers', fetchData);
  useRealtimeTable('interactions', fetchData);

  // STATS ----------------------------------------------------------
  const stats = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86400e3;
    const thirtyDaysAgo = now - 30 * 86400e3;
    const sixtyDaysAgo = now - 60 * 86400e3;

    const total = leads.length;
    const sold = leads.filter((l) => l.status === LEAD_STATUS.WON).length;
    const inProgress = leads.filter((l) => l.status === LEAD_STATUS.CONTACTING || l.status === LEAD_STATUS.NEGOTIATING).length;
    const newLast7d = leads.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo).length;

    const last30Sold = leads.filter((l) => l.status === LEAD_STATUS.WON && new Date(l.created_at).getTime() >= thirtyDaysAgo).length;
    const prev30Sold = leads.filter((l) => l.status === LEAD_STATUS.WON && new Date(l.created_at).getTime() >= sixtyDaysAgo && new Date(l.created_at).getTime() < thirtyDaysAgo).length;

    let attention = 0; let overdue = 0; let hot = 0; let noResponse = 0;
    for (const l of leads) {
      const info = getContactRecency(l.last_contact_at, l.status, l.created_at);
      if (info.level === 'attention') attention++;
      else if (info.level === 'overdue') {
        overdue++;
        if (l.status === LEAD_STATUS.CONTACTING || l.status === LEAD_STATUS.NEGOTIATING) noResponse++;
      }
      const score = getLeadScore(l, { interactionCount: interactionCounts[l.id] ?? 0 });
      if (score.level === 'hot' || score.urgent) hot++;
    }

    // sparkline: leads criados nos últimos 7 dias
    const buckets: number[] = Array.from({ length: 7 }, () => 0);
    leads.forEach((l) => {
      const d = new Date(l.created_at).getTime();
      const idx = 6 - Math.floor((now - d) / 86400e3);
      if (idx >= 0 && idx <= 6) buckets[idx]++;
    });

    const conversionRate = total > 0 ? (sold / total) * 100 : 0;

    return {
      total,
      sold,
      inProgress,
      hot,
      attention,
      overdue,
      noResponse,
      newLast7d,
      conversionRate,
      last30Sold,
      prev30Sold,
      customerCount: customers.length,
      sparkLeads: buckets,
      newLeads: leads.filter((l) => l.status === LEAD_STATUS.NEW).length,
      contacting: leads.filter((l) => l.status === LEAD_STATUS.CONTACTING).length,
      negotiating: leads.filter((l) => l.status === LEAD_STATUS.NEGOTIATING).length,
      lostCount: leads.filter((l) => l.status === LEAD_STATUS.LOST).length,
    };
  }, [leads, customers, interactionCounts]);

  const reengagementCandidates = useMemo(() => getReengagementCandidates(leads, customers), [leads, customers]);

  const hotLeads = useMemo(() => {
    return leads
      .map((l) => ({ ...l, _scoreInfo: getLeadScore(l, { interactionCount: interactionCounts[l.id] ?? 0 }) }))
      .filter((l) => l._scoreInfo.level === 'hot' || l._scoreInfo.urgent)
      .sort(compareByScore)
      .slice(0, 5);
  }, [leads, interactionCounts]);

  const upcomingSchedule = useMemo(() => {
    const now = Date.now();
    return leads
      .filter((l) => l.next_contact_at && new Date(l.next_contact_at).getTime() >= now - 86400e3)
      .sort((a, b) => new Date(a.next_contact_at!).getTime() - new Date(b.next_contact_at!).getTime())
      .slice(0, 4);
  }, [leads]);

  const aiSuggestion = useMemo(() => {
    if (hotLeads.length === 0) return null;
    const top = hotLeads[0];
    const days = top.last_contact_at
      ? Math.floor((Date.now() - new Date(top.last_contact_at).getTime()) / 86400e3)
      : null;
    return {
      lead: top,
      text: days != null && days >= 3
        ? `${top.name} é um lead quente sem retorno há ${days} dias. Reabrir contato hoje pode aumentar a chance de fechamento.`
        : `${top.name} apresenta engajamento alto. Agende uma demonstração ou envio de proposta nas próximas 24h para acelerar o fechamento.`,
    };
  }, [hotLeads]);

  // KPI cards ------------------------------------------------------
  const conversionTrend = stats.last30Sold - stats.prev30Sold;
  const conversionPctChange = stats.prev30Sold > 0
    ? Math.round(((stats.last30Sold - stats.prev30Sold) / stats.prev30Sold) * 100)
    : (stats.last30Sold > 0 ? 100 : 0);

  const kpis = [
    {
      label: 'Total de Leads',
      value: stats.total.toString(),
      delta: `+${stats.newLast7d} em 7d`,
      trend: 'up' as const,
      sub: `${stats.customerCount} clientes ativos`,
      sparkline: stats.sparkLeads,
      tone: 'info' as const,
    },
    {
      label: 'Em andamento',
      value: stats.inProgress.toString(),
      delta: 'In-Progress',
      trend: 'flat' as const,
      sub: `${stats.negotiating} em negociação agora`,
      sparkline: [stats.newLeads, stats.contacting, stats.negotiating, stats.sold],
      tone: 'warning' as const,
    },
    {
      label: 'Conversão',
      value: `${stats.conversionRate.toFixed(1)}%`,
      delta: `${conversionPctChange >= 0 ? '+' : ''}${conversionPctChange}%`,
      trend: conversionTrend >= 0 ? ('up' as const) : ('down' as const),
      sub: `Meta: 18.0%`,
      sparkline: [stats.prev30Sold, Math.max(stats.prev30Sold - 1, 0), stats.last30Sold, stats.sold],
      tone: conversionTrend >= 0 ? ('success' as const) : ('destructive' as const),
    },
    {
      label: 'Sem resposta',
      value: stats.noResponse.toString(),
      delta: `${stats.overdue} atrasados`,
      trend: stats.noResponse > 0 ? ('down' as const) : ('up' as const),
      sub: 'Reengaje hoje',
      sparkline: [0, stats.attention, stats.overdue, stats.noResponse],
      tone: 'destructive' as const,
    },
  ];

  if (loading) return <LoadingState variant="cards" />;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header da página */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[26px] font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Visão geral da operação comercial em tempo real.</p>
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => {
            const trendIcon = k.trend === 'up' ? 'trending_up' : k.trend === 'down' ? 'trending_down' : 'trending_flat';
            const trendColor = k.trend === 'up' ? 'text-success' : k.trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
            return (
              <div key={k.label} className="bg-card rounded-2xl border border-border p-5 hover:border-border-strong transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-muted-foreground">{k.label}</p>
                  <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted', trendColor)}>
                    <MSym name={trendIcon} size={12} />
                    {k.delta}
                  </span>
                </div>
                <p className="text-[32px] font-bold text-foreground tabular-nums leading-none tracking-tight">{k.value}</p>
                <div className="mt-3 -mx-1">
                  <Sparkline values={k.sparkline} tone={k.tone} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{k.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Linha 2: Priority Leads + AI Suggestion / Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Priority Leads */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MSym name="local_fire_department" size={18} className="text-destructive" filled />
                  Priority Leads
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{hotLeads.length} leads quentes priorizados</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Filtrar">
                  <MSym name="filter_list" size={18} />
                </button>
                <button className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Mais opções">
                  <MSym name="more_horiz" size={18} />
                </button>
              </div>
            </div>

            {hotLeads.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-3">
                  <MSym name="energy_savings_leaf" size={22} className="text-muted-foreground" />
                </div>
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
                            <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1.5">
                              <MSym name="storefront" size={13} className="opacity-60" />
                              {meta}
                            </p>
                          )}
                        </div>
                        {l.phone && (
                          <div className="shrink-0 flex items-center gap-1">
                            <WhatsAppQuickAction
                              lead={l}
                              interactionCount={interactionCounts[l.id] ?? 0}
                              variant="icon"
                              size="sm"
                              onSent={fetchData}
                            />
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="px-5 py-3 border-t border-border bg-muted/30">
              <Link to="/admin/leads" className="text-[12px] font-semibold text-primary hover:opacity-80 transition-opacity inline-flex items-center gap-1">
                Ver todos os leads ({stats.total})
                <MSym name="arrow_forward" size={14} />
              </Link>
            </div>
          </div>

          {/* AI Suggestion + Distribuição */}
          <div className="space-y-4">
            {aiSuggestion && (
              <div className="bg-gradient-to-br from-primary/10 via-card to-card rounded-2xl border border-primary/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                    <MSym name="tips_and_updates" size={18} filled />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-primary">AI Suggestion</p>
                    <p className="text-[10px] text-muted-foreground">Recomendação automática</p>
                  </div>
                </div>
                <p className="text-[13px] text-foreground/90 leading-relaxed italic">"{aiSuggestion.text}"</p>
                <Link
                  to={`/admin/leads?focus=${aiSuggestion.lead.id}`}
                  className="inline-flex items-center gap-1.5 mt-4 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity"
                >
                  <MSym name="bolt" size={14} filled />
                  Agir agora
                </Link>
              </div>
            )}

            {/* Distribuição segmentada */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">Distribuição</h3>
                <Link to="/admin/pipeline" className="text-[11px] font-semibold text-primary hover:opacity-80">
                  Pipeline →
                </Link>
              </div>
              {(() => {
                const segs = [
                  { label: 'Novos', value: stats.newLeads, className: 'bg-info' },
                  { label: 'Contato', value: stats.contacting, className: 'bg-primary' },
                  { label: 'Negoc.', value: stats.negotiating, className: 'bg-warning' },
                  { label: 'Cliente', value: stats.sold, className: 'bg-success' },
                  { label: 'Perdido', value: stats.lostCount, className: 'bg-muted-foreground/40' },
                ];
                const total = segs.reduce((a, s) => a + s.value, 0) || 1;
                return (
                  <>
                    <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted mb-3">
                      {segs.map((s) => s.value > 0 && (
                        <div key={s.label} className={cn('h-full', s.className)} style={{ width: `${(s.value / total) * 100}%` }} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {segs.map((s) => (
                        <div key={s.label} className="flex items-center gap-2 text-[11px]">
                          <span className={cn('w-2 h-2 rounded-full', s.className)} />
                          <span className="text-muted-foreground">{s.label}</span>
                          <span className="ml-auto tabular-nums font-semibold text-foreground">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Linha 3: Activity Feed + Upcoming Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Activity Feed</h3>
              <button className="text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <MSym name="filter_list" size={14} /> Filtrar
              </button>
            </div>
            {interactions.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Sem atividades recentes. Registre uma interação para começar.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {interactions.map((i) => {
                  const iconMap: Record<string, string> = {
                    whatsapp: 'chat',
                    ligação: 'call',
                    ligacao: 'call',
                    email: 'mail',
                    'e-mail': 'mail',
                    reunião: 'event',
                    reuniao: 'event',
                    observação: 'sticky_note_2',
                    observacao: 'sticky_note_2',
                  };
                  const icon = iconMap[i.contact_type.toLowerCase()] ?? 'bolt';
                  return (
                    <li key={i.id} className="flex items-start gap-3 px-5 py-3.5">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <MSym name={icon} size={16} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-foreground line-clamp-2 leading-relaxed">{i.description}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(i.interaction_date), { locale: ptBR, addSuffix: true })}
                          <span className="mx-1.5">·</span>
                          <span className="capitalize">{i.contact_type}</span>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="px-5 py-3 border-t border-border bg-muted/30">
              <Link to="/admin/leads" className="text-[12px] font-semibold text-primary hover:opacity-80 inline-flex items-center gap-1">
                Ver histórico completo
                <MSym name="arrow_forward" size={14} />
              </Link>
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <MSym name="calendar_today" size={18} className="text-primary" />
                Próximos contatos
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Agenda de retornos programados</p>
            </div>
            {upcomingSchedule.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Nenhum retorno agendado.
              </div>
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
                        <ContactRecencyBadge
                          lastContactAt={l.last_contact_at}
                          status={l.status}
                          createdAt={l.created_at}
                          size="sm"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Reengajamento */}
        <ReengagementQueue candidates={reengagementCandidates} onSent={fetchData} />
      </div>
    </TooltipProvider>
  );
}
