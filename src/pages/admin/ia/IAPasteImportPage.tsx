import { useCallback, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner, faArrowRight, faTriangleExclamation, faArrowLeft,
  faClipboard, faTableList, faShieldHalved, faClone, faCircleCheck, faSitemap,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { toast } from 'sonner';
import IAPageShell from '@/components/ia/IAPageShell';
import PasteTextZone from '@/components/ia/paste/PasteTextZone';
import ExtractedLeadsBanner from '@/components/ia/paste/ExtractedLeadsBanner';
import ExcelPreviewTable from '@/components/ia/excel/ExcelPreviewTable';
import DefaultStrategyPicker from '@/components/ia/excel/DefaultStrategyPicker';
import RowReviewTable from '@/components/ia/excel/RowReviewTable';
import DuplicateResolver from '@/components/ia/excel/DuplicateResolver';
import ImportProgress from '@/components/ia/excel/ImportProgress';
import ImportResultView from '@/components/ia/excel/ImportResult';
import ImportHistoryBanner from '@/components/ia/excel/ImportHistoryBanner';
import { Button } from '@/components/ui/button';
import { useExcelImport } from '@/hooks/useExcelImport';
import { extractLeadsFromText, leadsToParsedSheet, type ExtractedLead } from '@/services/ia/textParser';
import type { ParsedSheet } from '@/services/ia/excelParser';
import { cn } from '@/lib/utils';

interface StepDef {
  key: string;
  label: string;
  short: string;
  icon: IconDefinition;
}

const STEPS: StepDef[] = [
  { key: 'paste',     label: 'Texto colado',              short: 'Texto',      icon: faClipboard },
  { key: 'preview',   label: 'Leads extraídos pela IA',   short: 'Extração',   icon: faTableList },
  { key: 'strategy',  label: 'Estratégia de duplicados',  short: 'Estratégia', icon: faSitemap },
  { key: 'review',    label: 'Revisão linha-a-linha',     short: 'Revisão',    icon: faShieldHalved },
  { key: 'duplicate', label: 'Análise de duplicados',     short: 'Duplicados', icon: faClone },
  { key: 'confirm',   label: 'Confirmação e relatório',   short: 'Resultado',  icon: faCircleCheck },
];

function stepIndex(s: string): number {
  if (s === 'idle') return 0;
  if (s === 'parsing') return 1;
  if (s === 'mapping') return 1; // pulamos visualmente — IA já mapeou
  if (s === 'strategy') return 2;
  if (s === 'reviewing') return 3;
  if (s === 'resolving_duplicates') return 4;
  return 5;
}

export default function IAPasteImportPage() {
  const [text, setText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedCount, setExtractedCount] = useState<number | null>(null);

  // Holder do ParsedSheet pré-construído — o parseFile do hook só devolve isso.
  const pendingSheetRef = useRef<ParsedSheet | null>(null);

  const parseFile = useCallback(async (): Promise<ParsedSheet> => {
    const sheet = pendingSheetRef.current;
    if (!sheet) throw new Error('Nenhum lead extraído.');
    return sheet;
  }, []);

  const im = useExcelImport({ source: 'paste', parseFile });
  const { state } = im;
  const idx = stepIndex(state.step);
  const currentStep = STEPS[idx];
  const hasNameMapping = state.mappings.some((m) => m.target === 'name');

  const handleExtract = useCallback(async () => {
    if (!text.trim()) return;
    setExtracting(true);
    try {
      const result = await extractLeadsFromText(text);
      if (result.count === 0) {
        toast.error('Nenhum lead identificado no texto. Tente reorganizar a informação.');
        return;
      }
      const sheet = leadsToParsedSheet(result.leads as ExtractedLead[]);
      pendingSheetRef.current = sheet;
      setExtractedCount(result.count);
      // Cria um "file" sintético só para o hook — o parseFile ignora o conteúdo.
      const fakeFile = new File([text], 'texto-colado.txt', { type: 'text/plain' });
      await im.handleFile(fakeFile);
      // Após mapping (auto-resolvido), avançamos direto para strategy
      // Pequeno delay para garantir que o estado de mapping foi commitado.
      setTimeout(() => im.goToStrategy(), 0);
      toast.success(`${result.count} ${result.count === 1 ? 'lead identificado' : 'leads identificados'} pela IA`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao extrair leads';
      toast.error(msg);
    } finally {
      setExtracting(false);
    }
  }, [text, im]);

  const handleReset = useCallback(() => {
    pendingSheetRef.current = null;
    setExtractedCount(null);
    setText('');
    im.reset();
  }, [im]);

  return (
    <IAPageShell
      title="Importação inteligente — Texto colado"
      subtitle="Cole qualquer texto contendo leads (lista, e-mail, conversa, anotação). A IA identifica nome, telefone e contexto, e segue o mesmo fluxo guiado de revisão e dedup."
      breadcrumbs={[{ label: 'Texto colado' }]}
      backTo="/admin/ia"
      actions={
        state.step !== 'idle' && state.step !== 'done' && state.step !== 'error' ? (
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3 mr-1.5" />
            Recomeçar
          </Button>
        ) : null
      }
    >
      <ImportHistoryBanner />

      {/* STEPPER */}
      <div className="mb-6 rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={currentStep.icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                Etapa {idx + 1} de {STEPS.length}
              </div>
              <div className="text-[14px] font-semibold text-foreground truncate">{currentStep.label}</div>
            </div>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground hidden sm:block">
            {Math.round(((idx + 1) / STEPS.length) * 100)}%
          </div>
        </div>

        <ol className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {STEPS.map((s, i) => {
            const active = i === idx;
            const done = i < idx;
            return (
              <li
                key={s.key}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-2 border transition-colors',
                  active && 'border-primary/40 bg-primary/5',
                  done && 'border-success/30 bg-success-soft/40',
                  !active && !done && 'border-border bg-muted/20',
                )}
              >
                <span
                  className={cn(
                    'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold shrink-0',
                    active && 'bg-primary text-primary-foreground',
                    done && 'bg-success text-success-foreground',
                    !active && !done && 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5" /> : i + 1}
                </span>
                <span
                  className={cn(
                    'text-[11px] font-medium truncate',
                    active ? 'text-foreground' : done ? 'text-success' : 'text-muted-foreground',
                  )}
                >
                  {s.short}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* IDLE → textarea */}
      {state.step === 'idle' && (
        <PasteTextZone
          value={text}
          onChange={setText}
          onExtract={handleExtract}
          loading={extracting}
        />
      )}

      {state.step === 'parsing' && (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <FontAwesomeIcon icon={faSpinner} spin className="h-7 w-7 text-primary mb-3" />
          <p className="text-[13.5px] text-foreground font-medium">Estruturando leads extraídos…</p>
        </div>
      )}

      {/* MAPPING (transitório — aviso visual) */}
      {state.step === 'mapping' && state.parsed && (
        <div className="space-y-4">
          {extractedCount !== null && <ExtractedLeadsBanner count={extractedCount} />}
          <ExcelPreviewTable parsed={state.parsed} />
          {!hasNameMapping && (
            <div className="rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-[12.5px] text-warning flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-3.5 w-3.5" />
              Estrutura inválida — nenhum nome detectado.
            </div>
          )}
          <FlowActions
            backLabel="Recomeçar"
            onBack={handleReset}
            nextLabel="Definir estratégia"
            onNext={im.goToStrategy}
            nextDisabled={!hasNameMapping}
          />
        </div>
      )}

      {state.step === 'strategy' && (
        <div className="space-y-4">
          {extractedCount !== null && <ExtractedLeadsBanner count={extractedCount} />}
          <DefaultStrategyPicker value={state.defaultStrategy} onChange={im.setDefaultStrategy} />
          <FlowActions
            backLabel="Recomeçar"
            onBack={handleReset}
            nextLabel="Validar e revisar linhas"
            onNext={im.goToReview}
          />
        </div>
      )}

      {state.step === 'reviewing' && (
        <div className="space-y-4">
          {extractedCount !== null && <ExtractedLeadsBanner count={extractedCount} />}
          <RowReviewTable
            rows={state.normalized}
            duplicates={state.duplicates}
            mappings={state.mappings}
            onUpdateField={im.updateRowField}
            onRemap={im.remapAndRevalidate}
          />
          <FlowActions
            backLabel="Voltar à estratégia"
            onBack={im.back}
            nextLabel={state.duplicates.length > 0 ? 'Resolver duplicados' : 'Confirmar importação'}
            onNext={state.duplicates.length > 0 ? im.goToDuplicates : im.runImport}
          />
        </div>
      )}

      {state.step === 'resolving_duplicates' && (
        <div className="space-y-4">
          <DuplicateResolver
            duplicates={state.duplicates}
            rows={state.normalized}
            onChange={im.updateDuplicateStrategy}
            onApplyAll={im.applyAllDuplicateStrategy}
          />
          <FlowActions
            backLabel="Voltar à revisão"
            onBack={im.back}
            nextLabel="Confirmar importação"
            onNext={im.runImport}
          />
        </div>
      )}

      {state.step === 'importing' && <ImportProgress progress={state.progress} />}

      {state.step === 'done' && state.result && (
        <ImportResultView
          result={state.result}
          filename="texto-colado.txt"
          onRestart={handleReset}
        />
      )}

      {state.step === 'error' && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
          <FontAwesomeIcon icon={faTriangleExclamation} className="h-6 w-6 text-destructive mb-2" />
          <h3 className="text-[15px] font-semibold text-foreground mb-1">Algo deu errado</h3>
          <p className="text-[12.5px] text-muted-foreground mb-4">{state.error ?? 'Erro desconhecido'}</p>
          <Button variant="outline" onClick={handleReset}>Recomeçar</Button>
        </div>
      )}
    </IAPageShell>
  );
}

function FlowActions({
  backLabel, onBack, nextLabel, onNext, nextDisabled,
}: {
  backLabel: string;
  onBack: () => void;
  nextLabel: string;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        {backLabel}
      </Button>
      <Button onClick={onNext} disabled={nextDisabled} className="gap-2">
        {nextLabel}
        <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
