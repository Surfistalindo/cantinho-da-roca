import { useCallback, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner, faArrowRight, faTriangleExclamation, faArrowLeft,
  faCloudArrowUp, faTableList, faWandMagicSparkles, faShieldHalved,
  faClone, faCircleCheck, faSitemap,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import IAPageShell from '@/components/ia/IAPageShell';
import CsvDropzone from '@/components/ia/csv/CsvDropzone';
import CsvDetectionBanner from '@/components/ia/csv/CsvDetectionBanner';
import ExcelPreviewTable from '@/components/ia/excel/ExcelPreviewTable';
import ColumnMapper from '@/components/ia/excel/ColumnMapper';
import DefaultStrategyPicker from '@/components/ia/excel/DefaultStrategyPicker';
import RowReviewTable from '@/components/ia/excel/RowReviewTable';
import DuplicateResolver from '@/components/ia/excel/DuplicateResolver';
import ImportProgress from '@/components/ia/excel/ImportProgress';
import ImportResultView from '@/components/ia/excel/ImportResult';
import ImportHistoryBanner from '@/components/ia/excel/ImportHistoryBanner';
import { Button } from '@/components/ui/button';
import { useExcelImport } from '@/hooks/useExcelImport';
import { parseCsvFile, type CsvDetection } from '@/services/ia/csvParser';
import type { ParsedSheet } from '@/services/ia/excelParser';
import { cn } from '@/lib/utils';

interface StepDef {
  key: string;
  label: string;
  short: string;
  icon: IconDefinition;
}

const STEPS: StepDef[] = [
  { key: 'upload',    label: 'Upload do arquivo',         short: 'Upload',     icon: faCloudArrowUp },
  { key: 'preview',   label: 'Detecção e preview',        short: 'Detecção',   icon: faTableList },
  { key: 'mapping',   label: 'Mapeamento inteligente',    short: 'Mapeamento', icon: faWandMagicSparkles },
  { key: 'strategy',  label: 'Estratégia de duplicados',  short: 'Estratégia', icon: faSitemap },
  { key: 'review',    label: 'Revisão linha-a-linha',     short: 'Revisão',    icon: faShieldHalved },
  { key: 'duplicate', label: 'Análise de duplicados',     short: 'Duplicados', icon: faClone },
  { key: 'confirm',   label: 'Confirmação e relatório',   short: 'Resultado',  icon: faCircleCheck },
];

function stepIndex(s: string): number {
  if (s === 'idle') return 0;
  if (s === 'parsing') return 1;
  if (s === 'mapping') return 2;
  if (s === 'strategy') return 3;
  if (s === 'reviewing') return 4;
  if (s === 'resolving_duplicates') return 5;
  return 6;
}

export default function IACsvImportPage() {
  const [detection, setDetection] = useState<CsvDetection | null>(null);

  // Parser com captura de detecção (delimitador/encoding) p/ banner
  const parseFile = useCallback(async (file: File): Promise<ParsedSheet> => {
    const parsed = await parseCsvFile(file);
    setDetection(parsed.detection);
    // Devolve só o ParsedSheet padrão — banner usa state local
    const { detection: _d, ...rest } = parsed;
    return rest;
  }, []);

  const im = useExcelImport({ source: 'csv', parseFile });
  const { state } = im;
  const idx = stepIndex(state.step);
  const hasNameMapping = state.mappings.some((m) => m.target === 'name');
  const currentStep = STEPS[idx];

  const handleReset = useCallback(() => {
    setDetection(null);
    im.reset();
  }, [im]);

  return (
    <IAPageShell
      title="Importação inteligente — CSV"
      subtitle="Envie seu arquivo .csv. A IA detecta delimitador e codificação automaticamente, então segue o mesmo fluxo guiado da Excel."
      breadcrumbs={[{ label: 'CSV avançado' }]}
      backTo="/admin/ia"
      actions={
        state.step !== 'idle' && state.step !== 'done' && state.step !== 'error' ? (
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3 mr-1.5" />
            Cancelar
          </Button>
        ) : null
      }
    >
      <ImportHistoryBanner />

      {/* ============= STEPPER ============= */}
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

        <ol className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
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

      {/* Banner de detecção (após parse) */}
      {detection && state.step !== 'idle' && state.step !== 'parsing' && state.parsed && (
        <CsvDetectionBanner
          delimiterLabel={detection.delimiterLabel}
          encoding={detection.encoding}
          filename={state.file?.name}
          totalRows={state.parsed.totalRows}
        />
      )}

      {state.step === 'idle' && <CsvDropzone onFile={im.handleFile} />}

      {state.step === 'parsing' && (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <FontAwesomeIcon icon={faSpinner} spin className="h-7 w-7 text-primary mb-3" />
          <p className="text-[13.5px] text-foreground font-medium">Detectando formato e lendo CSV…</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Identificando delimitador e codificação automaticamente.
          </p>
        </div>
      )}

      {state.step === 'mapping' && state.parsed && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
            <ExcelPreviewTable parsed={state.parsed} />
            <ColumnMapper
              mappings={state.mappings}
              onChange={im.updateMapping}
              onSaveTemplate={im.saveMappingTemplate}
              onApplyTemplate={im.applyMappingTemplate}
              onDeleteTemplate={im.removeMappingTemplate}
              detectedTemplate={state.detectedTemplate}
              onDismissDetected={im.dismissDetectedTemplate}
            />
          </div>
          {!hasNameMapping && (
            <div className="rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-[12.5px] text-warning flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-3.5 w-3.5" />
              Você precisa mapear ao menos uma coluna como <strong>Nome</strong> para continuar.
            </div>
          )}
          <FlowActions
            backLabel="Trocar arquivo"
            onBack={im.back}
            nextLabel="Definir estratégia"
            onNext={im.goToStrategy}
            nextDisabled={!hasNameMapping}
          />
        </div>
      )}

      {state.step === 'strategy' && (
        <div className="space-y-4">
          <DefaultStrategyPicker value={state.defaultStrategy} onChange={im.setDefaultStrategy} />
          <FlowActions
            backLabel="Voltar ao mapeamento"
            onBack={im.back}
            nextLabel="Validar e revisar linhas"
            onNext={im.goToReview}
          />
        </div>
      )}

      {state.step === 'reviewing' && (
        <div className="space-y-4">
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
          filename={state.file?.name}
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
