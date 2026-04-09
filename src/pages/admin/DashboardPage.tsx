import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, BarChart3, MessageSquare, PhoneOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Lead {
  id: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, status, created_at')
      .order('created_at', { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const stats = useMemo(() => ({
    total: leads.length,
    negotiating: leads.filter((l) => l.status === 'negotiating').length,
    sold: leads.filter((l) => l.status === 'sold').length,
    noResponse: leads.filter((l) => l.status === 'no_response').length,
  }), [leads]);

  const cards = [
    { icon: Users, label: 'Total de Leads', value: stats.total, description: 'Leads capturados', accent: 'text-primary bg-primary/10' },
    { icon: BarChart3, label: 'Negociando', value: stats.negotiating, description: 'Em negociação ativa', accent: 'text-yellow-700 bg-yellow-100' },
    { icon: MessageSquare, label: 'Vendidos', value: stats.sold, description: 'Convertidos em vendas', accent: 'text-green-700 bg-green-100' },
    { icon: PhoneOff, label: 'Sem Resposta', value: stats.noResponse, description: 'Aguardando contato', accent: 'text-muted-foreground bg-muted' },
  ];

  if (loading) {
    return <p className="text-muted-foreground text-sm py-12 text-center">Carregando...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold font-heading">Painel</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.accent}`}>
                <c.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-3xl font-bold font-heading">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h3 className="font-semibold mb-2">Resumo</h3>
        <p className="text-sm text-muted-foreground">
          Você tem <strong>{stats.total}</strong> leads no sistema.
          {stats.negotiating > 0 && ` ${stats.negotiating} em negociação.`}
          {stats.sold > 0 && ` ${stats.sold} convertidos.`}
        </p>
      </div>
    </div>
  );
}
