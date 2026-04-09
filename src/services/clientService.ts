import { supabase } from '@/integrations/supabase/client';

export const clientService = {
  async list() {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createFromLead(leadId: string, name: string, phone?: string) {
    const { data, error } = await supabase.from('clients').insert({ lead_id: leadId, name, phone }).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: { name?: string; phone?: string }) {
    const { error } = await supabase.from('clients').update(updates).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },
};
