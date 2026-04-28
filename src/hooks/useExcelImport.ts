import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { parseExcelFile, type ParsedSheet, type PerSheetData } from '@/services/ia/excelParser';
import { aiAssistMap, buildSamplesByHeader, heuristicMap, type ColumnMapping } from '@/services/ia/columnMapper';
import { normalizeAll, normalizeRow, type NormalizedLeadRow } from '@/services/ia/leadNormalizer';
import { detectDuplicates, loadExistingLeads, type DuplicateMatch, type DuplicateStrategy } from '@/services/ia/duplicateDetector';
import { executeImport, type ImportProgress, type ImportResult } from '@/services/ia/importExecutor';
import {
  detectMatchingTemplate, listTemplates, saveTemplate, deleteTemplate,
  type MappingTemplate,
} from '@/services/ia/mappingTemplates';
import type { CrmFieldKey } from '@/lib/ia/fieldDictionary';
import { toast } from 'sonner';

export type ImportStep =
  | 'idle'
  | 'parsing'
  | 'mapping'
  | 'strategy'
  | 'reviewing'
  | 'resolving_duplicates'
  | 'importing'
  | 'done'
  | 'error';

const DEFAULT_STRATEGY_KEY = 'ia.excel.defaultDupStrategy';

function loadDefaultStrategy(): DuplicateStrategy {
  try {
    const v = localStorage.getItem(DEFAULT_STRATEGY_KEY);
    if (v === 'skip' || v === 'update' || v === 'merge') return v;
  } catch { /* ignore */ }
  return 'skip';
}

export interface UseExcelImportState {
  step: ImportStep;
  file: File | null;
  parsed: ParsedSheet | null;
  /** Mapeamento global (união por header) — exibido na UI. */
  mappings: ColumnMapping[];
  /** Mapeamento por aba (usado internamente para normalizar). */
  mappingsBySheet: Record<string, ColumnMapping[]>;
  /** Amostras de valores por header (até 8), mescladas de todas as abas — usado em tooltips e legendas da UI. */
  samplesByHeader: Record<string, unknown[]>;
  defaultStrategy: DuplicateStrategy;
  normalized: NormalizedLeadRow[];
  duplicates: DuplicateMatch[];
  progress: ImportProgress | null;
  result: ImportResult | null;
  error: string | null;
  detectedTemplate: MappingTemplate | null;
}

const INITIAL: UseExcelImportState = {
  step: 'idle', file: null, parsed: null, mappings: [], mappingsBySheet: {},
  samplesByHeader: {},
  defaultStrategy: 'skip',
  normalized: [], duplicates: [], progress: null, result: null, error: null,
  detectedTemplate: null,
};

export interface UseExcelImportOptions {
  source?: string;
  parseFile?: (file: File) => Promise<ParsedSheet>;
}

/** Constrói o mapeamento global (união por header) a partir dos mapeamentos por aba. */
function unifyMappings(parsed: ParsedSheet, bySheet: Record<string, ColumnMapping[]>): ColumnMapping[] {
  const seen = new Map<string, ColumnMapping>();
  const visibleHeaders = parsed.headers.filter((h) => h !== '__sheet');
  for (const h of visibleHeaders) {
    for (const sheetName of Object.keys(bySheet)) {
      const m = bySheet[sheetName].find((x) => x.source === h);
      if (m && m.target !== 'ignore') { seen.set(h, m); break; }
      if (m && !seen.has(h)) seen.set(h, m);
    }
    if (!seen.has(h)) {
      seen.set(h, { source: h, target: 'ignore', confidence: 0, suggestedBy: 'none' });
    }
  }
  return visibleHeaders.map((h) => seen.get(h)!);
}

/** Aplica um override de target em todos os mapeamentos por aba que contenham esse header. */
function overrideInAllSheets(
  bySheet: Record<string, ColumnMapping[]>,
  source: string,
  target: CrmFieldKey,
): Record<string, ColumnMapping[]> {
  const out: Record<string, ColumnMapping[]> = {};
  for (const [sheet, mappings] of Object.entries(bySheet)) {
    out[sheet] = mappings.map((m) =>
      m.source === source
        ? { ...m, target, suggestedBy: 'manual' as const, confidence: 1 }
        : m,
    );
  }
  return out;
}

/** Normaliza todas as abas, concatenando os resultados (rowIndex global contínuo). */
function normalizeAcrossSheets(
  parsed: ParsedSheet,
  bySheet: Record<string, ColumnMapping[]>,
): NormalizedLeadRow[] {
  if (!parsed.perSheet || parsed.perSheet.length === 0) {
    // Compat: única aba virtual
    const first = Object.values(bySheet)[0] ?? [];
    return normalizeAll(parsed.rows, first);
  }
  const out: NormalizedLeadRow[] = [];
  let cursor = 0;
  for (const sheet of parsed.perSheet) {
    const mp = bySheet[sheet.name] ?? [];
    const norm = normalizeAll(sheet.rows, mp);
    for (const n of norm) {
      out.push({ ...n, rowIndex: cursor++ });
    }
  }
  return out;
}

