import { createContext, useContext, useState, useCallback, type ReactNode, type CSSProperties } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  pointerWithin,
} from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/app';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Drag-and-drop dos leads na visão de tabela:
 * arrastar uma linha para o cabeçalho de outro grupo de status
 * atualiza o status no banco (com Desfazer).
 */

interface DndCtx {
  activeId: string | null;
  activeName: string | null;
}
const Ctx = createContext<DndCtx>({ activeId: null, activeName: null });

interface ProviderProps {
  children: ReactNode;
  onChanged: () => void;
  /** Lookup: id → { name, status } usado para validar o move e mostrar overlay */
  leadIndex: Record<string, { name: string; status: string }>;
}

export function LeadsDndProvider({ children, onChanged, leadIndex }: ProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    // distance: 6 → não dispara no clique pra abrir o sheet
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;
    const targetStatus = overId.startsWith('group:') ? overId.slice(6) : null;
    if (!targetStatus) return;

    const lead = leadIndex[leadId];
    if (!lead || lead.status === targetStatus) return;

    const previous = lead.status;
    const { error } = await supabase
      .from('leads')
      .update({ status: targetStatus })
      .eq('id', leadId);

    if (error) {
      toast.error('Erro ao mover lead');
      return;
    }

    const label = APP_CONFIG.leadStatuses.find((s) => s.value === targetStatus)?.label ?? targetStatus;
    toast.success(`"${lead.name}" movido para ${label}`, {
      action: {
        label: 'Desfazer',
        onClick: async () => {
          await supabase.from('leads').update({ status: previous }).eq('id', leadId);
          onChanged();
        },
      },
    });
    onChanged();
  }, [leadIndex, onChanged]);

  const active = activeId ? leadIndex[activeId] : null;

  return (
    <Ctx.Provider value={{ activeId, activeName: active?.name ?? null }}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {active ? (
            <div className="rounded-md border border-primary/40 bg-card px-3 py-1.5 shadow-floating text-sm font-medium ring-2 ring-primary/30 max-w-[260px] truncate">
              {active.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Ctx.Provider>
  );
}

/** Wrapper para o cabeçalho de cada grupo: vira drop target. */
export function DroppableGroupHeader({
  status,
  children,
}: {
  status: string;
  children: ReactNode;
}) {
  const { isOver } = useDroppable({ id: `group:${status}` });
  const { activeId } = useContext(Ctx);
  const showHint = activeId !== null;
  return (
    <div
      className={cn(
        'relative rounded-md transition-all',
        showHint && 'ring-1 ring-dashed ring-border',
        isOver && '!ring-2 !ring-primary bg-primary/[0.06]',
      )}
    >
      {children}
    </div>
  );
}

/** Tornar uma linha draggable. Renderiza um <tr> via render prop. */
export function DraggableRow({
  id,
  children,
}: {
  id: string;
  children: (args: {
    setNodeRef: (el: HTMLElement | null) => void;
    listeners: Record<string, any> | undefined;
    attributes: Record<string, any>;
    isDragging: boolean;
    grip: ReactNode;
    style: CSSProperties;
  }) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({ id });
  const style: CSSProperties = {
    opacity: isDragging ? 0.4 : 1,
    // Não aplico transform na <tr> (quebra layout de tabela) — uso DragOverlay.
  };
  // Pequeno handle (grip) para o usuário saber que dá pra arrastar.
  // O resto da linha NÃO escuta listeners — assim clique abre o sheet normalmente.
  const grip = (
    <button
      type="button"
      ref={(el) => {
        // só liga ref aqui (no handle)
      }}
      {...listeners}
      {...attributes}
      onClick={(e) => e.stopPropagation()}
      aria-label="Arrastar para mudar de status"
      className="crm-row-grip h-5 w-3.5 -mx-1 inline-flex items-center justify-center text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
    >
      <GripVertical className="h-3.5 w-3.5" />
    </button>
  );
  // Encaminhamos setNodeRef para a <tr>; transform é ignorado mas precisamos
  // do ref para o dnd-kit medir colisão.
  return <>{children({ setNodeRef, listeners: undefined, attributes: {}, isDragging, grip, style })}</>;
}
