import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  WAMessage, WAConversation, WALeadInfo, WATemplate, WAConfig, WAFilter,
} from './types';

/**
 * Hook central da WhatsApp Studio.
 * - Lista de conversas agrupadas por lead
 * - Mensagens da conversa selecionada
 * - Templates da régua
 * - Config Z-API + status conexão
 * - Realtime em whatsapp_messages
 */
export function useWhatsAppData() {
  const [messagesByLead, setMessagesByLead] = useState<Map<string, WAMessage[]>>(new Map());
  const [leadsById, setLeadsById] = useState<Map<string, WALeadInfo>>(new Map());
  const [templates, setTemplates] = useState<WATemplate[]>([]);
  const [config, setConfig] = useState<WAConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<WAFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [msgRes, leadsRes, tplRes, cfgRes] = await Promise.all([
      supabase.from('whatsapp_messages')
        .select('*').order('created_at', { ascending: true }).limit(1000),
      supabase.from('leads')
        .select('id,name,phone,status,origin,cadence_step,cadence_state,cadence_next_at,cadence_exhausted,whatsapp_opt_out,last_contact_at')
        .not('phone', 'is', null),
      supabase.from('whatsapp_templates')
        .select('*').not('step_order', 'is', null).order('step_order'),
      supabase.from('whatsapp_config')
        .select('instance_id,is_configured,updated_at').eq('provider', 'zapi').maybeSingle(),
    ]);

    const msgs = (msgRes.data ?? []) as WAMessage[];
    const grouped = new Map<string, WAMessage[]>();
    for (const m of msgs) {
      if (!m.lead_id) continue;
      if (!grouped.has(m.lead_id)) grouped.set(m.lead_id, []);
      grouped.get(m.lead_id)!.push(m);
    }
    setMessagesByLead(grouped);

    const leadMap = new Map<string, WALeadInfo>();
    for (const l of (leadsRes.data ?? []) as WALeadInfo[]) leadMap.set(l.id, l);
    setLeadsById(leadMap);

    setTemplates((tplRes.data ?? []) as WATemplate[]);
    setConfig((cfgRes.data as WAConfig) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Realtime: nova msg → append na lista correta
  useEffect(() => {
    const channel = supabase
      .channel('wa-studio')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_messages' },
        (payload) => {
          const m = payload.new as WAMessage;
          if (!m?.lead_id) return;
          setMessagesByLead((prev) => {
            const next = new Map(prev);
            const arr = [...(next.get(m.lead_id!) ?? [])];
            const idx = arr.findIndex((x) => x.id === m.id);
            if (idx >= 0) arr[idx] = m; else arr.push(m);
            next.set(m.lead_id!, arr);
            return next;
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Conversas derivadas
  const conversations = useMemo<WAConversation[]>(() => {
    const list: WAConversation[] = [];
    for (const [leadId, msgs] of messagesByLead) {
      const lead = leadsById.get(leadId);
      if (!lead) continue;
      const sorted = [...msgs].sort(
        (a, b) => +new Date(a.created_at) - +new Date(b.created_at),
      );
      const last = sorted[sorted.length - 1] ?? null;
      // não lidas: msgs 'in' depois da última 'out' do operador
      let lastOutTs = 0;
      for (const m of sorted) if (m.direction === 'out') lastOutTs = +new Date(m.created_at);
      const unread = sorted.filter(
        (m) => m.direction === 'in' && +new Date(m.created_at) > lastOutTs,
      ).length;
      list.push({ lead, lastMessage: last, unreadCount: unread });
    }
    list.sort(
      (a, b) =>
        +new Date(b.lastMessage?.created_at ?? 0) -
        +new Date(a.lastMessage?.created_at ?? 0),
    );
    return list;
  }, [messagesByLead, leadsById]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (q && !c.lead.name.toLowerCase().includes(q)
            && !(c.lead.phone ?? '').includes(q)) return false;
      switch (filter) {
        case 'unread': return c.unreadCount > 0;
        case 'in_cadence': return c.lead.cadence_state === 'active' && !c.lead.cadence_exhausted;
        case 'paused': return c.lead.whatsapp_opt_out || c.lead.cadence_state === 'paused';
        case 'no_reply': {
          const msgs = messagesByLead.get(c.lead.id) ?? [];
          const hasIn = msgs.some((m) => m.direction === 'in');
          return !hasIn && msgs.length > 0;
        }
        default: return true;
      }
    });
  }, [conversations, filter, search, messagesByLead]);

  const selectedMessages = useMemo<WAMessage[]>(
    () => (selectedLeadId ? messagesByLead.get(selectedLeadId) ?? [] : [])
      .slice().sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    [messagesByLead, selectedLeadId],
  );

  const selectedLead = selectedLeadId ? leadsById.get(selectedLeadId) ?? null : null;

  // Métricas do dia
  const todayStats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let sent = 0, replied = 0, failed = 0;
    for (const arr of messagesByLead.values()) {
      for (const m of arr) {
        if (+new Date(m.created_at) < +today) continue;
        if (m.direction === 'out' && m.status === 'sent') sent++;
        if (m.direction === 'out' && m.status === 'failed') failed++;
        if (m.direction === 'in') replied++;
      }
    }
    return { sent, replied, failed };
  }, [messagesByLead]);

  return {
    loading, conversations: filteredConversations,
    totalConversations: conversations.length,
    selectedLeadId, setSelectedLeadId, selectedLead, selectedMessages,
    templates, config, todayStats,
    filter, setFilter, search, setSearch,
    reload: loadAll,
  };
}
