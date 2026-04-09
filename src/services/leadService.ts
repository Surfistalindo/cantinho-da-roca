import { supabase } from '@/integrations/supabase/client';

export interface LeadFilters {
  status?: string;
  origin?: string;
  search?: string;
}

export const leadService = {
  async list(filters?: LeadFilters) {
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.origin) query = query.eq('origin', filters.origin);
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async create(lead: { name: string; phone: string; origin?: string; product_interest?: string }) {
    const { data, error } = await supabase.from('leads').insert(lead).select().single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string) {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);
    if (error) throw error;
  },

  async update(id: string, updates: { name?: string; phone?: string; origin?: string; product_interest?: string; status?: string; notes?: string; last_contact_at?: string; next_contact_at?: string }) {
    const { error } = await supabase.from('leads').update(updates).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
  },
};
