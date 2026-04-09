import { supabase } from '@/integrations/supabase/client';

export type InteractionType = 'mensagem' | 'ligação' | 'observação';

export const interactionService = {
  async listByLead(leadId: string) {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(interaction: { lead_id: string; type: string; content: string; user_id: string }) {
    const { data, error } = await supabase.from('interactions').insert(interaction).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: { content?: string; type?: string }) {
    const { error } = await supabase.from('interactions').update(updates).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from('interactions').delete().eq('id', id);
    if (error) throw error;
  },
};