export function useExcelImport(options: UseExcelImportOptions = {}) {
  const source = options.source ?? 'excel';
  const parseFile = options.parseFile ?? parseExcelFile;

  const [state, setState] = useState<UseExcelImportState>(() => ({
    ...INITIAL,
    defaultStrategy: loadDefaultStrategy(),
  }));

  useEffect(() => {
    try { localStorage.setItem(DEFAULT_STRATEGY_KEY, state.defaultStrategy); } catch { /* ignore */ }
  }, [state.defaultStrategy]);

  const reset = useCallback(() => setState({ ...INITIAL, defaultStrategy: loadDefaultStrategy() }), []);

  const handleFile = useCallback(async (file: File) => {
    setState((s) => ({ ...s, step: 'parsing', file, error: null }));
    try {
      const parsed = await parseFile(file);
      const sheets: PerSheetData[] = parsed.perSheet ?? [{
        name: parsed.sheetName,
        headers: parsed.headers,
        rows: parsed.rows,
        rawRows: parsed.rawRows,
        totalRows: parsed.totalRows,
      }];

      const bySheet: Record<string, ColumnMapping[]> = {};
      for (const sheet of sheets) {
        const samples = buildSamplesByHeader(sheet.headers, sheet.rows, 8);
        let m = heuristicMap(sheet.headers, samples);
        try {
          m = await aiAssistMap(sheet.headers, sheet.rawRows.slice(0, 3), m);
        } catch (e) {
          logger.warn(`IA mapping skipped for sheet "${sheet.name}"`, e);
        }
        bySheet[sheet.name] = m;
      }

      const mappings = unifyMappings(parsed, bySheet);
      const match = detectMatchingTemplate(parsed.headers);

      setState((s) => ({
        ...s, step: 'mapping', parsed, mappings, mappingsBySheet: bySheet,
        detectedTemplate: match?.template ?? null,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao ler planilha';
      toast.error(msg);
      setState((s) => ({ ...s, step: 'error', error: msg }));
    }
  }, [parseFile]);

  const updateMapping = useCallback((src: string, target: ColumnMapping['target']) => {
    setState((s) => {
      const bySheet = overrideInAllSheets(s.mappingsBySheet, src, target);
      const mappings = s.parsed ? unifyMappings(s.parsed, bySheet) : s.mappings;
      return { ...s, mappings, mappingsBySheet: bySheet };
    });
  }, []);

  const remapAndRevalidate = useCallback((newMappings: ColumnMapping[]) => {
    setState((s) => {
      if (!s.parsed) return s;
      // Aplica diff (qualquer source com target diferente vira override em todas as abas)
      let bySheet = s.mappingsBySheet;
      for (const m of newMappings) {
        const current = s.mappings.find((x) => x.source === m.source);
        if (!current || current.target !== m.target) {
          bySheet = overrideInAllSheets(bySheet, m.source, m.target);
        }
      }
      const unified = unifyMappings(s.parsed, bySheet);
      const normalized = normalizeAcrossSheets(s.parsed, bySheet);
      return { ...s, mappings: unified, mappingsBySheet: bySheet, normalized };
    });
  }, []);

  const updateRowField = useCallback((rowIndex: number, field: keyof NormalizedLeadRow['data'], value: unknown) => {
    setState((s) => {
      const target = s.normalized.find((r) => r.rowIndex === rowIndex);
      if (!target || !s.parsed) return s;
      const next = s.normalized.map((r) => {
        if (r.rowIndex !== rowIndex) return r;
        const newData = { ...r.data, [field]: value === '' ? null : value } as NormalizedLeadRow['data'];
        const errors = newData.name
          ? r.errors.filter((e) => !e.toLowerCase().includes('nome'))
          : (r.errors.some((e) => e.toLowerCase().includes('nome')) ? r.errors : [...r.errors, 'Linha sem nome, telefone ou produto identificável']);
        const warnings = r.warnings.filter((w) => {
          if (field === 'phone') return !w.toLowerCase().startsWith('telefone');
          if (field === 'next_contact_at') return !w.toLowerCase().startsWith('data');
          if (field === 'status') return !w.toLowerCase().startsWith('status');
          if (field === 'name') return !w.toLowerCase().includes('nome ausente');
          return true;
        });
        return { ...r, data: newData, errors, warnings };
      });
      return { ...s, normalized: next };
    });
  }, []);

  const setDefaultStrategy = useCallback((strategy: DuplicateStrategy) => {
    setState((s) => ({ ...s, defaultStrategy: strategy }));
  }, []);

  const goToStrategy = useCallback(() => {
    setState((s) => ({ ...s, step: 'strategy' }));
  }, []);

  const goToReview = useCallback(async () => {
    let strategy: DuplicateStrategy = 'skip';
    setState((s) => {
      strategy = s.defaultStrategy;
      if (!s.parsed) return s;
      const normalized = normalizeAcrossSheets(s.parsed, s.mappingsBySheet);
      return { ...s, step: 'reviewing', normalized };
    });
    try {
      const existing = await loadExistingLeads();
      setState((s) => {
        const dups = detectDuplicates(s.normalized, existing, strategy);
        return { ...s, duplicates: dups };
      });
    } catch (e) {
      logger.warn('Failed to load existing leads', e);
    }
  }, []);

  const updateDuplicateStrategy = useCallback((rowIndex: number, strategy: DuplicateMatch['strategy']) => {
    setState((s) => ({
      ...s,
      duplicates: s.duplicates.map((d) => d.rowIndex === rowIndex ? { ...d, strategy } : d),
    }));
  }, []);

  const applyAllDuplicateStrategy = useCallback((strategy: DuplicateMatch['strategy']) => {
    setState((s) => ({ ...s, duplicates: s.duplicates.map((d) => ({ ...d, strategy })) }));
  }, []);

  const goToDuplicates = useCallback(() => {
    setState((s) => ({ ...s, step: 'resolving_duplicates' }));
  }, []);

  const runImport = useCallback(async () => {
    let snapshot: UseExcelImportState | null = null;
    setState((s) => {
      snapshot = s;
      return { ...s, step: 'importing', progress: { processed: 0, total: s.normalized.length } };
    });
    if (!snapshot) return;
    try {
      const snap: UseExcelImportState = snapshot;
      const result = await executeImport(
        snap.normalized,
        snap.duplicates,
        snap.file?.name,
        (p) => setState((s) => ({ ...s, progress: p })),
        source,
      );
      setState((s) => ({ ...s, step: 'done', result }));
      toast.success(`Importação concluída — ${result.created} criados`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro na importação';
      toast.error(msg);
      setState((s) => ({ ...s, step: 'error', error: msg }));
    }
  }, [source]);

  const back = useCallback(() => {
    setState((s) => {
      if (s.step === 'mapping') return { ...s, step: 'idle', file: null, parsed: null };
      if (s.step === 'strategy') return { ...s, step: 'mapping' };
      if (s.step === 'reviewing') return { ...s, step: 'strategy' };
      if (s.step === 'resolving_duplicates') return { ...s, step: 'reviewing' };
      return s;
    });
  }, []);

  const saveMappingTemplate = useCallback((name: string) => {
    const tpl = saveTemplate(name, state.mappings.map((m) => ({ source: m.source, target: m.target })));
    toast.success(`Template "${tpl.name}" salvo`);
  }, [state.mappings]);

  const applyMappingTemplate = useCallback((tplId: string) => {
    setState((s) => {
      const tpl = listTemplates().find((t) => t.id === tplId);
      if (!tpl || !s.parsed) return s;
      const tplMap = new Map(tpl.mappings.map((m) => [m.source.toLowerCase(), m.target]));
      let bySheet = s.mappingsBySheet;
      for (const h of s.parsed.headers) {
        if (h === '__sheet') continue;
        const target = tplMap.get(h.toLowerCase());
        if (target) bySheet = overrideInAllSheets(bySheet, h, target);
      }
      const unified = unifyMappings(s.parsed, bySheet);
      toast.success(`Template "${tpl.name}" aplicado`);
      return { ...s, mappings: unified, mappingsBySheet: bySheet, detectedTemplate: null };
    });
  }, []);

  const removeMappingTemplate = useCallback((tplId: string) => {
    deleteTemplate(tplId);
  }, []);

  const dismissDetectedTemplate = useCallback(() => {
    setState((s) => ({ ...s, detectedTemplate: null }));
  }, []);

  void normalizeRow;

  return {
    state,
    reset,
    handleFile,
    updateMapping,
    remapAndRevalidate,
    updateRowField,
    setDefaultStrategy,
    goToStrategy,
    goToReview,
    goToDuplicates,
    updateDuplicateStrategy,
    applyAllDuplicateStrategy,
    runImport,
    back,
    saveMappingTemplate,
    applyMappingTemplate,
    removeMappingTemplate,
    dismissDetectedTemplate,
  };
}
