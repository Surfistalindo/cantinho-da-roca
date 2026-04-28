import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { LeadInsight } from "@/lib/leadInsights";

interface InsightResponse extends LeadInsight {
  lead_id: string;
  generated_at: string;
}

interface BatchProgress {
  total: number;
  done: number;
  current?: string;
}

export function useLeadInsights() {
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [batch, setBatch] = useState<BatchProgress | null>(null);
  const cancelRef = useRef(false);

  const generateOne = useCallback(async (leadId: string): Promise<InsightResponse | null> => {
    setGeneratingIds((prev) => new Set(prev).add(leadId));
    try {
      const { data, error } = await supabase.functions.invoke<InsightResponse | { error: string; message?: string }>(
        "ia-lead-insights",
        { body: { lead_id: leadId } },
      );

      if (error) {
        // supabase-js mapeia 4xx/5xx aqui. Tenta extrair mensagem amigável do contexto.
        const ctx = (error as any)?.context;
        const status = ctx?.status;
        if (status === 429) toast.error("Muitas requisições. Aguarde alguns segundos.");
        else if (status === 402) toast.error("Créditos da IA esgotados. Adicione créditos no workspace.");
        else toast.error(error.message ?? "Falha ao gerar resumo.");
        return null;
      }

      if (data && "error" in data) {
        toast.error(data.message ?? data.error);
        return null;
      }

      return data as InsightResponse;
    } catch (e) {
      console.error("generateOne error", e);
      toast.error("Falha ao gerar resumo.");
      return null;
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  }, []);

  const generateMany = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      cancelRef.current = false;
      setBatch({ total: ids.length, done: 0 });
      let ok = 0;
      let failed = 0;
      for (let i = 0; i < ids.length; i++) {
        if (cancelRef.current) break;
        const id = ids[i];
        setBatch({ total: ids.length, done: i, current: id });
        const res = await generateOne(id);
        if (res) ok++; else failed++;
        // Espaçamento para evitar 429 (rate-limit é 30/min/usuário)
        if (i < ids.length - 1) await new Promise((r) => setTimeout(r, 350));
      }
      setBatch(null);
      if (ok > 0) toast.success(`${ok} resumo${ok === 1 ? "" : "s"} gerado${ok === 1 ? "" : "s"}.`);
      if (failed > 0) toast.error(`${failed} falha${failed === 1 ? "" : "s"} na geração.`);
    },
    [generateOne],
  );

  const cancelBatch = useCallback(() => {
    cancelRef.current = true;
  }, []);

  return { generateOne, generateMany, cancelBatch, generatingIds, batch };
}
