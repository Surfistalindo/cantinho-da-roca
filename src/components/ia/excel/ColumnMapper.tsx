import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faCircleExclamation, faAsterisk } from '@fortawesome/free-solid-svg-icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CRM_FIELD_LABELS, type CrmFieldKey } from '@/lib/ia/fieldDictionary';
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
}

const FIELD_KEYS: CrmFieldKey[] = ['name', 'phone', 'origin', 'product_interest', 'status', 'next_contact_at', 'notes', 'ignore'];
const REQUIRED_FIELDS: CrmFieldKey[] = ['name'];

function ConfidencePill({ confidence, source }: { confidence: number; source: ColumnMapping['suggestedBy'] }) {
  if (source === 'manual') {
    return (
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        Manual
      </span>
    );
  }
  if (source === 'none' || confidence === 0) return null;

  const pct = Math.round(confidence * 100);
  const tone =
    confidence >= 0.85
      ? 'text-success bg-success-soft'
      : confidence >= 0.6
      ? 'text-info bg-info-soft'
      : 'text-warning bg-warning-soft';
  const sourceLabel = source === 'ai' ? 'IA' : 'Auto';
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold', tone)}>
      <FontAwesomeIcon icon={faWandMagicSparkles} className="h-2 w-2" />
      {sourceLabel} · {pct}%
    </span>
  );
}

export default function ColumnMapper({
  mappings, onChange,
  onSaveTemplate, onApplyTemplate, onDeleteTemplate,
  detectedTemplate = null, onDismissDetected,
}: ColumnMapperProps) {
  const used = new Set(mappings.filter((m) => m.target !== 'ignore').map((m) => m.target));

  const mappedCount = mappings.filter((m) => m.target !== 'ignore').length;
  const ignoredCount = mappings.length - mappedCount;
  const missingRequired = REQUIRED_FIELDS.filter((f) => !used.has(f));

  const showTemplateUi = !!(onSaveTemplate && onApplyTemplate && onDeleteTemplate && onDismissDetected);

  return (
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
      <div className="px-4 py-3 border-b bg-muted/20">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-[13px] font-semibold text-foreground">Mapeamento de colunas</h4>
            <p className="text-[11.5px] text-muted-foreground mt-0.5">
              Confira os campos sugeridos e ajuste se necessário.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-success-soft text-success">
              {mappedCount} mapeada{mappedCount === 1 ? '' : 's'}
            </span>
            {ignoredCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                {ignoredCount} ignorada{ignoredCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
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
            </span>
          </div>
        )}
      </div>

      <div className="divide-y max-h-[460px] overflow-y-auto">
        {mappings.map((m) => {
          const isIgnored = m.target === 'ignore';
          return (
            <div
              key={m.source}
              className={cn(
                'px-4 py-3 flex items-center gap-3 transition-colors',
                isIgnored ? 'opacity-60' : 'hover:bg-muted/20',
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-foreground truncate">{m.source}</div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <ConfidencePill confidence={m.confidence} source={m.suggestedBy} />
                  {REQUIRED_FIELDS.includes(m.target) && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-primary bg-primary/10">
                      <FontAwesomeIcon icon={faAsterisk} className="h-2 w-2" />
                      Obrigatório
                    </span>
                  )}
                </div>
              </div>
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
                        {CRM_FIELD_LABELS[k]}
                        {disabled && ' (em uso)'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
