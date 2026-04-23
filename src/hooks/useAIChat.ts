import { useCallback, useEffect, useRef, useState } from 'react';
import {
  streamAssistant, saveMessage, loadConversation, listConversations,
  deleteConversation as svcDelete,
  type ChatMsg, type ToolTraceEntry, type ConversationSummary,
} from '@/services/ai/aiAssistantService';
import { toast } from 'sonner';

export interface ChatTurn {
  id: string;             // local-only id
  role: 'user' | 'assistant';
  content: string;
  trace?: ToolTraceEntry[];
  pending?: boolean;
}

function newId() {
  return crypto.randomUUID();
}

export function useAIChat(initialConversationId?: string) {
  const [conversationId, setConversationId] = useState<string>(() => initialConversationId ?? newId());
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const refreshConversations = useCallback(async () => {
    try {
      const list = await listConversations();
      setConversations(list);
    } catch (e) {
      console.warn('listConversations failed', e);
    }
  }, []);

  // Carrega histórico ao montar/trocar conversa
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const persisted = await loadConversation(conversationId);
        if (cancelled) return;
        setTurns(
          persisted
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })),
        );
      } catch (e) {
        console.warn('loadConversation failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, [conversationId]);

  useEffect(() => { refreshConversations(); }, [refreshConversations]);

  const send = useCallback(async (input: string) => {
    const text = input.trim();
    if (!text || streaming) return;

    const userTurn: ChatTurn = { id: newId(), role: 'user', content: text };
    const assistantTurn: ChatTurn = { id: newId(), role: 'assistant', content: '', pending: true };
    setTurns((prev) => [...prev, userTurn, assistantTurn]);
    setStreaming(true);

    // Persiste msg do usuário em paralelo
    saveMessage(conversationId, 'user', text).catch((e) => console.warn('save user msg failed', e));

    // Monta payload com TODA a conversa anterior (sem o assistant pendente)
    const payload: ChatMsg[] = [...turns, userTurn].map((t) => ({ role: t.role, content: t.content }));

    abortRef.current = new AbortController();
    let acc = '';

    try {
      await streamAssistant(payload, {
        signal: abortRef.current.signal,
        onTrace: (trace) => {
          setTurns((prev) => prev.map((t) => t.id === assistantTurn.id ? { ...t, trace } : t));
        },
        onDelta: (chunk) => {
          acc += chunk;
          setTurns((prev) => prev.map((t) => t.id === assistantTurn.id ? { ...t, content: acc } : t));
        },
        onDone: () => {
          setTurns((prev) => prev.map((t) => t.id === assistantTurn.id ? { ...t, pending: false } : t));
          setStreaming(false);
          if (acc) {
            saveMessage(conversationId, 'assistant', acc)
              .then(() => refreshConversations())
              .catch((e) => console.warn('save assistant msg failed', e));
          }
        },
        onError: (err) => {
          toast.error(err.message);
          setTurns((prev) => prev.filter((t) => t.id !== assistantTurn.id));
          setStreaming(false);
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro no assistente';
      toast.error(msg);
      setTurns((prev) => prev.filter((t) => t.id !== assistantTurn.id));
      setStreaming(false);
    }
  }, [conversationId, streaming, turns, refreshConversations]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
    setTurns((prev) => prev.map((t) => t.pending ? { ...t, pending: false } : t));
  }, []);

  const newConversation = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
    setTurns([]);
    setConversationId(newId());
  }, []);

  const openConversation = useCallback((id: string) => {
    abortRef.current?.abort();
    setStreaming(false);
    setConversationId(id);
  }, []);

  const removeConversation = useCallback(async (id: string) => {
    try {
      await svcDelete(id);
      if (id === conversationId) {
        newConversation();
      }
      await refreshConversations();
      toast.success('Conversa removida');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao remover');
    }
  }, [conversationId, newConversation, refreshConversations]);

  return {
    conversationId,
    turns,
    streaming,
    conversations,
    send,
    stop,
    newConversation,
    openConversation,
    removeConversation,
  };
}
