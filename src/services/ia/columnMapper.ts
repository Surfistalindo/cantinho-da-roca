import { FIELD_DICTIONARY, normalizeHeader, type CrmFieldKey } from '@/lib/ia/fieldDictionary';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export interface ColumnMapping {
  source: string;
  target: CrmFieldKey;
  confidence: number;
  suggestedBy: 'heuristic' | 'ai' | 'manual' | 'none';
}

export function heuristicMap(headers: string[]): ColumnMapping[] {
  const used = new Set<CrmFieldKey>();
  return headers.map((h) => {
    const norm = normalizeHeader(h);
    let best: { key: CrmFieldKey; conf: number } | null = null;
    for (const [field, syns] of Object.entries(FIELD_DICTIONARY) as [Exclude<CrmFieldKey, 'ignore'>, string[]][]) {
      for (const syn of syns) {
        if (norm === syn) { best = { key: field, conf: 1 }; break; }
        if (norm.includes(syn) || syn.includes(norm)) {
          const conf = Math.min(syn.length, norm.length) / Math.max(syn.length, norm.length);
          if (!best || conf > best.conf) best = { key: field, conf: conf * 0.8 };
        }
      }
      if (best?.conf === 1) break;
    }
    if (best && !used.has(best.key)) {
      used.add(best.key);
      return { source: h, target: best.key, confidence: best.conf, suggestedBy: 'heuristic' as const };
    }
    return { source: h, target: 'ignore' as CrmFieldKey, confidence: 0, suggestedBy: 'none' as const };
  });
}

/** Tenta complementar via IA quando há colunas não mapeadas. */
export async function aiAssistMap(
  headers: string[],
  samples: unknown[][],
  current: ColumnMapping[],
): Promise<ColumnMapping[]> {
  const hasUnmapped = current.some((c) => c.target === 'ignore' && c.suggestedBy === 'none');
  if (!hasUnmapped) return current;

  try {
    const { data, error } = await supabase.functions.invoke('ia-suggest-mapping', {
      body: {
        headers,
        samples: samples.slice(0, 3).map((r) => r.map((v) => (v == null ? '' : String(v)))),
      },
    });
    if (error || !data?.mappings) return current;

    const usedTargets = new Set(current.filter((c) => c.target !== 'ignore').map((c) => c.target));
    const aiMap = new Map<string, { target: CrmFieldKey; confidence: number }>();
    for (const m of data.mappings as Array<{ source: string; target: CrmFieldKey; confidence: number }>) {
      aiMap.set(m.source, { target: m.target, confidence: m.confidence });
    }

    return current.map((c) => {
      if (c.suggestedBy !== 'none') return c;
      const ai = aiMap.get(c.source);
      if (!ai || ai.target === 'ignore') return c;
      if (usedTargets.has(ai.target)) return c;
      usedTargets.add(ai.target);
      return { source: c.source, target: ai.target, confidence: ai.confidence, suggestedBy: 'ai' as const };
    });
  } catch (e) {
    logger.warn('aiAssistMap failed', e);
    return current;
  }
}
