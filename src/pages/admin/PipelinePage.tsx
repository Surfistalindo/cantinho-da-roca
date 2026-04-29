import { useCallback, useState } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import PipelineBoard from '@/components/pipeline/PipelineBoard';
import PipelineKpis from '@/components/pipeline/PipelineKpis';
import PipelineToolbar, { EMPTY_PIPELINE_FILTERS, type PipelineFilters } from '@/components/pipeline/PipelineToolbar';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  next_contact_at: string | null;
  assigned_to: string | null;
}

export default function PipelinePage() {
  const [filters, setFilters] = useState<PipelineFilters>(EMPTY_PIPELINE_FILTERS);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [interactionCounts, setInteractionCounts] = useState<Record<string, number>>({});
  const [origins, setOrigins] = useState<string[]>([]);

  const handleLeads = useCallback((l: Lead[], c: Record<string, number>) => {
    setLeads(l);
    setInteractionCounts(c);
  }, []);

  return (
    <div className="space-y-3 font-crm">
      <PageHeader
        title="Pipeline"
        description="Funil de vendas em Kanban — arraste cards para mudar de etapa."
      />

      <PipelineKpis leads={leads} interactionCounts={interactionCounts} />

      <PipelineToolbar
        filters={filters}
        onChange={setFilters}
        origins={origins}
      />

      <PipelineBoard
        filters={filters}
        onLeadsChange={handleLeads}
        onOriginsChange={setOrigins}
      />
    </div>
  );
}
