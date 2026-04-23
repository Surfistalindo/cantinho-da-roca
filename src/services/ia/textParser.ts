// Parser de texto livre via edge function ia-parse-text.
// Devolve um ParsedSheet compatível com o fluxo Excel/CSV (mapeamento já pré-resolvido).
import { supabase } from '@/integrations/supabase/client';
import type { ParsedSheet } from './excelParser';

export interface ExtractedLead {
  name: string;
  phone: string | null;
  origin: string | null;
  product_interest: string | null;
  notes: string | null;
}

export interface TextExtractionResult {
  leads: ExtractedLead[];
  count: number;
}

/** Cabeçalhos fixos usados no ParsedSheet sintético — batem 1:1 com CrmFieldKey. */
export const TEXT_HEADERS = ['name', 'phone', 'origin', 'product_interest', 'notes'] as const;

export async function extractLeadsFromText(text: string): Promise<TextExtractionResult> {
  const { data, error } = await supabase.functions.invoke('ia-parse-text', {
    body: { text },
  });
  if (error) {
    // supabase-js encapsula a resposta de erro — tenta extrair message amigável
    const msg = (error as { message?: string }).message ?? 'Falha ao extrair leads do texto';
    throw new Error(msg);
  }
  const leads: ExtractedLead[] = Array.isArray(data?.leads) ? data.leads : [];
  return { leads, count: leads.length };
}

/**
 * Converte os leads extraídos em ParsedSheet pronto para o fluxo de import.
 * Cabeçalhos já são as chaves de CRM, então o mapeamento heurístico vai bater 100%.
 */
export function leadsToParsedSheet(leads: ExtractedLead[]): ParsedSheet {
  const headers = [...TEXT_HEADERS];
  const rows = leads.map((l) => ({
    name: l.name ?? '',
    phone: l.phone ?? '',
    origin: l.origin ?? '',
    product_interest: l.product_interest ?? '',
    notes: l.notes ?? '',
  }));
  const rawRows = rows.map((r) => headers.map((h) => (r as Record<string, unknown>)[h]));
  return {
    headers,
    rows,
    rawRows,
    sheetName: 'texto-colado',
    totalRows: rows.length,
  };
}
