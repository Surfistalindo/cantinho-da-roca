import { useCallback, useState } from 'react';
import { parseExcelFile, type ParsedSheet } from '@/services/ia/excelParser';
import { aiAssistMap, heuristicMap, type ColumnMapping } from '@/services/ia/columnMapper';
import { normalizeAll, type NormalizedLeadRow } from '@/services/ia/leadNormalizer';
import { detectDuplicates, loadExistingLeads, type DuplicateMatch } from '@/services/ia/duplicateDetector';
import { executeImport, type ImportProgress, type ImportResult } from '@/services/ia/importExecutor';
import { toast } from 'sonner';

export type ImportStep =
  | 'idle'
  | 'parsing'
  | 'mapping'
  | 'reviewing'
  | 'resolving_duplicates'
  | 'importing'
  | 'done'
  | 'error';

export interface UseExcelImportState {
  step: ImportStep;
  file: File | null;
  parsed: ParsedSheet | null;
  mappings: ColumnMapping[];
  normalized: NormalizedLeadRow[];
  duplicates: DuplicateMatch[];
  progress: ImportProgress | null;
  result: ImportResult | null;
  error: string | null;
}

const INITIAL: UseExcelImportState = {
  step: 'idle', file: null, parsed: null, mappings: [],
  normalized: [], duplicates: [], progress: null, result: null, error: null,
};

export function useExcelImport() {
  const [state, setState] = useState<UseExcelImportState>(INITIAL);

  const reset = useCallback(() => setState(INITIAL), []);

  const handleFile = useCallback(async (file: File) => {
    setState((s) => ({ ...s, step: 'parsing', file, error: null }));
    try {
      const parsed = await parseExcelFile(file);
      let mappings = heuristicMap(parsed.headers);
      // Tenta IA em background — se falhar, segue com heurística
      try {
        mappings = await aiAssistMap(parsed.headers, parsed.rawRows.slice(0, 3), mappings);
      } catch (e) {
        console.warn('IA mapping skipped', e);
      }
      setState((s) => ({ ...s, step: 'mapping', parsed, mappings }));
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
  }, []);

  const goToReview = useCallback(async () => {
    setState((s) => {
      if (!s.parsed) return s;
      const normalized = normalizeAll(s.parsed.rows, s.mappings);
      return { ...s, step: 'reviewing', normalized };
    });
    // Carrega existentes em background para detectar duplicados
    try {
      const existing = await loadExistingLeads();
      setState((s) => {
        const dups = detectDuplicates(s.normalized, existing);
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
    setState((s) => ({ ...s, step: 'importing', progress: { processed: 0, total: s.normalized.length } }));
    try {
      const current = await new Promise<UseExcelImportState>((resolve) => {
        setState((s) => { resolve(s); return s; });
      });
      const result = await executeImport(
        current.normalized,
        current.duplicates,
        current.file?.name,
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
      if (s.step === 'reviewing') return { ...s, step: 'mapping' };
      if (s.step === 'resolving_duplicates') return { ...s, step: 'reviewing' };
      return s;
    });
  }, []);

  return {
    state,
    reset,
    handleFile,
    updateMapping,
    goToReview,
    goToDuplicates,
    updateDuplicateStrategy,
    applyAllDuplicateStrategy,
    runImport,
    back,
  };
}
