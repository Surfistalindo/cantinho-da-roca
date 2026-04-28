import { supabase } from '@/integrations/supabase/client';

export type Workspace = {
  id: string;
  owner_id: string;
  name: string;
  icon: string;
  color: string;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const workspaceService = {
  async list(): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Workspace[];
  },

  async create(input: { name: string; icon?: string; color?: string }) {
    const { data: userRes } = await supabase.auth.getUser();
    const owner_id = userRes.user?.id;
    if (!owner_id) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('workspaces')
      .select('position')
      .eq('owner_id', owner_id)
      .order('position', { ascending: false })
      .limit(1);
    const nextPos = (existing?.[0]?.position ?? -1) + 1;

    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        owner_id,
        name: input.name,
        icon: input.icon ?? 'folder',
        color: input.color ?? '#5a7048',
        position: nextPos,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as Workspace;
  },

  async update(id: string, patch: Partial<Pick<Workspace, 'name' | 'icon' | 'color' | 'position' | 'is_active'>>) {
    const { data, error } = await supabase
      .from('workspaces')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as Workspace;
  },

  async remove(id: string) {
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (error) throw error;
  },

  async setActive(id: string) {
    const { data: userRes } = await supabase.auth.getUser();
    const owner_id = userRes.user?.id;
    if (!owner_id) throw new Error('Not authenticated');
    await supabase.from('workspaces').update({ is_active: false }).eq('owner_id', owner_id);
    const { error } = await supabase.from('workspaces').update({ is_active: true }).eq('id', id);
    if (error) throw error;
  },

  async reorder(orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, i) =>
        supabase.from('workspaces').update({ position: i }).eq('id', id),
      ),
    );
  },
};
