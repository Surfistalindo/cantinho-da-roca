import { supabase } from '@/integrations/supabase/client';

export type TaskStatus = 'todo' | 'doing' | 'done' | 'blocked';

export type TaskBoardItem = {
  id: string;
  board_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  due_date: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export const taskBoardService = {
  async listByBoard(board_id: string): Promise<TaskBoardItem[]> {
    const { data, error } = await supabase
      .from('task_board_items')
      .select('*')
      .eq('board_id', board_id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as TaskBoardItem[];
  },

  async listMine(): Promise<TaskBoardItem[]> {
    const { data: userRes } = await supabase.auth.getUser();
    const me = userRes.user?.id;
    if (!me) return [];
    const { data, error } = await supabase
      .from('task_board_items')
      .select('*')
      .eq('assignee_id', me)
      .order('due_date', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as TaskBoardItem[];
  },

  async create(input: {
    board_id: string;
    title: string;
    status?: TaskStatus;
    assignee_id?: string | null;
    due_date?: string | null;
    description?: string | null;
  }) {
    const { data: userRes } = await supabase.auth.getUser();
    const created_by = userRes.user?.id;
    if (!created_by) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('task_board_items')
      .select('position')
      .eq('board_id', input.board_id)
      .order('position', { ascending: false })
      .limit(1);
    const nextPos = (existing?.[0]?.position ?? -1) + 1;

    const { data, error } = await supabase
      .from('task_board_items')
      .insert({
        board_id: input.board_id,
        title: input.title,
        status: input.status ?? 'todo',
        assignee_id: input.assignee_id ?? null,
        due_date: input.due_date ?? null,
        description: input.description ?? null,
        position: nextPos,
        created_by,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as TaskBoardItem;
  },

  async update(id: string, patch: Partial<Pick<TaskBoardItem, 'title' | 'description' | 'status' | 'assignee_id' | 'due_date' | 'position'>>) {
    const { data, error } = await supabase
      .from('task_board_items')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as TaskBoardItem;
  },

  async remove(id: string) {
    const { error } = await supabase.from('task_board_items').delete().eq('id', id);
    if (error) throw error;
  },

  async reorderInBoard(board_id: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, i) =>
        supabase.from('task_board_items').update({ position: i }).eq('id', id).eq('board_id', board_id),
      ),
    );
  },
};
