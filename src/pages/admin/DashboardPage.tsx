import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserGroup, faComments, faPhoneSlash, faUserCheck,
  faArrowTrendUp, faClockRotateLeft, faBolt, faTableColumns, faTriangleExclamation,
  faChevronRight, faSeedling, faCircleCheck, faChartColumn, faFire,
} from '@fortawesome/free-solid-svg-icons';
import WhatsAppQuickAction from '@/components/admin/WhatsAppQuickAction';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import PageHeader from '@/components/admin/PageHeader';
import LoadingState from '@/components/admin/LoadingState';

import ContactRecencyBadge from '@/components/admin/ContactRecencyBadge';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import LeadScoreBadge from '@/components/admin/LeadScoreBadge';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LEAD_STATUS } from '@/lib/leadStatus';
import { getContactRecency } from '@/lib/contactRecency';
import { getLeadScore, compareByScore } from '@/lib/leadScore';
import { getReengagementCandidates } from '@/lib/reengagement';
import ReengagementQueue from '@/components/admin/ReengagementQueue';
import { useInteractionCounts } from '@/hooks/useInteractionCounts';
import { cn } from '@/lib/utils';

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

export default function DashboardPage() {
  const [leads, setLeads] = useState<LeadLite[]>([]);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const interactionCounts = useInteractionCounts(leads.map((l) => l.id));

  const fetchData = useCallback(async () => {
    const [leadsRes, customersRes] = await Promise.all([
      supabase
        .from('leads')
        .select('id, name, phone, origin, product_interest, status, created_at, last_contact_at, next_contact_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('customers')
        .select('id, name, phone, product_bought, purchase_date, last_contact_at')
        .order('created_at', { ascending: false }),
    ]);
    setLeads((leadsRes.data as LeadLite[]) ?? []);
    const cs = (customersRes.data as CustomerLite[]) ?? [];
    setCustomers(cs);
    setCustomerCount(cs.length);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeTable('leads', fetchData);
  useRealtimeTable('customers', fetchData);

  const stats = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const total = leads.length;
    const sold = leads.filter((l) => l.status === LEAD_STATUS.WON).length;
    let attention = 0; let overdue = 0; let hot = 0; let noResponse = 0;
    for (const l of leads) {
      const info = getContactRecency(l.last_contact_at, l.status, l.created_at);
      if (info.level === 'attention') attention++;
      else if (info.level === 'overdue') {
        overdue++;
        if (l.status === LEAD_STATUS.CONTACTING || l.status === LEAD_STATUS.NEGOTIATING) {
          noResponse++;
        }
      }
      const score = getLeadScore(l, { interactionCount: interactionCounts[l.id] ?? 0 });
      if (score.level === 'hot' || score.urgent) hot++;
    }
    return {
      total,
      newLeads: leads.filter((l) => l.status === LEAD_STATUS.NEW).length,
      contacting: leads.filter((l) => l.status === LEAD_STATUS.CONTACTING).length,
      negotiating: leads.filter((l) => l.status === LEAD_STATUS.NEGOTIATING).length,
      sold,
      lostCount: leads.filter((l) => l.status === LEAD_STATUS.LOST).length,
      noResponse,
      last7d: leads.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo).length,
      attention,
      overdue,
      hot,
      conversionRate: total > 0 ? Math.round((sold / total) * 100) : 0,
    };
  }, [leads, interactionCounts]);

  const reengagementCandidates = useMemo(
    () => getReengagementCandidates(leads, customers),
    [leads, customers],
  );



  const hotLeads = useMemo(() => {
    return leads
      .map((l) => ({ ...l, _scoreInfo: getLeadScore(l, { interactionCount: interactionCounts[l.id] ?? 0 }) }))
      .filter((l) => l._scoreInfo.level === 'hot' || l._scoreInfo.urgent)
      .sort(compareByScore)
      .slice(0, 5);
  }, [leads, interactionCounts]);

  const attentionLeads = useMemo(() => {
    return leads
      .map((l) => ({ lead: l, info: getContactRecency(l.last_contact_at, l.status, l.created_at) }))
      .filter((x) => x.info.level === 'attention' || x.info.level === 'overdue')
      .sort((a, b) => {
        if (a.info.level !== b.info.level) return a.info.level === 'overdue' ? -1 : 1;
        return (b.info.days ?? 9999) - (a.info.days ?? 9999);
      })
      .slice(0, 5);
  }, [leads]);

  const primaryCards: { icon: IconDefinition; label: string; value: string | number; description: string; accent: string; href?: string }[] = [
    { icon: faUserGroup, label: 'Total de Leads', value: stats.total, description: `${stats.last7d} nos últimos 7 dias`, accent: 'text-primary bg-primary/10' },
    { icon: faFire, label: 'Leads Quentes', value: stats.hot, description: 'Alta prioridade comercial', accent: 'text-destructive bg-destructive/10', href: '/admin/leads?priority=hot' },
    { icon: faArrowTrendUp, label: 'Conversão', value: `${stats.conversionRate}%`, description: `${stats.sold} fechados · ${customerCount} no cadastro`, accent: 'text-success bg-success-soft' },
    { icon: faTriangleExclamation, label: 'Atrasados', value: stats.overdue, description: '7+ dias ou nunca contatado', accent: 'text-destructive bg-destructive/10', href: '/admin/leads?recency=overdue' },
  ];

  // Distribuição: barra segmentada
  const segments = [
    { label: 'Novos', value: stats.newLeads, className: 'bg-info', icon: faUserGroup },
    { label: 'Em contato', value: stats.contacting, className: 'bg-primary', icon: faComments },
    { label: 'Negociação', value: stats.negotiating, className: 'bg-warning', icon: faChartColumn },
    { label: 'Clientes', value: stats.sold, className: 'bg-success', icon: faUserCheck },
    { label: 'Perdidos', value: stats.noResponse, className: 'bg-muted-foreground/40', icon: faPhoneSlash },
  ];
  const distTotal = segments.reduce((a, s) => a + s.value, 0) || 1;

  if (loading) return <LoadingState variant="cards" />;

  return (
    <TooltipProvider delayDuration={200}>
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Painel"
        description="Visão geral da operação comercial em tempo real."
      />

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map((c, idx) => {
          const inner = (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', c.accent)}>
                  <FontAwesomeIcon icon={c.icon} className="w-[18px] h-[18px]" />
                </div>
                {c.href && (
                  <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                )}
              </div>
              <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">{c.label}</p>
              <p className="text-[28px] font-semibold text-foreground tabular-nums leading-tight mt-1">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{c.description}</p>
            </>
          );
          const baseClass = 'group bg-card rounded-2xl border border-border p-5 shadow-soft hover:shadow-card transition-all duration-150';
          return c.href ? (
            <Link
              key={c.label}
              to={c.href}
              className={cn(baseClass, 'hover:border-border-strong hover:-translate-y-px block')}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {inner}
            </Link>
          ) : (
            <div key={c.label} className={baseClass} style={{ animationDelay: `${idx * 60}ms` }}>
              {inner}
            </div>
          );
        })}
      </div>

      {/* Distribuição segmentada */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Distribuição por status</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Visão proporcional do funil</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
            <Link to="/admin/pipeline">
              <FontAwesomeIcon icon={faTableColumns} className="w-3 h-3 mr-1.5" /> Ver pipeline
            </Link>
          </Button>
        </div>

        <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-muted">
          {segments.map((s) => (
            s.value > 0 && (
              <div
                key={s.label}
                className={cn('h-full transition-all duration-300', s.className)}
                style={{ width: `${(s.value / distTotal) * 100}%` }}
                title={`${s.label}: ${s.value}`}
              />
            )
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40">
              <span className={cn('w-2.5 h-2.5 rounded-full', s.className)} />
              <div className="min-w-0">
                <p className="text-[18px] font-semibold tabular-nums leading-none text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recentes + Atenção */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FontAwesomeIcon icon={faFire} className="w-3.5 h-3.5 text-destructive" /> Top leads quentes
            </h3>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link to="/admin/leads?priority=hot">Ver todos <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5 ml-1" /></Link>
            </Button>
          </div>
          {hotLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <FontAwesomeIcon icon={faSeedling} className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Nenhum lead quente</p>
              <p className="text-xs text-muted-foreground mt-1">Os leads mais promissores aparecerão aqui.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60 -mx-2">
              {hotLeads.map((l) => {
                const meta = [l.origin, l.product_interest].filter(Boolean).join(' · ');
                return (
                  <li key={l.id}>
                    <Link
                      to={`/admin/leads?focus=${l.id}`}
                      className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <InitialsAvatar name={l.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{l.name}</p>
                          <LeadScoreBadge lead={l} interactionCount={interactionCounts[l.id] ?? 0} size="sm" />
                        </div>
                        {meta && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{meta}</p>
                        )}
                      </div>
                      {l.phone && (
                        <div className="shrink-0">
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
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 text-warning" /> Precisam de atenção
            </h3>
            {attentionLeads.length > 0 && (
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link to="/admin/leads?recency=overdue">Ver todos <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5 ml-1" /></Link>
              </Button>
            )}
          </div>
          {attentionLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-success-soft flex items-center justify-center mb-3">
                <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5 text-success" />
              </div>
              <p className="text-sm font-medium text-foreground">Tudo em dia</p>
              <p className="text-xs text-muted-foreground mt-1">Nenhum lead precisando de retorno.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60 -mx-2">
              {attentionLeads.map(({ lead, info }) => {
                const meta = [lead.origin, lead.product_interest].filter(Boolean).join(' · ');
                return (
                  <li key={lead.id}>
                    <Link
                      to={`/admin/leads?focus=${lead.id}`}
                      className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <InitialsAvatar name={lead.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                        {meta && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{meta}</p>
                        )}
                      </div>
                      <ContactRecencyBadge
                        lastContactAt={lead.last_contact_at}
                        status={lead.status}
                        createdAt={lead.created_at}
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

      {/* Atalhos */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FontAwesomeIcon icon={faBolt} className="w-3 h-3 text-primary" /> Atalhos rápidos
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <Link to="/admin/leads">
                <FontAwesomeIcon icon={faUserGroup} className="w-3 h-3 mr-1.5" /> Leads
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <Link to="/admin/pipeline">
                <FontAwesomeIcon icon={faTableColumns} className="w-3 h-3 mr-1.5" /> Pipeline
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <Link to="/admin/clients">
                <FontAwesomeIcon icon={faUserCheck} className="w-3 h-3 mr-1.5" /> Clientes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
