import { supabase } from '@/integrations/supabase/client';
import { interactionCreateSchema, interactionUpdateSchema } from '@/lib/validation/schemas';

export type InteractionType = 'mensagem' | 'ligação' | 'observação';

export const interactionService = {
  async listByLead(leadId: string) {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('lead_id', leadId)
      .order('interaction_date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async listByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('interaction_date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(interaction: { lead_id?: string; customer_id?: string; contact_type: string; description: string; created_by: string; interaction_date?: string }) {
    const parsed = interactionCreateSchema.parse(interaction);
    const payload = { ...parsed, description: parsed.description.replace(/<[^>]*>/g, '').trim() };
    const { data, error } = await supabase.from('interactions').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: { description?: string; contact_type?: string }) {
    const parsed = interactionUpdateSchema.parse(updates);
    const { error } = await supabase.from('interactions').update(parsed).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from('interactions').delete().eq('id', id);
    if (error) throw error;
  },
};
