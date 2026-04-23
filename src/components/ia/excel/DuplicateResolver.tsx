import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { DuplicateMatch, DuplicateStrategy } from '@/services/ia/duplicateDetector';
import type { NormalizedLeadRow } from '@/services/ia/leadNormalizer';

interface DuplicateResolverProps {
  duplicates: DuplicateMatch[];
  rows: NormalizedLeadRow[];
  onChange: (rowIndex: number, strategy: DuplicateStrategy) => void;
  onApplyAll: (strategy: DuplicateStrategy) => void;
}

const STRATEGY_LABEL: Record<DuplicateStrategy, string> = {
  skip: 'Ignorar',
  update: 'Atualizar',
  merge: 'Mesclar',
};

export default function DuplicateResolver({ duplicates, rows, onChange, onApplyAll }: DuplicateResolverProps) {
  if (duplicates.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-[13px] text-muted-foreground">
        Nenhum duplicado detectado. Você pode prosseguir com a importação.
      </div>
    );
  }
  const rowMap = new Map(rows.map((r) => [r.rowIndex, r]));

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-[13px] font-semibold text-foreground">{duplicates.length} duplicado(s) detectado(s)</h4>
          <p className="text-[11.5px] text-muted-foreground">Escolha o que fazer com cada lead já existente no CRM.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] text-muted-foreground">Aplicar a todos:</span>
          <Button size="sm" variant="outline" onClick={() => onApplyAll('skip')} className="h-7 text-[11.5px]">Ignorar</Button>
          <Button size="sm" variant="outline" onClick={() => onApplyAll('update')} className="h-7 text-[11.5px]">Atualizar</Button>
          <Button size="sm" variant="outline" onClick={() => onApplyAll('merge')} className="h-7 text-[11.5px]">Mesclar</Button>
        </div>
      </div>
      <div className="divide-y max-h-[420px] overflow-y-auto">
        {duplicates.map((d) => {
          const row = rowMap.get(d.rowIndex);
          return (
            <div key={d.rowIndex} className="px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-foreground truncate">
                  {row?.data.name ?? d.existing.name}
                </div>
                <div className="text-[11.5px] text-muted-foreground truncate">
                  {row?.data.phone ?? d.existing.phone ?? '—'} · linha {d.rowIndex + 2}
                </div>
              </div>
              <Select value={d.strategy} onValueChange={(v) => onChange(d.rowIndex, v as DuplicateStrategy)}>
                <SelectTrigger className="w-[140px] h-9 text-[12.5px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['skip', 'update', 'merge'] as DuplicateStrategy[]).map((s) => (
                    <SelectItem key={s} value={s}>{STRATEGY_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
