import { useCallback, useEffect, useState } from 'react';
import { parseExcelFile, type ParsedSheet } from '@/services/ia/excelParser';
import { aiAssistMap, heuristicMap, type ColumnMapping } from '@/services/ia/columnMapper';
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
  mappings: ColumnMapping[];
  defaultStrategy: DuplicateStrategy;
  normalized: NormalizedLeadRow[];
  duplicates: DuplicateMatch[];
  progress: ImportProgress | null;
  result: ImportResult | null;
  error: string | null;
  detectedTemplate: MappingTemplate | null;
}

const INITIAL: UseExcelImportState = {
  step: 'idle', file: null, parsed: null, mappings: [],
  defaultStrategy: 'skip',
  normalized: [], duplicates: [], progress: null, result: null, error: null,
  detectedTemplate: null,
};

export interface UseExcelImportOptions {
  /** Identificador da origem para logs (default: 'excel'). */
  source?: string;
  /** Parser customizado (default: parseExcelFile). Use para CSV/etc. */
  parseFile?: (file: File) => Promise<ParsedSheet>;
}

export function useExcelImport(options: UseExcelImportOptions = {}) {
  const source = options.source ?? 'excel';
  const parseFile = options.parseFile ?? parseExcelFile;

  const [state, setState] = useState<UseExcelImportState>(() => ({
    ...INITIAL,
    defaultStrategy: loadDefaultStrategy(),
  }));

  // Persist default strategy
  useEffect(() => {
    try { localStorage.setItem(DEFAULT_STRATEGY_KEY, state.defaultStrategy); } catch { /* ignore */ }
  }, [state.defaultStrategy]);

  const reset = useCallback(() => setState({ ...INITIAL, defaultStrategy: loadDefaultStrategy() }), []);

  const handleFile = useCallback(async (file: File) => {
    setState((s) => ({ ...s, step: 'parsing', file, error: null }));
    try {
      const parsed = await parseFile(file);
      let mappings = heuristicMap(parsed.headers);
      // Detecta template salvo
      const match = detectMatchingTemplate(parsed.headers);
      // Tenta IA em background — se falhar, segue com heurística
      try {
        mappings = await aiAssistMap(parsed.headers, parsed.rawRows.slice(0, 3), mappings);
      } catch (e) {
        console.warn('IA mapping skipped', e);
      }
      setState((s) => ({
        ...s, step: 'mapping', parsed, mappings,
        detectedTemplate: match?.template ?? null,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao ler planilha';
      toast.error(msg);
      setState((s) => ({ ...s, step: 'error', error: msg }));
    }
  }, []);

  const updateMapping = useCallback((source: string, target: ColumnMapping['target']) => {
    setState((s) => ({
      ...s,
      mappings: s.mappings.map((m) =>
        m.source === source ? { ...m, target, suggestedBy: 'manual' as const, confidence: 1 } : m,
      ),
    }));
  }, [parseFile]);

  /** Aplica novo mapeamento e re-normaliza todas as linhas (usado no painel inline). */
  const remapAndRevalidate = useCallback((newMappings: ColumnMapping[]) => {
    setState((s) => {
      if (!s.parsed) return s;
      const normalized = normalizeAll(s.parsed.rows, newMappings);
      return { ...s, mappings: newMappings, normalized };
    });
  }, []);

  /** Edita um campo de uma linha já normalizada e revalida só ela. */
  const updateRowField = useCallback((rowIndex: number, field: keyof NormalizedLeadRow['data'], value: unknown) => {
    setState((s) => {
      const target = s.normalized.find((r) => r.rowIndex === rowIndex);
      if (!target || !s.parsed) return s;
      // Reconstrói a linha bruta a partir da edição: usa data atual + override.
      // Aqui aplicamos overwrite direto no objeto data (não passa por normalizeRow porque
      // o usuário já está digitando o valor final desejado).
      const next = s.normalized.map((r) => {
        if (r.rowIndex !== rowIndex) return r;
        const newData = { ...r.data, [field]: value === '' ? null : value } as NormalizedLeadRow['data'];
        // Recalcula erros: nome obrigatório
        const errors = newData.name ? r.errors.filter((e) => e !== 'Nome obrigatório ausente') : (
          r.errors.includes('Nome obrigatório ausente') ? r.errors : [...r.errors, 'Nome obrigatório ausente']
        );
        // Limpa warnings ligados ao campo editado
        const warnings = r.warnings.filter((w) => {
          if (field === 'phone') return !w.toLowerCase().startsWith('telefone');
          if (field === 'next_contact_at') return !w.toLowerCase().startsWith('data');
          if (field === 'status') return !w.toLowerCase().startsWith('status');
          return true;
        });
        return { ...r, data: newData, errors, warnings };
      });
      return { ...s, normalized: next };
    });
  }, []);

  // Strategy
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
      const normalized = normalizeAll(s.parsed.rows, s.mappings);
      return { ...s, step: 'reviewing', normalized };
    });
    // Carrega existentes em background para detectar duplicados
    try {
      const existing = await loadExistingLeads();
      setState((s) => {
        const dups = detectDuplicates(s.normalized, existing, strategy);
        return { ...s, duplicates: dups };
      });
    } catch (e) {
      console.warn('Failed to load existing leads', e);
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
      );
      setState((s) => ({ ...s, step: 'done', result }));
      toast.success(`Importação concluída — ${result.created} criados`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro na importação';
      toast.error(msg);
      setState((s) => ({ ...s, step: 'error', error: msg }));
    }
  }, []);

  const back = useCallback(() => {
    setState((s) => {
      if (s.step === 'mapping') return { ...s, step: 'idle', file: null, parsed: null };
      if (s.step === 'strategy') return { ...s, step: 'mapping' };
      if (s.step === 'reviewing') return { ...s, step: 'strategy' };
      if (s.step === 'resolving_duplicates') return { ...s, step: 'reviewing' };
      return s;
    });
  }, []);

  // Templates
  const saveMappingTemplate = useCallback((name: string) => {
    const tpl = saveTemplate(name, state.mappings.map((m) => ({ source: m.source, target: m.target })));
    toast.success(`Template "${tpl.name}" salvo`);
  }, [state.mappings]);

  const applyMappingTemplate = useCallback((tplId: string) => {
    setState((s) => {
      const tpl = listTemplates().find((t) => t.id === tplId);
      if (!tpl) return s;
      const tplMap = new Map(tpl.mappings.map((m) => [m.source.toLowerCase(), m.target]));
      const next = s.mappings.map((m) => {
        const target = tplMap.get(m.source.toLowerCase());
        if (!target) return m;
        return { ...m, target, suggestedBy: 'manual' as const, confidence: 1 };
      });
      toast.success(`Template "${tpl.name}" aplicado`);
      return { ...s, mappings: next, detectedTemplate: null };
    });
  }, []);

  const removeMappingTemplate = useCallback((tplId: string) => {
    deleteTemplate(tplId);
  }, []);

  const dismissDetectedTemplate = useCallback(() => {
    setState((s) => ({ ...s, detectedTemplate: null }));
  }, []);

  // (referência usada pelo normalizer caso seja necessário)
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
