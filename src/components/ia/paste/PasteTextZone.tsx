import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboard, faWandMagicSparkles, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onExtract: () => void;
  loading: boolean;
  maxChars?: number;
}

const EXAMPLE = `Maria Silva — (11) 98888-7777, interesse em queijo minas, veio pelo Instagram
João Pereira: 11 91234-5678 — quer doce de leite, indicação da Ana
Cliente Carla, 11999990000, perguntou sobre cestas`;

export default function PasteTextZone({ value, onChange, onExtract, loading, maxChars = 20_000 }: Props) {
  const len = value.length;
  const over = len > maxChars;
  const canExtract = !loading && value.trim().length > 0 && !over;

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5 space-y-3">
      <div className="flex items-start gap-2.5">
        <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faClipboard} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-foreground">Cole seu texto</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Lista, e-mail, conversa, anotação — a IA identifica os leads e estrutura para você.
          </p>
        </div>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Exemplo:\n${EXAMPLE}`}
        rows={12}
        className="font-mono text-[12.5px] resize-y min-h-[240px]"
        disabled={loading}
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className={cn(
          'text-[11px] font-mono',
          over ? 'text-destructive' : 'text-muted-foreground',
        )}>
          {len.toLocaleString('pt-BR')} / {maxChars.toLocaleString('pt-BR')} caracteres
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            disabled={loading || len === 0}
            className="text-muted-foreground"
          >
            Limpar
          </Button>
          <Button onClick={onExtract} disabled={!canExtract} className="gap-2">
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="h-3.5 w-3.5" />
                Extraindo…
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3.5 w-3.5" />
                Extrair leads com IA
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
