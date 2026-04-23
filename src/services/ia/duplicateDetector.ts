import { supabase } from '@/integrations/supabase/client';
import { normalizePhone } from '@/lib/ia/phoneFormat';
import { normalizeHeader } from '@/lib/ia/fieldDictionary';
import type { NormalizedLeadRow } from './leadNormalizer';

export type DuplicateStrategy = 'skip' | 'update' | 'merge';

export interface ExistingLead {
  id: string;
  name: string;
  phone: string | null;
}

export interface DuplicateMatch {
  rowIndex: number;
  existing: ExistingLead;
  strategy: DuplicateStrategy;
}

export async function loadExistingLeads(): Promise<ExistingLead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('id, name, phone')
    .limit(10000);
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone ? normalizePhone(l.phone) : null,
  }));
}

export function detectDuplicates(
  rows: NormalizedLeadRow[],
  existing: ExistingLead[],
  defaultStrategy: DuplicateStrategy = 'skip',
): DuplicateMatch[] {
  const byPhone = new Map<string, ExistingLead>();
  const byName = new Map<string, ExistingLead>();
  for (const e of existing) {
    if (e.phone) byPhone.set(e.phone, e);
    if (e.name) byName.set(normalizeHeader(e.name), e);
  }

  const matches: DuplicateMatch[] = [];
  for (const row of rows) {
    if (row.errors.length) continue;
    let match: ExistingLead | undefined;
    if (row.data.phone && byPhone.has(row.data.phone)) match = byPhone.get(row.data.phone);
    else if (row.data.name && !row.data.phone) {
      const k = normalizeHeader(row.data.name);
      const cand = byName.get(k);
      if (cand && !cand.phone) match = cand;
    }
    if (match) matches.push({ rowIndex: row.rowIndex, existing: match, strategy: defaultStrategy });
  }
  return matches;
}
