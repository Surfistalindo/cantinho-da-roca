import { supabase } from '@/integrations/supabase/client';
import { customerCreateSchema, customerUpdateSchema } from '@/lib/validation/schemas';

export const clientService = {
  async list() {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async create(customer: { name: string; phone?: string; product_bought?: string; purchase_date?: string; notes?: string }) {
    const parsed = customerCreateSchema.parse(customer);
    const { data, error } = await supabase.from('customers').insert(parsed).select().single();
    if (error) throw error;
    return data;
  },

  async createFromLead(lead: { id?: string; name: string; phone?: string | null; product_interest?: string | null }) {
    const parsed = customerCreateSchema.parse({
      name: lead.name,
      phone: lead.phone ?? undefined,
      product_bought: lead.product_interest ?? undefined,
      purchase_date: new Date().toISOString().split('T')[0],
    });
    const { data, error } = await supabase.from('customers').insert(parsed).select().single();
    if (error) throw error;

    if (lead.id && data?.id) {
      await supabase
        .from('interactions')
        .update({ customer_id: data.id })
        .eq('lead_id', lead.id);
    }

    return data;
  },

  async update(id: string, updates: { name?: string; phone?: string; product_bought?: string; purchase_date?: string; last_contact_at?: string; notes?: string }) {
    const parsed = customerUpdateSchema.parse(updates);
    const { error } = await supabase.from('customers').update(parsed).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  },
};
