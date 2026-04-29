import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/app';
import PipelineColumn from './PipelineColumn';
import LeadDetailSheet from '@/components/admin/LeadDetailSheet';
import NewLeadDialog from '@/components/admin/NewLeadDialog';
import LoadingState from '@/components/admin/LoadingState';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { useInteractionCounts } from '@/hooks/useInteractionCounts';
import { getLeadScore } from '@/lib/leadScore';
import { toast } from 'sonner';
import type { PipelineFilters } from './PipelineToolbar';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  product_interest: string | null;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  next_contact_at: string | null;
  notes: string | null;
  assigned_to: string | null;
}

interface Props {
  filters?: PipelineFilters;
  onLeadsChange?: (leads: Lead[], interactionCounts: Record<string, number>) => void;
  onOriginsChange?: (origins: string[]) => void;
}

export default function PipelineBoard({ filters, onLeadsChange, onOriginsChange }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('new');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchLeads = useCallback(async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useRealtimeTable('leads', fetchLeads);

  const interactionCounts = useInteractionCounts(leads.map((l) => l.id));

  // Notify parent of full lead list (for KPIs / origins)
  useEffect(() => {
    onLeadsChange?.(leads, interactionCounts);
  }, [leads, interactionCounts, onLeadsChange]);

  useEffect(() => {
    if (!onOriginsChange) return;
    const set = new Set<string>();
    leads.forEach((l) => { if (l.origin && l.origin.trim()) set.add(l.origin.trim()); });
    onOriginsChange(Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR')));
  }, [leads, onOriginsChange]);

  // Apply filters
  const filteredLeads = useMemo(() => {
    if (!filters) return leads;
    const q = filters.q.trim().toLowerCase();
    return leads.filter((l) => {
      if (q) {
        const hay = `${l.name ?? ''} ${l.phone ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.origin !== 'all') {
        if ((l.origin ?? '').trim() !== filters.origin) return false;
      }
      if (filters.assignee?.id) {
        if (l.assigned_to !== filters.assignee.id) return false;
      }
      if (filters.priority !== 'all') {
        const s = getLeadScore(l, { interactionCount: interactionCounts[l.id] ?? 0 });
        if (filters.priority === 'urgent' && !s.urgent) return false;
        if (filters.priority === 'hot' && s.level !== 'hot') return false;
        if (filters.priority === 'warm' && s.level !== 'warm') return false;
        if (filters.priority === 'cold' && s.level !== 'cold') return false;
      }
      return true;
    });
  }, [leads, filters, interactionCounts]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;
    const isColumn = APP_CONFIG.leadStatuses.some((s) => s.value === overId);

    if (isColumn) {
      setLeads((prev) =>
        prev.map((l) => (l.id === active.id ? { ...l, status: overId } : l))
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const lead = leads.find((l) => l.id === active.id);
    if (!lead) return;

    const overId = over.id as string;
    const targetStatus = APP_CONFIG.leadStatuses.some((s) => s.value === overId)
      ? overId
      : leads.find((l) => l.id === overId)?.status;

    if (!targetStatus || lead.status === targetStatus) return;

    const { error } = await supabase.from('leads').update({ status: targetStatus }).eq('id', lead.id);
    if (error) {
      toast.error('Erro ao atualizar status');
      fetchLeads();
    } else {
      toast.success(`Lead movido para "${APP_CONFIG.leadStatuses.find((s) => s.value === targetStatus)?.label}"`);
    }
  };

  const openDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  const openNewLead = (status: string) => {
    setNewStatus(status);
    setNewOpen(true);
  };

  if (loading) return <LoadingState />;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          data-tour="pipeline-board"
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 min-w-0 max-w-full"
        >
          {APP_CONFIG.leadStatuses.map((s) => (
            <PipelineColumn
              key={s.value}
              status={s.value}
              leads={filteredLeads.filter((l) => l.status === s.value)}
              onLeadClick={openDetail}
              onAddLead={openNewLead}
              interactionCounts={interactionCounts}
            />
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="bg-card border border-primary rounded-lg p-3 shadow-xl opacity-90 w-56">
              <p className="font-medium text-sm truncate">
                {leads.find((l) => l.id === activeId)?.name}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <LeadDetailSheet lead={selectedLead} open={sheetOpen} onOpenChange={setSheetOpen} onUpdated={fetchLeads} />
      <NewLeadDialog open={newOpen} onOpenChange={setNewOpen} onCreated={fetchLeads} defaultStatus={newStatus} />
    </>
  );
}
