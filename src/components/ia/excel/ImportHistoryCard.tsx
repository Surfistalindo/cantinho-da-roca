import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClockRotateLeft, faFileExcel, faSpinner, faCircleCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { useImportHistory } from '@/hooks/useImportHistory';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ImportHistoryCardProps {
  limit?: number;
  /** Renderiza variante compacta (usada na home da IA) */
  compact?: boolean;
}

export default function ImportHistoryCard({ limit = 5, compact = false }: ImportHistoryCardProps) {
  const { logs, loading, error } = useImportHistory(limit);

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/20 flex items-center gap-2.5">
        <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <FontAwesomeIcon icon={faClockRotateLeft} className="h-3.5 w-3.5" />
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-foreground leading-tight">Histórico de importações</h4>
          <p className="text-[11px] text-muted-foreground">As últimas operações desta conta no módulo IA.</p>
        </div>
      </div>

      {loading && (
        <div className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">
          <FontAwesomeIcon icon={faSpinner} spin className="h-3.5 w-3.5 mr-2" />
          Carregando…
        </div>
      )}

      {!loading && error && (
        <div className="px-4 py-6 text-center text-[12.5px] text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="px-4 py-8 text-center">
          <div className="mx-auto h-9 w-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-2">
            <FontAwesomeIcon icon={faFileExcel} className="h-4 w-4" />
          </div>
          <p className="text-[12.5px] font-medium text-foreground">Nenhuma importação ainda</p>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">
            Quando você importar uma planilha, ela aparece aqui.
          </p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <ul className="divide-y">
          {logs.map((l) => {
            const finished = !!l.finished_at;
            const hasErrors = l.error_count > 0;
            return (
              <li key={l.id} className="px-4 py-3 flex items-center gap-3">
                <span
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    !finished
                      ? 'bg-info-soft text-info'
                      : hasErrors
                      ? 'bg-warning-soft text-warning'
                      : 'bg-success-soft text-success'
                  }`}
                >
                  <FontAwesomeIcon
                    icon={!finished ? faSpinner : hasErrors ? faTriangleExclamation : faCircleCheck}
                    className="h-3.5 w-3.5"
                    spin={!finished}
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[12.5px] font-medium text-foreground truncate">
                      {l.filename ?? 'Planilha sem nome'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {l.source}
                    </span>
                  </div>
                  {!compact && (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                      <span>
                        {formatDistanceToNow(new Date(l.started_at), { addSuffix: true, locale: ptBR })}
                      </span>
                      <span>·</span>
                      <span className="font-mono">{l.total_rows} linhas</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
                  <Stat label="Novos" value={l.created_count} className="text-success" />
                  <Stat label="Atual." value={l.updated_count} className="text-info" />
                  <Stat label="Ign." value={l.skipped_count} className="text-muted-foreground" />
                  {l.error_count > 0 && (
                    <Stat label="Erro" value={l.error_count} className="text-destructive" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, className = '' }: { label: string; value: number; className?: string }) {
  return (
    <span className="flex flex-col items-end leading-tight">
      <span className={`text-[12px] font-semibold ${className}`}>{value}</span>
      <span className="text-[9.5px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </span>
  );
}
