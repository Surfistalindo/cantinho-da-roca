import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/app';
import LeadStatusBadge from '@/components/admin/LeadStatusBadge';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  status: string;
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, name, phone, status')
      .order('created_at', { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  if (loading) return <p className="text-muted-foreground text-sm py-12 text-center">Carregando...</p>;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold font-heading">Pipeline</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {APP_CONFIG.leadStatuses.map((s) => {
          const items = leads.filter((l) => l.status === s.value);
          return (
            <div key={s.value} className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <LeadStatusBadge status={s.value} />
                <span className="text-xs text-muted-foreground font-medium">{items.length}</span>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum lead</p>
                )}
                {items.map((lead) => (
                  <div key={lead.id} className="bg-muted rounded-lg p-3 text-sm">
                    <p className="font-medium truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.phone ?? 'Sem telefone'}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
