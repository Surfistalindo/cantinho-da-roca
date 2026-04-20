import { useCallback, useEffect, useState } from 'react';
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
import LoadingState from '@/components/admin/LoadingState';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { toast } from 'sonner';

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
}

export default function PipelineBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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

    // Optimistic update already applied in handleDragOver
    const { error } = await supabase.from('leads').update({ status: targetStatus }).eq('id', lead.id);
    if (error) {
      toast.error('Erro ao atualizar status');
      fetchLeads(); // rollback
    } else {
      toast.success(`Lead movido para "${APP_CONFIG.leadStatuses.find((s) => s.value === targetStatus)?.label}"`);
    }
  };

  const openDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {APP_CONFIG.leadStatuses.map((s) => (
            <PipelineColumn
              key={s.value}
              status={s.value}
              leads={leads.filter((l) => l.status === s.value)}
              onLeadClick={openDetail}
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
    </>
  );
}
