import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles, faCircleExclamation, faAsterisk, faCircleInfo,
  faRobot, faSlash,
} from '@fortawesome/free-solid-svg-icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CRM_FIELD_LABELS, CRM_FIELD_DESCRIPTIONS, type CrmFieldKey,
} from '@/lib/ia/fieldDictionary';
import type { ColumnMapping } from '@/services/ia/columnMapper';
import { cn } from '@/lib/utils';
import MappingTemplateManager from './MappingTemplateManager';
import type { MappingTemplate } from '@/services/ia/mappingTemplates';

interface ColumnMapperProps {
  mappings: ColumnMapping[];
  onChange: (source: string, target: CrmFieldKey) => void;
  onSaveTemplate?: (name: string) => void;
  onApplyTemplate?: (id: string) => void;
  onDeleteTemplate?: (id: string) => void;
  detectedTemplate?: MappingTemplate | null;
  onDismissDetected?: () => void;
  /** Amostras por header para mostrar exemplos reais sob cada coluna. */
  samplesByHeader?: Record<string, unknown[]>;
}

const FIELD_KEYS: CrmFieldKey[] = ['name', 'phone', 'origin', 'product_interest', 'status', 'next_contact_at', 'notes', 'ignore'];
const REQUIRED_FIELDS: CrmFieldKey[] = ['name'];

