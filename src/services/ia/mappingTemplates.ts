import type { CrmFieldKey } from '@/lib/ia/fieldDictionary';
import { normalizeHeader } from '@/lib/ia/fieldDictionary';

const STORAGE_KEY = 'ia.excel.mappingTemplates';

export interface MappingTemplate {
  id: string;
  name: string;
  createdAt: string;
  mappings: Array<{ source: string; target: CrmFieldKey }>;
}

function read(): MappingTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as MappingTemplate[]) : [];
  } catch {
    return [];
  }
}

function write(list: MappingTemplate[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore quota */ }
}

export function listTemplates(): MappingTemplate[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveTemplate(name: string, mappings: Array<{ source: string; target: CrmFieldKey }>): MappingTemplate {
  const all = read();
  const tpl: MappingTemplate = {
    id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || 'Template sem nome',
    createdAt: new Date().toISOString(),
    mappings: mappings.filter((m) => m.target !== 'ignore').map((m) => ({ source: m.source, target: m.target })),
  };
  all.push(tpl);
  write(all);
  return tpl;
}

export function deleteTemplate(id: string): void {
  write(read().filter((t) => t.id !== id));
}

/** Retorna o template com melhor casamento de headers (>= threshold), ou null. */
export function detectMatchingTemplate(headers: string[], threshold = 0.8): { template: MappingTemplate; score: number } | null {
  const all = listTemplates();
  if (all.length === 0) return null;
  const headersNorm = new Set(headers.map(normalizeHeader));
  let best: { template: MappingTemplate; score: number } | null = null;
  for (const tpl of all) {
    if (tpl.mappings.length === 0) continue;
    const matched = tpl.mappings.filter((m) => headersNorm.has(normalizeHeader(m.source))).length;
    const score = matched / tpl.mappings.length;
    if (score >= threshold && (!best || score > best.score)) {
      best = { template: tpl, score };
    }
  }
  return best;
}
