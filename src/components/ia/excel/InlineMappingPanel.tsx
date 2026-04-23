import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders, faRotate } from '@fortawesome/free-solid-svg-icons';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CRM_FIELD_LABELS, type CrmFieldKey } from '@/lib/ia/fieldDictionary';
import type { ColumnMapping } from '@/services/ia/columnMapper';
import { cn } from '@/lib/utils';

interface InlineMappingPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappings: ColumnMapping[];
  onApply: (mappings: ColumnMapping[]) => void;
}

const FIELD_KEYS: CrmFieldKey[] = ['name', 'phone', 'origin', 'product_interest', 'status', 'next_contact_at', 'notes', 'ignore'];

export default function InlineMappingPanel({ open, onOpenChange, mappings, onApply }: InlineMappingPanelProps) {
  const [draft, setDraft] = useState<ColumnMapping[]>(mappings);

  useEffect(() => { if (open) setDraft(mappings); }, [open, mappings]);

  const update = (source: string, target: CrmFieldKey) => {
    setDraft((prev) => prev.map((m) =>
      m.source === source ? { ...m, target, suggestedBy: 'manual' as const, confidence: 1 } : m,
    ));
  };

  const used = new Set(draft.filter((m) => m.target !== 'ignore').map((m) => m.target));
  const hasName = used.has('name');

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faSliders} className="h-4 w-4 text-primary" />
            Ajustar mapeamento
          </SheetTitle>
          <SheetDescription>
            Altere o mapeamento das colunas e revalide todas as linhas sem voltar à etapa anterior.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {draft.filter((m) => m.source !== '__sheet').map((m) => {
            const isIgnored = m.target === 'ignore';
            return (
              <div
                key={m.source}
                className={cn(
                  'rounded-lg border p-2.5',
                  isIgnored ? 'bg-muted/20 border-dashed opacity-70' : 'bg-card',
                )}
              >
                <div className="text-[12px] font-medium text-foreground truncate mb-1.5">{m.source}</div>
                <Select value={m.target} onValueChange={(v) => update(m.source, v as CrmFieldKey)}>
                  <SelectTrigger className="h-8 text-[12px]">
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

        <SheetFooter className="mt-5 flex-col gap-2 sm:flex-col">
          {!hasName && (
            <p className="text-[11.5px] text-warning">
              Mapeie ao menos uma coluna como "Nome" para revalidar.
            </p>
          )}
          <div className="flex items-center gap-2 w-full">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleApply} disabled={!hasName} className="flex-1 gap-1.5">
              <FontAwesomeIcon icon={faRotate} className="h-3 w-3" />
              Aplicar e revalidar
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
