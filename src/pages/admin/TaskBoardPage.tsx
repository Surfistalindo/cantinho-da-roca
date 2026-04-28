import { useEffect, useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { boardService, type Board } from '@/services/boardService';
import {
  taskBoardService,
  type TaskBoardItem,
  type TaskStatus,
} from '@/services/taskBoardService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'A fazer', color: 'hsl(var(--muted-foreground))' },
  { value: 'doing', label: 'Em andamento', color: 'hsl(var(--clay))' },
  { value: 'done', label: 'Concluído', color: 'hsl(var(--moss))' },
  { value: 'blocked', label: 'Bloqueado', color: 'hsl(var(--destructive))' },
];

const STATUS_ORDER: TaskStatus[] = ['todo', 'doing', 'done', 'blocked'];

export default function TaskBoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<TaskBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newTitleByStatus, setNewTitleByStatus] = useState<Record<TaskStatus, string>>({
    todo: '',
    doing: '',
    done: '',
    blocked: '',
  });

  const refresh = async () => {
    if (!boardId) return;
    try {
      const [b, list] = await Promise.all([
        boardService.getById(boardId),
        taskBoardService.listByBoard(boardId),
      ]);
      if (!b) {
        setNotFound(true);
        return;
      }
      setBoard(b);
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    if (!boardId) return;
    const channel = supabase
      .channel(`task-board-${boardId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_board_items', filter: `board_id=eq.${boardId}` },
        refresh,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, TaskBoardItem[]> = { todo: [], doing: [], done: [], blocked: [] };
    items.forEach((it) => map[it.status].push(it));
    return map;
  }, [items]);

  if (notFound) return <Navigate to="/admin/dashboard" replace />;

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground p-6">Carregando board...</div>
    );
  }

  if (!board) return null;

  if (board.kind === 'route' && board.route_path) {
    return <Navigate to={board.route_path} replace />;
  }

  const handleAdd = async (status: TaskStatus) => {
    const title = newTitleByStatus[status].trim();
    if (!title || !boardId) return;
    try {
      await taskBoardService.create({ board_id: boardId, title, status });
      setNewTitleByStatus((s) => ({ ...s, [status]: '' }));
    } catch {
      toast.error('Erro ao criar tarefa');
    }
  };

  const move = async (item: TaskBoardItem, dir: -1 | 1) => {
    const idx = STATUS_ORDER.indexOf(item.status);
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= STATUS_ORDER.length) return;
    await taskBoardService.update(item.id, { status: STATUS_ORDER[nextIdx] });
  };

  const remove = async (item: TaskBoardItem) => {
    if (!window.confirm(`Excluir "${item.title}"?`)) return;
    await taskBoardService.remove(item.id);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: board.color }}
          />
          <h1 className="text-xl font-semibold text-foreground">{board.name}</h1>
        </div>
        <p className="text-xs text-muted-foreground">{items.length} tarefas</p>
      </header>

      {items.length === 0 && (
        <EmptyState
          title="Sem tarefas ainda"
          description="Adicione a primeira tarefa em qualquer coluna abaixo."
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 min-w-0 max-w-full">
        {STATUSES.map((col) => (
          <section
            key={col.value}
            className="rounded-lg border border-border bg-card flex flex-col min-h-[280px] min-w-0"
          >
            <header className="flex items-center justify-between px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: col.color }}
                />
                <h2 className="text-[12.5px] font-semibold text-foreground">{col.label}</h2>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {grouped[col.value].length}
              </span>
            </header>

            <ul className="flex-1 px-2 py-2 space-y-1.5 overflow-auto">
              {grouped[col.value].map((it) => {
                const idx = STATUS_ORDER.indexOf(it.status);
                return (
                  <li
                    key={it.id}
                    className="group rounded-md border border-border bg-background p-2.5 hover:border-primary/40 transition-colors"
                  >
                    <p className="text-[12.5px] text-foreground leading-snug">{it.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => move(it, -1)}
                          disabled={idx === 0}
                          className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
                          aria-label="Mover para esquerda"
                        >
                          <ArrowLeft size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(it, 1)}
                          disabled={idx === STATUS_ORDER.length - 1}
                          className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
                          aria-label="Mover para direita"
                        >
                          <ArrowRight size={12} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(it)}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        aria-label="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="p-2 border-t border-border">
              <div className="flex gap-1.5">
                <Input
                  value={newTitleByStatus[col.value]}
                  onChange={(e) =>
                    setNewTitleByStatus((s) => ({ ...s, [col.value]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd(col.value);
                  }}
                  placeholder="Nova tarefa..."
                  className="h-8 text-[12px]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={() => handleAdd(col.value)}
                  aria-label="Adicionar"
                >
                  <Plus size={13} />
                </Button>
              </div>
            </footer>
          </section>
        ))}
      </div>
    </div>
  );
}
