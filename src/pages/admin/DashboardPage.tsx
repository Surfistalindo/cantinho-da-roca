import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserGroup, faChartColumn, faComments, faPhoneSlash, faUserCheck,
  faArrowTrendUp, faClockRotateLeft, faBolt, faTableColumns, faTriangleExclamation,
  faChevronRight, faSeedling, faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import PageHeader from '@/components/admin/PageHeader';
import LoadingState from '@/components/admin/LoadingState';
import LeadStatusBadge from '@/components/admin/LeadStatusBadge';
import ContactRecencyBadge from '@/components/admin/ContactRecencyBadge';
import { Button } from '@/components/ui/button';
import { LEAD_STATUS } from '@/lib/leadStatus';
import { getContactRecency } from '@/lib/contactRecency';

interface LeadLite {
  id: string;
  name: string;
  origin: string | null;
  product_interest: string | null;
  status: string;
  created_at: string;
  last_contact_at: string | null;
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<LeadLite[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [leadsRes, customersRes] = await Promise.all([
      supabase
        .from('leads')
        .select('id, name, origin, product_interest, status, created_at, last_contact_at')
        .order('created_at', { ascending: false }),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
    ]);
    setLeads((leadsRes.data as LeadLite[]) ?? []);
    setCustomerCount(customersRes.count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeTable('leads', fetchData);
  useRealtimeTable('customers', fetchData);

  const stats = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const total = leads.length;
    const sold = leads.filter((l) => l.status === LEAD_STATUS.WON).length;

    let attention = 0;
    let overdue = 0;
    for (const l of leads) {
      const info = getContactRecency(l.last_contact_at, l.status, l.created_at);
      if (info.level === 'attention') attention++;
      else if (info.level === 'overdue') overdue++;
    }

    return {
      total,
      newLeads: leads.filter((l) => l.status === LEAD_STATUS.NEW).length,
      contacting: leads.filter((l) => l.status === LEAD_STATUS.CONTACTING).length,
      negotiating: leads.filter((l) => l.status === LEAD_STATUS.NEGOTIATING).length,
      sold,
      noResponse: leads.filter((l) => l.status === LEAD_STATUS.LOST).length,
      last7d: leads.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo).length,
      attention,
      overdue,
      conversionRate: total > 0 ? Math.round((sold / total) * 100) : 0,
    };
  }, [leads]);

  const recentLeads = useMemo(() => leads.slice(0, 5), [leads]);

  const attentionLeads = useMemo(() => {
    return leads
      .map((l) => ({ lead: l, info: getContactRecency(l.last_contact_at, l.status, l.created_at) }))
      .filter((x) => x.info.level === 'attention' || x.info.level === 'overdue')
      .sort((a, b) => {
        if (a.info.level !== b.info.level) return a.info.level === 'overdue' ? -1 : 1;
        const da = a.info.days ?? 9999;
        const db = b.info.days ?? 9999;
        return db - da;
      })
      .slice(0, 5);
  }, [leads]);

  const primaryCards: { icon: IconDefinition; label: string; value: string | number; description: string; accent: string; href?: string }[] = [
    { icon: faUserGroup, label: 'Total de Leads', value: stats.total, description: `${stats.last7d} nos últimos 7 dias`, accent: 'text-primary bg-primary/10' },
    { icon: faArrowTrendUp, label: 'Conversão', value: `${stats.conversionRate}%`, description: `${stats.sold} fechados · ${customerCount} no cadastro`, accent: 'text-success bg-success-soft' },
    { icon: faClockRotateLeft, label: 'Atenção', value: stats.attention, description: '3–6 dias sem contato', accent: 'text-warning bg-warning-soft', href: '/admin/leads?recency=attention' },
    { icon: faTriangleExclamation, label: 'Atrasados', value: stats.overdue, description: '7+ dias ou nunca contatado', accent: 'text-destructive bg-destructive/10', href: '/admin/leads?recency=overdue' },
  ];

  const statusCards: { icon: IconDefinition; label: string; value: number; accent: string }[] = [
    { icon: faUserGroup, label: 'Novos', value: stats.newLeads, accent: 'text-info bg-info-soft' },
    { icon: faComments, label: 'Em contato', value: stats.contacting, accent: 'text-primary bg-primary/10' },
    { icon: faChartColumn, label: 'Negociação', value: stats.negotiating, accent: 'text-warning bg-warning-soft' },
    { icon: faUserCheck, label: 'Clientes', value: stats.sold, accent: 'text-success bg-success-soft' },
    { icon: faPhoneSlash, label: 'Perdidos', value: stats.noResponse, accent: 'text-muted-foreground bg-muted' },
  ];

  if (loading) return <LoadingState />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Painel"
        description="Visão geral da operação comercial em tempo real."
      />

      {/* KPIs principais */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map((c) => {
          const inner = (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.accent}`}>
                  <FontAwesomeIcon icon={c.icon} className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
            </>
          );
          return c.href ? (
            <Link
              key={c.label}
              to={c.href}
              className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all block"
            >
              {inner}
            </Link>
          ) : (
            <div key={c.label} className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              {inner}
            </div>
          );
        })}
      </div>

      {/* Distribuição por status */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Distribuição por status</h3>
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
            <Link to="/admin/pipeline"><FontAwesomeIcon icon={faTableColumns} className="w-3 h-3 mr-1.5" /> Ver pipeline</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statusCards.map((c) => (
            <div key={c.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.accent}`}>
                <FontAwesomeIcon icon={c.icon} className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-foreground leading-none">{c.value}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leads recentes + Precisam de atenção */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leads recentes */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
              <FontAwesomeIcon icon={faSeedling} className="w-3.5 h-3.5 text-primary" /> Leads recentes
            </h3>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link to="/admin/leads">Ver todos <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5 ml-1" /></Link>
            </Button>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum lead ainda. Compartilhe sua landing page!
            </p>
          ) : (
            <ul className="space-y-1">
              {recentLeads.map((l) => {
                const meta = [l.origin, l.product_interest].filter(Boolean).join(' · ');
                return (
                  <li key={l.id}>
                    <Link
                      to={`/admin/leads?focus=${l.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{l.name}</p>
                          <LeadStatusBadge status={l.status} />
                        </div>
                        {meta && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{meta}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(l.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                      <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3 text-muted-foreground/50" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Precisam de atenção */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 text-warning" /> Precisam de atenção
            </h3>
            {attentionLeads.length > 0 && (
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link to="/admin/leads?recency=overdue">Ver todos <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5 ml-1" /></Link>
              </Button>
            )}
          </div>
          {attentionLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <FontAwesomeIcon icon={faCircleCheck} className="w-6 h-6 text-success mb-2" />
              <p className="text-sm text-muted-foreground">Tudo em dia</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Nenhum lead precisando de retorno.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {attentionLeads.map(({ lead, info }) => {
                const meta = [lead.origin, lead.product_interest].filter(Boolean).join(' · ');
                return (
                  <li key={lead.id}>
                    <Link
                      to={`/admin/leads?focus=${lead.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors"
                    >
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

      {/* Atalhos rápidos */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <FontAwesomeIcon icon={faBolt} className="w-3.5 h-3.5 text-primary" /> Atalhos rápidos
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/leads">
              <FontAwesomeIcon icon={faUserGroup} className="w-3.5 h-3.5 mr-1.5" /> Ver leads
            </Link>
          </Button>
          {stats.attention > 0 && (
            <Button asChild size="sm" variant="outline" className="text-warning border-warning/30 hover:bg-warning-soft hover:text-warning">
              <Link to="/admin/leads?recency=attention">
                <FontAwesomeIcon icon={faClockRotateLeft} className="w-3.5 h-3.5 mr-1.5" /> {stats.attention} em atenção
              </Link>
            </Button>
          )}
          {stats.overdue > 0 && (
            <Button asChild size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
              <Link to="/admin/leads?recency=overdue">
                <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 mr-1.5" /> {stats.overdue} atrasado{stats.overdue > 1 ? 's' : ''}
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/pipeline">
              <FontAwesomeIcon icon={faTableColumns} className="w-3.5 h-3.5 mr-1.5" /> Pipeline kanban
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/clients">
              <FontAwesomeIcon icon={faUserCheck} className="w-3.5 h-3.5 mr-1.5" /> Clientes
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
