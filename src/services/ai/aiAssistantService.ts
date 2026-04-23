/**
 * Cliente do Assistente IA — streaming SSE com:
 * - parser linha-a-linha robusto (CRLF, comentários, partial JSON, [DONE])
 * - captura de evento custom { __trace: [...] } prepended pelo backend
 * - AbortController para cancelamento
 */
import { supabase } from '@/integrations/supabase/client';

export interface ChatMsg {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolTraceEntry {
  name: string;
  args: Record<string, unknown>;
}

export interface StreamHandlers {
  onTrace?: (trace: ToolTraceEntry[]) => void;
  onDelta: (chunk: string) => void;
  onDone: () => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ia-assistant-chat`;

export async function streamAssistant(messages: ChatMsg[], handlers: StreamHandlers): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error('Sessão expirada — faça login novamente.');

  let resp: Response;
  try {
    resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages }),
      signal: handlers.signal,
    });
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') return;
    throw e;
  }

  if (!resp.ok) {
    if (resp.status === 429) throw new Error('Limite de requisições da IA atingido. Aguarde alguns segundos e tente novamente.');
    if (resp.status === 402) throw new Error('Créditos da IA esgotados. Adicione créditos no workspace do Lovable.');
    let detail = '';
    try { detail = (await resp.json())?.error ?? ''; } catch { /* ignore */ }
    throw new Error(`Erro do assistente${detail ? `: ${detail}` : ''}`);
  }
  if (!resp.body) throw new Error('Sem corpo de resposta.');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;

  try {
    while (!done) {
      const { done: rDone, value } = await reader.read();
      if (rDone) break;
      buffer += decoder.decode(value, { stream: true });

      let nlIdx: number;
      while ((nlIdx = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, nlIdx);
        buffer = buffer.slice(nlIdx + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line || line.startsWith(':')) continue;
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') { done = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed?.__trace && Array.isArray(parsed.__trace)) {
            handlers.onTrace?.(parsed.__trace as ToolTraceEntry[]);
            continue;
          }
          const content = parsed?.choices?.[0]?.delta?.content as string | undefined;
          if (content) handlers.onDelta(content);
        } catch {
          // partial JSON — devolve para o buffer
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    // flush
    if (buffer.trim()) {
      for (let raw of buffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed?.choices?.[0]?.delta?.content as string | undefined;
          if (content) handlers.onDelta(content);
        } catch { /* ignore */ }
      }
    }

    handlers.onDone();
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') return;
    handlers.onError?.(e instanceof Error ? e : new Error(String(e)));
  }
}

// ---------- Persistência de mensagens ----------

export interface PersistedMsg {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  if (!userId) throw new Error('Não autenticado.');
  const { error } = await supabase.from('ai_chat_messages').insert({
    conversation_id: conversationId,
    role,
    content,
    user_id: userId,
  });
  if (error) throw new Error(error.message);
}

export async function loadConversation(conversationId: string): Promise<PersistedMsg[]> {
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .select('id,conversation_id,role,content,created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PersistedMsg[];
}

export interface ConversationSummary {
  conversation_id: string;
  first_message: string;
  last_at: string;
  count: number;
}

export async function listConversations(limit = 30): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .select('conversation_id,content,role,created_at')
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  const map = new Map<string, ConversationSummary>();
  for (const row of data ?? []) {
    const r = row as { conversation_id: string; content: string; role: string; created_at: string };
    const ex = map.get(r.conversation_id);
    if (!ex) {
      map.set(r.conversation_id, {
        conversation_id: r.conversation_id,
        first_message: r.role === 'user' ? r.content : '...',
        last_at: r.created_at,
        count: 1,
      });
    } else {
      ex.count += 1;
      ex.last_at = r.created_at;
      if (ex.first_message === '...' && r.role === 'user') ex.first_message = r.content;
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.last_at.localeCompare(a.last_at))
    .slice(0, limit);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_chat_messages')
    .delete()
    .eq('conversation_id', conversationId);
  if (error) throw new Error(error.message);
}
