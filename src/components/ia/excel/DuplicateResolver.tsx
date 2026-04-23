import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClone, faArrowRightArrowLeft, faXmark, faPlus, faCodeMerge,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DuplicateMatch, DuplicateStrategy } from '@/services/ia/duplicateDetector';
import type { NormalizedLeadRow } from '@/services/ia/leadNormalizer';
import { formatPhoneDisplay } from '@/lib/ia/phoneFormat';

interface DuplicateResolverProps {
  duplicates: DuplicateMatch[];
  rows: NormalizedLeadRow[];
  onChange: (rowIndex: number, strategy: DuplicateStrategy) => void;
  onApplyAll: (strategy: DuplicateStrategy) => void;
}

const STRATEGIES: { key: DuplicateStrategy; label: string; icon: typeof faXmark; description: string }[] = [
  { key: 'skip', label: 'Ignorar', icon: faXmark, description: 'Manter como está no CRM. A linha da planilha é descartada.' },
  { key: 'update', label: 'Atualizar', icon: faArrowRightArrowLeft, description: 'Sobrescrever os campos do CRM com os dados da planilha.' },
  { key: 'merge', label: 'Mesclar', icon: faCodeMerge, description: 'Preencher apenas os campos vazios + adicionar nota com a importação.' },
];

export default function DuplicateResolver({ duplicates, rows, onChange, onApplyAll }: DuplicateResolverProps) {
  if (duplicates.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <div className="mx-auto h-10 w-10 rounded-full bg-success-soft text-success flex items-center justify-center mb-3">
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
        </div>
        <h4 className="text-[14px] font-semibold text-foreground mb-1">Nenhum duplicado detectado</h4>
        <p className="text-[12.5px] text-muted-foreground max-w-sm mx-auto">
          Todos os registros parecem ser leads novos. Você pode prosseguir com a importação.
        </p>
      </div>
    );
  }

  const rowMap = new Map(rows.map((r) => [r.rowIndex, r]));
  const counts = duplicates.reduce<Record<DuplicateStrategy, number>>(
    (acc, d) => {
      acc[d.strategy] = (acc[d.strategy] ?? 0) + 1;
      return acc;
    },
    { skip: 0, update: 0, merge: 0 },
  );

  return (
    <div className="space-y-3">
      {/* Cabeçalho com ações em lote */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-9 w-9 rounded-lg bg-warning-soft text-warning flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faClone} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h4 className="text-[13.5px] font-semibold text-foreground">
                {duplicates.length} possível{duplicates.length === 1 ? '' : 'is'} duplicado{duplicates.length === 1 ? '' : 's'}
              </h4>
              <p className="text-[11.5px] text-muted-foreground">
                Decida o que fazer com cada lead já existente no CRM.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground mr-1">Aplicar a todos:</span>
            {STRATEGIES.map((s) => (
              <Button
                key={s.key}
                size="sm"
                variant="outline"
                onClick={() => onApplyAll(s.key)}
                className="h-7 text-[11.5px] gap-1.5"
              >
                <FontAwesomeIcon icon={s.icon} className="h-3 w-3" />
                {s.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Resumo das estratégias atuais */}
        <div className="px-4 py-2.5 grid grid-cols-3 gap-2 text-[11.5px] border-b bg-muted/10">
          <StrategySummary label="Ignorar" count={counts.skip} className="text-muted-foreground" />
          <StrategySummary label="Atualizar" count={counts.update} className="text-info" />
          <StrategySummary label="Mesclar" count={counts.merge} className="text-success" />
        </div>

        {/* Lista comparativa */}
        <div className="divide-y max-h-[480px] overflow-y-auto">
          {duplicates.map((d) => {
            const row = rowMap.get(d.rowIndex);
            return (
              <div key={d.rowIndex} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="text-[11px] font-mono text-muted-foreground">
                    Linha {d.rowIndex + 2} da planilha
                  </div>
                </div>
                <div className="grid gap-2.5 md:grid-cols-2 mb-2.5">
                  <CompareCell
                    label="No CRM"
                    name={d.existing.name}
                    phone={d.existing.phone}
                    side="existing"
                  />
                  <CompareCell
                    label="Da planilha"
                    name={row?.data.name ?? '—'}
                    phone={row?.data.phone ?? null}
                    side="incoming"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {STRATEGIES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => onChange(d.rowIndex, s.key)}
                      title={s.description}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all border',
                        d.strategy === s.key
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-card text-foreground/80 border-border hover:border-primary/40 hover:text-foreground',
                      )}
                    >
                      <FontAwesomeIcon icon={s.icon} className="h-3 w-3" />
                      {s.label}
                    </button>
                  ))}
                  <span className="text-[11px] text-muted-foreground ml-1 hidden sm:inline">
                    {STRATEGIES.find((x) => x.key === d.strategy)?.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CompareCell({
  label, name, phone, side,
}: { label: string; name: string; phone: string | null; side: 'existing' | 'incoming' }) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2',
        side === 'existing' ? 'bg-muted/20 border-border' : 'bg-info-soft/50 border-info/20',
      )}
    >
      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">
        {label}
      </div>
      <div className="text-[13px] font-medium text-foreground truncate">{name || '—'}</div>
      <div className="text-[11.5px] text-muted-foreground font-mono truncate">
        {phone ? formatPhoneDisplay(phone) : 'sem telefone'}
      </div>
    </div>
  );
}

function StrategySummary({ label, count, className }: { label: string; count: number; className: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className={cn('font-semibold font-mono', className)}>{count}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
