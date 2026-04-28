import { supabase } from '@/integrations/supabase/client';
import { normalizePhone } from '@/lib/ia/phoneFormat';

export interface LeadLite {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  created_at: string;
  notes: string | null;
}

export interface DuplicateGroup {
  key: string;
  reason: 'phone_exact' | 'name_similar';
  leads: LeadLite[];
}

/* ---------- similaridade de nome (Levenshtein normalizado) ---------- */

function normalizeName(s: string): string {
  return s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const tmp = dp[i];
      if (a[i - 1] === b[j - 1]) dp[i] = prev;
      else dp[i] = Math.min(prev, dp[i - 1], dp[i]) + 1;
      prev = tmp;
    }
  }
  return dp[a.length];
}

function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

/* ---------- detecção ---------- */

export async function loadAllLeads(): Promise<LeadLite[]> {
  const all: LeadLite[] = [];
  let from = 0;
  const PAGE = 1000;
  // pagina para passar do limite default de 1000
  while (true) {
    const { data, error } = await supabase
      .from('leads')
      .select('id,name,phone,status,created_at,notes')
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as LeadLite[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export function findDuplicateGroups(leads: LeadLite[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const seen = new Set<string>();

  // 1) Telefone normalizado idêntico
  const byPhone = new Map<string, LeadLite[]>();
  for (const l of leads) {
    const p = normalizePhone(l.phone);
    if (!p) continue;
    const arr = byPhone.get(p) ?? [];
    arr.push(l);
    byPhone.set(p, arr);
  }
  for (const [phone, arr] of byPhone) {
    if (arr.length >= 2) {
      groups.push({ key: `phone:${phone}`, reason: 'phone_exact', leads: arr });
      arr.forEach((l) => seen.add(l.id));
    }
  }

  // 2) Nome muito parecido (≥0.88), apenas para os que ainda não caíram em grupo
  // e apenas para nomes com ≥4 chars normalizados.
  const remaining = leads.filter((l) => !seen.has(l.id));
  const enriched = remaining
    .map((l) => ({ l, n: normalizeName(l.name) }))
    .filter((x) => x.n.length >= 4);

  // Bucket por primeira letra para reduzir comparações N²
  const buckets = new Map<string, typeof enriched>();
  for (const x of enriched) {
    const k = x.n[0];
    const arr = buckets.get(k) ?? [];
    arr.push(x);
    buckets.set(k, arr);
  }

  for (const bucket of buckets.values()) {
    for (let i = 0; i < bucket.length; i++) {
      if (seen.has(bucket[i].l.id)) continue;
      const cluster: LeadLite[] = [bucket[i].l];
      for (let j = i + 1; j < bucket.length; j++) {
        if (seen.has(bucket[j].l.id)) continue;
        if (similarity(bucket[i].n, bucket[j].n) >= 0.88) {
          cluster.push(bucket[j].l);
        }
      }
      if (cluster.length >= 2) {
        cluster.forEach((l) => seen.add(l.id));
        groups.push({ key: `name:${bucket[i].n}`, reason: 'name_similar', leads: cluster });
      }
    }
  }

  // Ordena: maiores grupos primeiro
  return groups.sort((a, b) => b.leads.length - a.leads.length);
}

/* ---------- mesclagem ---------- */

export interface MergeResult {
  keptId: string;
  removedIds: string[];
  movedInteractions: number;
  movedNotes: number;
}

export async function mergeLeads(
  keepId: string,
  group: LeadLite[],
): Promise<MergeResult> {
  const others = group.filter((l) => l.id !== keepId);
  const removeIds = others.map((l) => l.id);
  if (removeIds.length === 0) {
    return { keptId: keepId, removedIds: [], movedInteractions: 0, movedNotes: 0 };
  }

  const keep = group.find((l) => l.id === keepId);
  if (!keep) throw new Error('keep lead not found in group');

  // 1) concatena notas
  const extraNotes = others
    .map((o) => o.notes?.trim())
    .filter((n): n is string => !!n && n.length > 0);
  const mergedNotes = [keep.notes?.trim(), ...extraNotes].filter(Boolean).join('\n\n— mesclado —\n');
  if (mergedNotes && mergedNotes !== (keep.notes ?? '')) {
    await supabase.from('leads').update({ notes: mergedNotes.slice(0, 5000) }).eq('id', keepId);
  }

  // 2) reapontamento de interações
  const { data: ints, error: intsErr } = await supabase
    .from('interactions')
    .update({ lead_id: keepId })
    .in('lead_id', removeIds)
    .select('id');
  if (intsErr) throw intsErr;

  // 3) reapontamento de lead_notes
  const { data: lnotes, error: lnotesErr } = await supabase
    .from('lead_notes')
    .update({ lead_id: keepId })
    .in('lead_id', removeIds)
    .select('id');
  if (lnotesErr) throw lnotesErr;

  // 4) deleta os duplicados
  const { error: delErr } = await supabase.from('leads').delete().in('id', removeIds);
  if (delErr) throw delErr;

  return {
    keptId: keepId,
    removedIds: removeIds,
    movedInteractions: ints?.length ?? 0,
    movedNotes: lnotes?.length ?? 0,
  };
}
