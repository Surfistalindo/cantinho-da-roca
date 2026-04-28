import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getLeadScore, type LeadScoreInput, type LeadScoreInfo } from '@/lib/leadScore';

interface ScoreableLead extends LeadScoreInput {
  id: string;
}

interface BatchProgress {
  done: number;
  total: number;
}

const CHUNK = 25;

/**
 * Recalcula score (rule-based, client-side) e persiste em
 * leads.ai_score / ai_score_reason / ai_score_updated_at / ai_priority.
 */
export function useLeadScoring() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<BatchProgress>({ done: 0, total: 0 });
  const cancelRef = useRef(false);

  const computeAndPersist = useCallback(async (
    lead: ScoreableLead,
    interactionCount: number,
  ): Promise<LeadScoreInfo> => {
    const info = getLeadScore(lead, { interactionCount });
    const { error } = await supabase
      .from('leads')
      .update({
        ai_score: info.score,
        ai_score_reason: info.reasons.slice(0, 3).join(' · ').slice(0, 280),
        ai_score_updated_at: new Date().toISOString(),
        ai_priority: info.level,
      })
      .eq('id', lead.id);
    if (error) throw error;
    return info;
  }, []);

  const recomputeOne = useCallback(async (leadId: string) => {
    try {
      const { data: lead, error } = await supabase
        .from('leads')
        .select('id,status,origin,created_at,last_contact_at,next_contact_at')
        .eq('id', leadId)
        .maybeSingle();
      if (error || !lead) throw error ?? new Error('lead_not_found');

      const { count } = await supabase
        .from('interactions')
        .select('id', { count: 'exact', head: true })
        .eq('lead_id', leadId);

      const info = await computeAndPersist(lead as ScoreableLead, count ?? 0);
      toast.success(`Score atualizado: ${info.score} · ${info.label}`);
      return info;
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível recalcular o score.');
      return null;
    }
  }, [computeAndPersist]);

  const recomputeBatch = useCallback(async (
    leadIds: string[],
    onTick?: (p: BatchProgress) => void,
  ) => {
    if (leadIds.length === 0) return;
    cancelRef.current = false;
    setRunning(true);
    setProgress({ done: 0, total: leadIds.length });

    let done = 0;
    let failed = 0;

    try {
      for (let i = 0; i < leadIds.length; i += CHUNK) {
        if (cancelRef.current) break;
        const chunk = leadIds.slice(i, i + CHUNK);

        const { data: leads } = await supabase
          .from('leads')
          .select('id,status,origin,created_at,last_contact_at,next_contact_at')
          .in('id', chunk);

        // Conta interações em UMA query agrupada
        const { data: ints } = await supabase
          .from('interactions')
          .select('lead_id')
          .in('lead_id', chunk);

        const counts = new Map<string, number>();
        for (const r of ints ?? []) {
          counts.set(r.lead_id as string, (counts.get(r.lead_id as string) ?? 0) + 1);
        }

        await Promise.all((leads ?? []).map(async (l: any) => {
          try {
            await computeAndPersist(l as ScoreableLead, counts.get(l.id) ?? 0);
          } catch {
            failed += 1;
          } finally {
            done += 1;
            const next = { done, total: leadIds.length };
            setProgress(next);
            onTick?.(next);
          }
        }));
      }

      if (cancelRef.current) {
        toast.info(`Recálculo cancelado em ${done}/${leadIds.length}.`);
      } else if (failed > 0) {
        toast.warning(`Recalculados ${done - failed} de ${leadIds.length} · ${failed} falharam.`);
      } else {
        toast.success(`${done} lead${done === 1 ? '' : 's'} recalculado${done === 1 ? '' : 's'}.`);
      }
    } finally {
      setRunning(false);
    }
  }, [computeAndPersist]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  return { recomputeOne, recomputeBatch, cancel, running, progress };
}
