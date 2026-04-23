import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CRM_FIELD_LABELS, type CrmFieldKey } from '@/lib/ia/fieldDictionary';
import type { ColumnMapping } from '@/services/ia/columnMapper';
import { cn } from '@/lib/utils';

interface ColumnMapperProps {
  mappings: ColumnMapping[];
  onChange: (source: string, target: CrmFieldKey) => void;
}

const FIELD_KEYS: CrmFieldKey[] = ['name', 'phone', 'origin', 'product_interest', 'status', 'next_contact_at', 'notes', 'ignore'];

export default function ColumnMapper({ mappings, onChange }: ColumnMapperProps) {
  const used = new Set(mappings.filter((m) => m.target !== 'ignore').map((m) => m.target));

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <h4 className="text-[13px] font-semibold text-foreground">Mapeamento de colunas</h4>
        <p className="text-[11.5px] text-muted-foreground mt-0.5">Confira os campos sugeridos e ajuste se necessário.</p>
      </div>
      <div className="divide-y max-h-[420px] overflow-y-auto">
        {mappings.map((m) => {
          const isAuto = m.suggestedBy === 'ai' || m.suggestedBy === 'heuristic';
          return (
            <div key={m.source} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-foreground truncate">{m.source}</div>
                {isAuto && (
                  <div className="flex items-center gap-1 mt-0.5 text-[10.5px] text-primary/80">
                    <FontAwesomeIcon icon={faWandMagicSparkles} className="h-2.5 w-2.5" />
                    {m.suggestedBy === 'ai' ? 'Sugerido pela IA' : 'Sugerido automaticamente'}
                  </div>
                )}
              </div>
              <Select value={m.target} onValueChange={(v) => onChange(m.source, v as CrmFieldKey)}>
                <SelectTrigger className={cn('w-[180px] h-9 text-[12.5px]', m.target === 'ignore' && 'text-muted-foreground')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_KEYS.map((k) => {
                    const disabled = k !== 'ignore' && k !== m.target && used.has(k);
                    return (
                      <SelectItem key={k} value={k} disabled={disabled}>
                        {CRM_FIELD_LABELS[k]}{disabled && ' (em uso)'}
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
