import { supabase } from '@/integrations/supabase/client';

export type BoardKind = 'route' | 'task_board';

export type Board = {
  id: string;
  workspace_id: string;
  name: string;
  icon: string;
  color: string;
  position: number;
  kind: BoardKind;
  route_path: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export const boardService = {
  async listByWorkspace(workspace_id: string): Promise<Board[]> {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('workspace_id', workspace_id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Board[];
  },

  async listAllForUser(): Promise<Board[]> {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('position', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Board[];
  },

  async getById(id: string): Promise<Board | null> {
    const { data, error } = await supabase.from('boards').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return (data as Board) ?? null;
  },

  async create(input: {
    workspace_id: string;
    name: string;
    icon?: string;
    color?: string;
    kind?: BoardKind;
    route_path?: string | null;
  }) {
    const { data: userRes } = await supabase.auth.getUser();
    const created_by = userRes.user?.id;
    if (!created_by) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('boards')
      .select('position')
      .eq('workspace_id', input.workspace_id)
      .order('position', { ascending: false })
      .limit(1);
    const nextPos = (existing?.[0]?.position ?? -1) + 1;

    const { data, error } = await supabase
      .from('boards')
      .insert({
        workspace_id: input.workspace_id,
        name: input.name,
        icon: input.icon ?? 'square',
        color: input.color ?? '#0073ea',
        kind: input.kind ?? 'task_board',
        route_path: input.route_path ?? null,
        position: nextPos,
        created_by,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as Board;
  },

  async update(id: string, patch: Partial<Pick<Board, 'name' | 'icon' | 'color' | 'position' | 'route_path'>>) {
    const { data, error } = await supabase
      .from('boards')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as Board;
  },

  async remove(id: string) {
    const { error } = await supabase.from('boards').delete().eq('id', id);
    if (error) throw error;
  },

  async reorderInWorkspace(workspace_id: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, i) =>
        supabase.from('boards').update({ position: i }).eq('id', id).eq('workspace_id', workspace_id),
      ),
    );
  },

  // Favorites
  async listFavorites(): Promise<{ board_id: string; position: number }[]> {
    const { data, error } = await supabase
      .from('board_favorites')
      .select('board_id, position')
      .order('position', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async addFavorite(board_id: string) {
    const { data: userRes } = await supabase.auth.getUser();
    const user_id = userRes.user?.id;
    if (!user_id) throw new Error('Not authenticated');
    const { data: existing } = await supabase
      .from('board_favorites')
      .select('position')
      .eq('user_id', user_id)
      .order('position', { ascending: false })
      .limit(1);
    const nextPos = (existing?.[0]?.position ?? -1) + 1;
    const { error } = await supabase
      .from('board_favorites')
      .insert({ user_id, board_id, position: nextPos });
    if (error) throw error;
  },

  async removeFavorite(board_id: string) {
    const { data: userRes } = await supabase.auth.getUser();
    const user_id = userRes.user?.id;
    if (!user_id) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('board_favorites')
      .delete()
      .eq('user_id', user_id)
      .eq('board_id', board_id);
    if (error) throw error;
  },
};
