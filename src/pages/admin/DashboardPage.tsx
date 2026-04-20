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
      supabase.from('leads').select('id, status, created_at, last_contact_at'),
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

  const primaryCards: { icon: IconDefinition; label: string; value: string | number; description: string; accent: string; href?: string }[] = [
    { icon: faUserGroup, label: 'Total de Leads', value: stats.total, description: `${stats.last7d} nos últimos 7 dias`, accent: 'text-primary bg-primary/10' },
    { icon: faArrowTrendUp, label: 'Conversão', value: `${stats.conversionRate}%`, description: `${stats.sold} clientes de ${stats.total}`, accent: 'text-success bg-success-soft' },
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
