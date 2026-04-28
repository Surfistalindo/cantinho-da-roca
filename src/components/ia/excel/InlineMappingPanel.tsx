import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders, faRotate, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CRM_FIELD_LABELS, CRM_FIELD_DESCRIPTIONS, type CrmFieldKey,
} from '@/lib/ia/fieldDictionary';
import type { ColumnMapping } from '@/services/ia/columnMapper';
import { cn } from '@/lib/utils';

interface InlineMappingPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappings: ColumnMapping[];
  onApply: (mappings: ColumnMapping[]) => void;
  /** Amostras por header para mostrar exemplos reais sob cada coluna. */
  samplesByHeader?: Record<string, unknown[]>;
}

const FIELD_KEYS: CrmFieldKey[] = ['name', 'phone', 'origin', 'product_interest', 'status', 'next_contact_at', 'notes', 'ignore'];

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

export default function InlineMappingPanel({ open, onOpenChange, mappings, onApply, samplesByHeader }: InlineMappingPanelProps) {
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
    <TooltipProvider delayDuration={150}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faSliders} className="h-4 w-4 text-primary" />
              Ajustar mapeamento
            </SheetTitle>
            <SheetDescription>
              Altere o destino de cada coluna e clique em <strong>Aplicar e revalidar</strong>{' '}
              — todas as linhas serão recalculadas sem precisar voltar à etapa anterior.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-2">
            {draft.filter((m) => m.source !== '__sheet').map((m) => {
              const isIgnored = m.target === 'ignore';
              const samples = formatSamples(samplesByHeader?.[m.source]);
              return (
                <div
                  key={m.source}
                  className={cn(
                    'rounded-lg border p-2.5',
                    isIgnored ? 'bg-muted/20 border-dashed opacity-70' : 'bg-card',
                  )}
                >
                  <div className="text-[12px] font-medium text-foreground truncate">{m.source}</div>
                  {samples.length > 0 ? (
                    <div className="text-[10px] font-mono text-muted-foreground/80 mt-0.5 truncate">
                      {samples.map((s, i) => (
                        <span key={i}>
                          {i > 0 && <span className="mx-1 text-muted-foreground/40">·</span>}
                          <span>"{s}"</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="mt-2">
                        <Select value={m.target} onValueChange={(v) => update(m.source, v as CrmFieldKey)}>
                          <SelectTrigger className="h-8 text-[12px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_KEYS.map((k) => {
                              const disabled = k !== 'ignore' && k !== m.target && used.has(k);
                              return (
                                <SelectItem key={k} value={k} disabled={disabled}>
                                  <div className="flex flex-col gap-0.5 py-0.5">
                                    <span className="text-[12px] font-medium">
                                      {CRM_FIELD_LABELS[k]}
                                      {disabled && (
                                        <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                                          (em uso)
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground leading-snug">
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
                    <TooltipContent side="left" className="max-w-[240px] text-xs">
                      <div className="font-semibold mb-0.5">{CRM_FIELD_LABELS[m.target]}</div>
                      <div className="text-muted-foreground">{CRM_FIELD_DESCRIPTIONS[m.target]}</div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>

          <SheetFooter className="mt-5 flex-col gap-2 sm:flex-col">
            {!hasName && (
              <p className="text-[11.5px] text-warning flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCircleInfo} className="h-3 w-3" />
                Mapeie ao menos uma coluna como <strong>Nome</strong> para revalidar.
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
    </TooltipProvider>
  );
}
