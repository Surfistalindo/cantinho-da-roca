import { useEffect, useState } from 'react';
import { taskBoardService, type TaskBoardItem } from '@/services/taskBoardService';
import { boardService, type Board } from '@/services/boardService';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function MyWorkPage() {
  const [items, setItems] = useState<TaskBoardItem[]>([]);
  const [boards, setBoards] = useState<Record<string, Board>>({});
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const list = await taskBoardService.listMine();
      setItems(list);
      const ids = Array.from(new Set(list.map((i) => i.board_id)));
      const fetched = await Promise.all(ids.map((id) => boardService.getById(id)));
      const map: Record<string, Board> = {};
      fetched.forEach((b) => {
        if (b) map[b.id] = b;
      });
      setBoards(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel('my-work')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_board_items' },
        refresh,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="text-sm text-muted-foreground p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-foreground">Meu trabalho</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Tudo que está atribuído a você nos boards de tarefas.
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="Tudo limpo por aqui"
          description="Você não tem tarefas atribuídas. Quando alguém te designar, aparece aqui."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((it) => {
            const board = boards[it.board_id];
            return (
              <li
                key={it.id}
                className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2.5 hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-foreground truncate">{it.title}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {board && (
                      <Link
                        to={`/admin/boards/${board.id}`}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: board.color }}
                        />
                        {board.name}
                      </Link>
                    )}
                    {it.due_date && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={11} />
                        {new Date(it.due_date).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <span className="ml-3 inline-flex items-center px-2 h-5 rounded-full bg-muted text-[10px] uppercase tracking-wider text-muted-foreground">
                  {it.status}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
