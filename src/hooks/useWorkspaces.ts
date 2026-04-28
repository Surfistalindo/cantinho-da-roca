import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { workspaceService, type Workspace } from '@/services/workspaceService';
import { boardService, type Board } from '@/services/boardService';

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [ws, bs] = await Promise.all([
        workspaceService.list(),
        boardService.listAllForUser(),
      ]);
      setWorkspaces(ws);
      setBoards(bs);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel('workspaces-boards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const boardsByWorkspace = (workspace_id: string) =>
    boards
      .filter((b) => b.workspace_id === workspace_id)
      .sort((a, b) => a.position - b.position);

  const activeWorkspace = workspaces.find((w) => w.is_active) ?? workspaces[0] ?? null;

  return { workspaces, boards, boardsByWorkspace, activeWorkspace, loading, error, refresh };
}