function truncate(s: string, n = 28): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function formatSamples(samples: unknown[] | undefined): string[] {
  if (!samples) return [];
  return samples
    .map((v) => (v == null ? '' : String(v)).trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((s) => truncate(s));
}

function ConfidencePill({ mapping }: { mapping: ColumnMapping }) {
  const { confidence, suggestedBy, target } = mapping;

  if (suggestedBy === 'manual') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-foreground bg-muted cursor-help">
            Manual
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px] text-xs">
          Você definiu este mapeamento manualmente.
        </TooltipContent>
      </Tooltip>
    );
  }

  if (suggestedBy === 'none' || confidence === 0) {
    if (target === 'ignore') {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-muted-foreground bg-muted cursor-help">
              <FontAwesomeIcon icon={faSlash} className="h-2 w-2" />
              Ignorada
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px] text-xs">
            A IA não reconheceu esta coluna. Ela não será importada — escolha um campo se quiser usá-la.
          </TooltipContent>
        </Tooltip>
      );
    }
    return null;
  }

  const pct = Math.round(confidence * 100);
  const tone =
    confidence >= 0.85
      ? 'text-success bg-success-soft'
      : confidence >= 0.6
      ? 'text-info bg-info-soft'
      : 'text-warning bg-warning-soft';

  const isAi = suggestedBy === 'ai';
  const sourceLabel = isAi ? 'IA' : 'Auto';
  const sourceIcon = isAi ? faRobot : faWandMagicSparkles;

  const explanation = isAi
    ? `Sugerido pela IA analisando o conteúdo da coluna. Confiança: ${pct}%.`
    : `Casou com sinônimos de "${CRM_FIELD_LABELS[target]}" no dicionário. Confiança: ${pct}%.`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold cursor-help', tone)}>
          <FontAwesomeIcon icon={sourceIcon} className="h-2 w-2" />
          {sourceLabel} · {pct}%
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[280px] text-xs leading-relaxed">
        {explanation}
        {confidence < 0.6 && (
          <div className="mt-1 text-warning-foreground/80">
            Confira se o campo escolhido está correto.
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export default function ColumnMapper({
  mappings, onChange,
  onSaveTemplate, onApplyTemplate, onDeleteTemplate,
  detectedTemplate = null, onDismissDetected,
  samplesByHeader,
}: ColumnMapperProps) {
  const used = new Set(mappings.filter((m) => m.target !== 'ignore').map((m) => m.target));

  const total = mappings.length;
  const mappedCount = mappings.filter((m) => m.target !== 'ignore').length;
  const ignoredCount = total - mappedCount;
  const missingRequired = REQUIRED_FIELDS.filter((f) => !used.has(f));

  const showTemplateUi = !!(onSaveTemplate && onApplyTemplate && onDeleteTemplate && onDismissDetected);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="rounded-2xl border bg-card overflow-hidden">
        {showTemplateUi && (
          <div className="px-4 py-3 border-b bg-card">
            <MappingTemplateManager
              mappings={mappings}
              onSave={onSaveTemplate!}
              onApply={onApplyTemplate!}
              onDelete={onDeleteTemplate!}
              detectedTemplate={detectedTemplate}
              onDismissDetected={onDismissDetected!}
            />
          </div>
        )}

        {/* ============= HEADER ============= */}
        <div className="px-4 py-3 border-b bg-muted/20">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                Mapeamento de colunas
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                      <FontAwesomeIcon icon={faCircleInfo} className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px] text-xs leading-relaxed">
                    Cada linha abaixo representa uma <strong>coluna da sua planilha</strong>.
                    Escolha qual <strong>campo do CRM</strong> ela deve preencher.
                    A IA já sugeriu — você só precisa conferir.
                  </TooltipContent>
                </Tooltip>
              </h4>
              <p className="text-[11.5px] text-muted-foreground mt-0.5">
                Confira os campos sugeridos e ajuste se necessário.
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-success-soft text-success cursor-help">
                    {mappedCount}/{total} mapeadas
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {mappedCount} colunas serão importadas para o CRM.
                </TooltipContent>
              </Tooltip>
              {ignoredCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground cursor-help">
                      {ignoredCount} ignorada{ignoredCount === 1 ? '' : 's'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    {ignoredCount} {ignoredCount === 1 ? 'coluna não será importada' : 'colunas não serão importadas'}.
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* ============= MINI-LEGENDA ============= */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Auto ≥ 85% — alta confiança
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-info" />
              60–84% — confira
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              &lt; 60% — revise
            </span>
            <span className="inline-flex items-center gap-1">
              <FontAwesomeIcon icon={faRobot} className="h-2 w-2" />
              IA — sugerido pelo modelo
            </span>
            <span className="inline-flex items-center gap-1 text-primary">
              <FontAwesomeIcon icon={faAsterisk} className="h-2 w-2" />
              Obrigatório
            </span>
          </div>

          {missingRequired.length > 0 && (
            <div className="mt-3 flex items-start gap-2 text-[11.5px] text-warning bg-warning-soft border border-warning/30 rounded-lg px-2.5 py-1.5">
              <FontAwesomeIcon icon={faCircleExclamation} className="h-3 w-3 mt-0.5 shrink-0" />
              <span>
                Falta mapear:{' '}
                {missingRequired.map((f, i) => (
                  <span key={f} className="font-semibold">
                    {CRM_FIELD_LABELS[f]}
                    {i < missingRequired.length - 1 ? ', ' : ''}
                  </span>
                ))}
                . Sem isso, a importação não pode continuar.
              </span>
            </div>
          )}
        </div>

        {/* ============= LISTA DE COLUNAS ============= */}
        <div className="divide-y max-h-[460px] overflow-y-auto">
          {mappings.map((m) => {
            const isIgnored = m.target === 'ignore';
            const samples = formatSamples(samplesByHeader?.[m.source]);
            const isRequired = REQUIRED_FIELDS.includes(m.target);

            return (
              <div
                key={m.source}
                className={cn(
                  'px-4 py-3 flex items-start gap-3 transition-colors',
                  isIgnored ? 'opacity-70' : 'hover:bg-muted/20',
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-foreground truncate">
                    {m.source}
                  </div>

                  {/* Amostras de valores reais */}
                  {samples.length > 0 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-[10.5px] font-mono text-muted-foreground/80 mt-0.5 truncate cursor-help">
                          {samples.map((s, i) => (
                            <span key={i}>
                              {i > 0 && <span className="mx-1 text-muted-foreground/40">·</span>}
                              <span>"{s}"</span>
                            </span>
                          ))}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] text-xs">
                        Amostras reais desta coluna na sua planilha.
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="text-[10.5px] italic text-muted-foreground/60 mt-0.5">
                      sem amostras de valores
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <ConfidencePill mapping={m} />
                    {isRequired && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-primary bg-primary/10 cursor-help">
                            <FontAwesomeIcon icon={faAsterisk} className="h-2 w-2" />
                            Obrigatório
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          Este campo é necessário para importar.
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {isIgnored && (
                    <div className="text-[10.5px] text-muted-foreground/80 mt-1.5">
                      Esta coluna não será importada.
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Select value={m.target} onValueChange={(v) => onChange(m.source, v as CrmFieldKey)}>
                          <SelectTrigger
                            className={cn(
                              'w-[180px] h-9 text-[12.5px]',
                              isIgnored && 'text-muted-foreground border-dashed',
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_KEYS.map((k) => {
                              const disabled = k !== 'ignore' && k !== m.target && used.has(k);
                              return (
                                <SelectItem key={k} value={k} disabled={disabled}>
                                  <div className="flex flex-col gap-0.5 py-0.5">
                                    <span className="text-[12.5px] font-medium">
                                      {CRM_FIELD_LABELS[k]}
                                      {disabled && (
                                        <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                                          (em uso)
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[10.5px] text-muted-foreground leading-snug">
                                      {CRM_FIELD_DESCRIPTIONS[k]}
                                    </span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[260px] text-xs">
                      <div className="font-semibold mb-0.5">{CRM_FIELD_LABELS[m.target]}</div>
                      <div className="text-muted-foreground">{CRM_FIELD_DESCRIPTIONS[m.target]}</div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
