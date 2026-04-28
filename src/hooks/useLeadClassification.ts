import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { LeadStatus } from '@/config/app';

interface BatchProgress {
  done: number;
  total: number;
}

const CHUNK = 10;

/**
 * Classificação de status via edge function ia-classify-status.
 * Persiste sugestão em ai_suggested_status / ai_status_confidence.
 */
export function useLeadClassification() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<BatchProgress>({ done: 0, total: 0 });
  const cancelRef = useRef(false);

  const classifyBatch = useCallback(async (
    leadIds: string[],
    onTick?: (p: BatchProgress) => void,
  ) => {
    if (leadIds.length === 0) return;
    cancelRef.current = false;
    setRunning(true);
    setProgress({ done: 0, total: leadIds.length });

    let done = 0;
    let failed = 0;
    let stop = false;

    try {
      for (let i = 0; i < leadIds.length && !stop; i += CHUNK) {
        if (cancelRef.current) break;
        const chunk = leadIds.slice(i, i + CHUNK);
        const { data, error } = await supabase.functions.invoke('ia-classify-status', {
          body: { lead_ids: chunk },
        });
        if (error) {
          // O invoke embrulha o status; tentamos detectar 429/402 pela mensagem
          const msg = (error as any)?.message ?? '';
          if (/429|rate/i.test(msg)) {
            toast.error('Limite de IA atingido. Aguarde alguns segundos e tente de novo.');
            stop = true;
            break;
          }
          if (/402|payment|cred/i.test(msg)) {
            toast.error('Créditos da IA esgotados. Adicione créditos no workspace.');
            stop = true;
            break;
          }
          failed += chunk.length;
        } else if ((data as any)?.error) {
          failed += chunk.length;
        }
        done += chunk.length;
        const next = { done: Math.min(done, leadIds.length), total: leadIds.length };
        setProgress(next);
        onTick?.(next);
      }

      if (cancelRef.current) {
        toast.info(`Classificação cancelada em ${done}/${leadIds.length}.`);
      } else if (!stop) {
        if (failed > 0) toast.warning(`Classificados ${done - failed} de ${leadIds.length}.`);
        else toast.success(`${done} lead${done === 1 ? '' : 's'} classificado${done === 1 ? '' : 's'}.`);
      }
    } finally {
      setRunning(false);
    }
  }, []);

  const applyOne = useCallback(async (leadId: string, status: LeadStatus) => {
    const { error } = await supabase
      .from('leads')
      .update({
        status,
        ai_suggested_status: null,
        ai_status_confidence: null,
      })
      .eq('id', leadId);
    if (error) {
      toast.error('Falha ao aplicar sugestão.');
      return false;
    }
    toast.success('Status aplicado.');
    return true;
  }, []);

  const dismissOne = useCallback(async (leadId: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ ai_suggested_status: null, ai_status_confidence: null })
      .eq('id', leadId);
    if (error) {
      toast.error('Falha ao limpar sugestão.');
      return false;
    }
    return true;
  }, []);

  const applyHighConfidence = useCallback(async (
    rows: Array<{ id: string; ai_suggested_status: string | null; ai_status_confidence: number | null; status: string }>,
    threshold = 0.8,
  ) => {
    const targets = rows.filter((r) =>
      r.ai_suggested_status &&
      r.ai_suggested_status !== r.status &&
      (r.ai_status_confidence ?? 0) >= threshold,
    );
    if (targets.length === 0) {
      toast.info('Nenhuma sugestão acima do limite.');
      return 0;
    }
    let ok = 0;
    await Promise.all(targets.map(async (r) => {
      const { error } = await supabase
        .from('leads')
        .update({
          status: r.ai_suggested_status as LeadStatus,
          ai_suggested_status: null,
          ai_status_confidence: null,
        })
        .eq('id', r.id);
      if (!error) ok += 1;
    }));
    toast.success(`${ok} sugest${ok === 1 ? 'ão aplicada' : 'ões aplicadas'}.`);
    return ok;
  }, []);

  const cancel = useCallback(() => { cancelRef.current = true; }, []);

  return { classifyBatch, applyOne, dismissOne, applyHighConfidence, cancel, running, progress };
}
