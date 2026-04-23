import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faArrowRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import IAPageShell from '@/components/ia/IAPageShell';
import ExcelDropzone from '@/components/ia/excel/ExcelDropzone';
import ExcelPreviewTable from '@/components/ia/excel/ExcelPreviewTable';
import ColumnMapper from '@/components/ia/excel/ColumnMapper';
import ImportSummary from '@/components/ia/excel/ImportSummary';
import DuplicateResolver from '@/components/ia/excel/DuplicateResolver';
import ImportProgress from '@/components/ia/excel/ImportProgress';
import ImportResultView from '@/components/ia/excel/ImportResult';
import { Button } from '@/components/ui/button';
import { useExcelImport } from '@/hooks/useExcelImport';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'upload', label: 'Upload' },
  { key: 'mapping', label: 'Mapeamento' },
  { key: 'review', label: 'Revisão' },
  { key: 'import', label: 'Confirmação' },
];

function stepIndex(s: string): number {
  if (s === 'idle' || s === 'parsing') return 0;
  if (s === 'mapping') return 1;
  if (s === 'reviewing' || s === 'resolving_duplicates') return 2;
  return 3;
}

export default function IAExcelImportPage() {
  const im = useExcelImport();
  const { state } = im;
  const idx = stepIndex(state.step);
  const hasNameMapping = state.mappings.some((m) => m.target === 'name');

  return (
    <IAPageShell
      title="Importação inteligente — Excel"
      subtitle="Envie sua planilha. A IA interpreta as colunas, valida e prepara a importação."
      breadcrumbs={[{ label: 'Excel' }]}
      backTo="/admin/ia"
    >
      {/* Stepper */}
      <div className="mb-6 rounded-xl border bg-card p-4">
        <ol className="flex items-center justify-between gap-2">
          {STEPS.map((s, i) => {
            const active = i === idx;
            const done = i < idx;
            return (
              <li key={s.key} className="flex-1 flex items-center gap-2 min-w-0">
                <span className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-mono font-semibold shrink-0 border',
                  active && 'bg-primary text-primary-foreground border-primary',
                  done && 'bg-success text-success-foreground border-success',
                  !active && !done && 'bg-muted text-muted-foreground border-border',
                )}>{i + 1}</span>
                <span className={cn(
                  'text-[12.5px] font-medium truncate',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}>{s.label}</span>
                {i < STEPS.length - 1 && (
                  <span className="flex-1 h-px bg-border ml-2 hidden sm:block" />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {state.step === 'idle' && <ExcelDropzone onFile={im.handleFile} />}

      {state.step === 'parsing' && (
        <div className="rounded-xl border bg-card p-12 text-center">
          <FontAwesomeIcon icon={faSpinner} spin className="h-7 w-7 text-primary mb-3" />
          <p className="text-[13.5px] text-foreground font-medium">Lendo e interpretando planilha…</p>
          <p className="text-[12px] text-muted-foreground mt-1">A IA está sugerindo o mapeamento de colunas.</p>
        </div>
      )}

      {state.step === 'mapping' && state.parsed && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
            <ExcelPreviewTable parsed={state.parsed} />
            <ColumnMapper mappings={state.mappings} onChange={im.updateMapping} />
          </div>
          {!hasNameMapping && (
            <div className="rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-[12.5px] text-warning flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-3.5 w-3.5" />
              Você precisa mapear ao menos uma coluna como <strong>Nome</strong> para continuar.
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={im.back}>Trocar arquivo</Button>
            <Button onClick={im.goToReview} disabled={!hasNameMapping}>
              Revisar dados
              <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {state.step === 'reviewing' && (
        <div className="space-y-4">
          <ImportSummary rows={state.normalized} duplicates={state.duplicates} />
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={im.back}>Voltar</Button>
            <Button onClick={state.duplicates.length > 0 ? im.goToDuplicates : im.runImport}>
              {state.duplicates.length > 0 ? 'Resolver duplicados' : 'Confirmar importação'}
              <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5 ml-2" />
            </Button>
          </div>
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
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={im.back}>Voltar</Button>
            <Button onClick={im.runImport}>
              Confirmar importação
              <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {state.step === 'importing' && <ImportProgress progress={state.progress} />}

      {state.step === 'done' && state.result && (
        <ImportResultView result={state.result} onRestart={im.reset} />
      )}

      {state.step === 'error' && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
          <FontAwesomeIcon icon={faTriangleExclamation} className="h-6 w-6 text-destructive mb-2" />
          <h3 className="text-[15px] font-semibold text-foreground mb-1">Algo deu errado</h3>
          <p className="text-[12.5px] text-muted-foreground mb-4">{state.error ?? 'Erro desconhecido'}</p>
          <Button variant="outline" onClick={im.reset}>Recomeçar</Button>
        </div>
      )}
    </IAPageShell>
  );
}
