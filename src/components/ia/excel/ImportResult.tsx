import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faRotateLeft, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { ImportResult } from '@/services/ia/importExecutor';

export default function ImportResultView({ result, onRestart }: { result: ImportResult; onRestart: () => void }) {
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-success-soft text-success flex items-center justify-center mb-5">
        <FontAwesomeIcon icon={faCircleCheck} className="h-8 w-8" />
      </div>
      <h3 className="text-[18px] font-semibold text-foreground mb-1">Importação concluída</h3>
      <p className="text-[13px] text-muted-foreground mb-6">Sua planilha foi processada com sucesso.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-6">
        <Stat label="Criados" value={result.created} accent="text-success" />
        <Stat label="Atualizados" value={result.updated} accent="text-info" />
        <Stat label="Ignorados" value={result.skipped} accent="text-muted-foreground" />
        <Stat label="Erros" value={result.errors} accent="text-destructive" />
      </div>

      {result.errorDetails.length > 0 && (
        <details className="text-left max-w-2xl mx-auto rounded-xl border bg-muted/20 mb-6">
          <summary className="px-4 py-2.5 cursor-pointer text-[12.5px] font-medium text-foreground">
            Ver detalhes dos {result.errorDetails.length} erros
          </summary>
          <div className="border-t max-h-48 overflow-y-auto divide-y">
            {result.errorDetails.map((e, i) => (
              <div key={i} className="px-4 py-2 text-[11.5px]">
                <span className="font-mono text-muted-foreground">Linha {e.rowIndex + 2}:</span>{' '}
                <span className="text-destructive">{e.message}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Button asChild>
          <Link to="/admin/leads">
            <FontAwesomeIcon icon={faUsers} className="h-3.5 w-3.5 mr-2" />
            Ver leads
          </Link>
        </Button>
        <Button variant="outline" onClick={onRestart}>
          <FontAwesomeIcon icon={faRotateLeft} className="h-3.5 w-3.5 mr-2" />
          Importar outra planilha
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className={`text-[24px] font-semibold font-mono leading-none ${accent}`}>{value}</div>
      <div className="text-[11.5px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}
