import { useCallback, useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/app';
import PipelineColumn from '@/components/pipeline/PipelineColumn';
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

interface Props {
  leads: Lead[];
  interactionCounts: Record<string, number>;
  onLeadClick: (lead: Lead) => void;
  onAddLead: (status: string) => void;
  onChanged: () => void;
}

export default function LeadsKanban({ leads, interactionCounts, onLeadClick, onAddLead, onChanged }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<Lead[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const view = optimistic ?? leads;

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const overId = over.id as string;
    const isColumn = APP_CONFIG.leadStatuses.some((s) => s.value === overId);
    if (isColumn) {
      setOptimistic((prev) =>
        (prev ?? leads).map((l) => (l.id === active.id ? { ...l, status: overId } : l)),
      );
    }
  };

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) { setOptimistic(null); return; }

    const lead = leads.find((l) => l.id === active.id);
    if (!lead) { setOptimistic(null); return; }

    const overId = over.id as string;
    const targetStatus = APP_CONFIG.leadStatuses.some((s) => s.value === overId)
      ? overId
      : leads.find((l) => l.id === overId)?.status;

    if (!targetStatus || lead.status === targetStatus) {
      setOptimistic(null);
      return;
    }

    const previous = lead.status;
    const { error } = await supabase.from('leads').update({ status: targetStatus }).eq('id', lead.id);
    if (error) {
      toast.error('Erro ao mover lead');
      setOptimistic(null);
      return;
    }

    const label = APP_CONFIG.leadStatuses.find((s) => s.value === targetStatus)?.label;
    toast.success(`Movido para "${label}"`, {
      action: {
        label: 'Desfazer',
        onClick: async () => {
          await supabase.from('leads').update({ status: previous }).eq('id', lead.id);
          onChanged();
        },
      },
    });
    setOptimistic(null);
    onChanged();
  }, [leads, onChanged]);

  const active = activeId ? view.find((l) => l.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {APP_CONFIG.leadStatuses.map((s) => (
          <PipelineColumn
            key={s.value}
            status={s.value}
            leads={view.filter((l) => l.status === s.value)}
            onLeadClick={onLeadClick}
            onAddLead={onAddLead}
            interactionCounts={interactionCounts}
          />
        ))}
      </div>
      <DragOverlay>
        {active ? (
          <div className="bg-card border border-primary rounded-lg p-3 shadow-pop opacity-95 w-56">
            <p className="font-medium text-sm truncate">{active.name}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{active.phone ?? '—'}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
