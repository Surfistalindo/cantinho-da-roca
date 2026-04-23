import { FIELD_DICTIONARY, normalizeHeader, type CrmFieldKey } from '@/lib/ia/fieldDictionary';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export interface ColumnMapping {
  source: string;
  target: CrmFieldKey;
  confidence: number;
  suggestedBy: 'heuristic' | 'ai' | 'manual' | 'none';
}

/** Para um header, devolve a melhor categoria do dicionário (sem considerar conflitos). */
function bestDictMatch(header: string): { key: Exclude<CrmFieldKey, 'ignore'>; conf: number } | null {
  const norm = normalizeHeader(header);
  if (!norm) return null;
  let best: { key: Exclude<CrmFieldKey, 'ignore'>; conf: number } | null = null;
  for (const [field, syns] of Object.entries(FIELD_DICTIONARY) as [Exclude<CrmFieldKey, 'ignore'>, string[]][]) {
    for (const syn of syns) {
      if (norm === syn) { return { key: field, conf: 1 }; }
      if (norm.includes(syn) || syn.includes(norm)) {
        const conf = Math.min(syn.length, norm.length) / Math.max(syn.length, norm.length);
        const adjusted = conf * 0.8;
        if (!best || adjusted > best.conf) best = { key: field, conf: adjusted };
      }
    }
  }
  return best;
}

/** ≥60% das amostras são "parecidas com telefone" (dígitos/parênteses/hífen/espaço). */
function looksLikePhoneColumn(samples: unknown[]): boolean {
  const filled = samples.map((v) => String(v ?? '').trim()).filter(Boolean);
  if (filled.length === 0) return false;
  const phoneish = filled.filter((s) => {
    const digits = s.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) return false;
    // proporção de dígitos vs total alta
    return digits.length / s.length >= 0.5;
  });
  return phoneish.length / filled.length >= 0.6;
}

/** ≥60% das amostras são parecidas com data. */
function looksLikeDateColumn(samples: unknown[]): boolean {
  const filled = samples.map((v) => v).filter((v) => v !== null && v !== undefined && v !== '');
  if (filled.length === 0) return false;
  const dateish = filled.filter((v) => {
    if (v instanceof Date) return true;
    const s = String(v);
    if (/^\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}$/.test(s.replace(/\/+/g, '/'))) return true;
    if (/^\d{1,2}[\/\-.]\d{1,2}$/.test(s)) return true;
    return false;
  });
  return dateish.length / filled.length >= 0.6;
}

/**
 * Heurística com desempate por conteúdo das amostras.
 * - Resolve ambiguidades clássicas (CONTATO = nome ou telefone?)
 * - Aceita samples opcionais (passar undefined mantém comportamento por header).
 */
export function heuristicMap(headers: string[], samplesByHeader?: Record<string, unknown[]>): ColumnMapping[] {
  // 1ª passada: melhor candidato por header
  const candidates = headers.map((h) => ({ header: h, match: bestDictMatch(h) }));

  // Desempate de "contato" → phone se conteúdo é numérico
  for (const c of candidates) {
    if (!c.match) continue;
    const norm = normalizeHeader(c.header);
    if (norm === 'contato' || norm.includes('contato')) {
      const sample = samplesByHeader?.[c.header] ?? [];
      if (looksLikePhoneColumn(sample)) {
        c.match = { key: 'phone', conf: 0.95 };
      } else if (sample.length > 0 && !looksLikePhoneColumn(sample)) {
        // Mantém como name se já estava como name OU se conteúdo claramente não é numérico
        if (c.match.key === 'phone') c.match = { key: 'name', conf: 0.7 };
      }
    }
    // Coluna que cai como notes mas conteúdo é claramente data → next_contact_at
    if (c.match.key === 'notes') {
      const sample = samplesByHeader?.[c.header] ?? [];
      if (looksLikeDateColumn(sample)) {
        c.match = { key: 'next_contact_at', conf: 0.85 };
      }
    }
  }

  // 2ª passada: resolve conflitos (cada CrmFieldKey só uma vez)
  const used = new Set<CrmFieldKey>();
  // Ordena por confiança desc para que o "melhor" candidato vença
  const order = [...candidates]
    .map((c, i) => ({ ...c, originalIdx: i }))
    .sort((a, b) => (b.match?.conf ?? 0) - (a.match?.conf ?? 0));

  const resolved = new Map<number, ColumnMapping>();
  for (const c of order) {
    if (c.match && !used.has(c.match.key)) {
      used.add(c.match.key);
      resolved.set(c.originalIdx, {
        source: c.header,
        target: c.match.key,
        confidence: c.match.conf,
        suggestedBy: 'heuristic',
      });
    } else {
      resolved.set(c.originalIdx, {
        source: c.header,
        target: 'ignore',
        confidence: 0,
        suggestedBy: 'none',
      });
    }
  }

  return headers.map((_, i) => resolved.get(i)!);
}

/** Constrói samplesByHeader a partir de até N rows. */
export function buildSamplesByHeader(
  headers: string[],
  rows: Array<Record<string, unknown>>,
  maxSamples = 8,
): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {};
  for (const h of headers) out[h] = [];
  for (const r of rows.slice(0, maxSamples)) {
    for (const h of headers) out[h].push(r[h]);
  }
  return out;
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
