import { supabase } from '@/integrations/supabase/client';
import {
  leadCreateSchema,
  leadUpdateSchema,
  escapePostgrestSearch,
} from '@/lib/validation/schemas';

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
      // Sanitiza para evitar PostgREST operator injection via vírgula/parêntese.
      const safe = escapePostgrestSearch(filters.search);
      if (safe.length > 0) {
        query = query.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%`);
      }
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
    const parsed = leadCreateSchema.parse(lead);
    const { data, error } = await supabase.from('leads').insert({
      name: parsed.name,
      phone: parsed.phone,
      origin: parsed.origin || undefined,
      product_interest: parsed.product_interest || undefined,
    }).select().single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string) {
    const parsed = leadUpdateSchema.pick({ status: true }).parse({ status });
    const { error } = await supabase.from('leads').update(parsed).eq('id', id);
    if (error) throw error;
  },

  async update(id: string, updates: { name?: string; phone?: string; origin?: string | null; product_interest?: string | null; status?: string; notes?: string | null; last_contact_at?: string | null; next_contact_at?: string | null }) {
    const parsed = leadUpdateSchema.parse(updates);
    const { error } = await supabase.from('leads').update(parsed).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
  },
};
