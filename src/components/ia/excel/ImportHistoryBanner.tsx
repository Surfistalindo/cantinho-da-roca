import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCircleCheck, faTriangleExclamation, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { useImportHistory } from '@/hooks/useImportHistory';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Banner compacto exibido no topo da tela do Excel em todas as etapas.
 * Mostra importação em andamento com barra de progresso + últimas concluídas.
 * Atualiza em tempo real via Supabase Realtime.
 */
export default function ImportHistoryBanner() {
  const { inProgress, recent, loading } = useImportHistory(8);

  if (loading && inProgress.length === 0 && recent.length === 0) return null;
  if (inProgress.length === 0 && recent.length === 0) return null;

  const running = inProgress[0];
  const lastDone = recent.slice(0, 3);

  return (
    <div className="rounded-xl border bg-card overflow-hidden mb-4">
      {/* Importação em andamento */}
      {running && (
        <RunningBar log={running} />
      )}

      {/* Últimas concluídas (chips) */}
      {lastDone.length > 0 && (
        <div className="px-3 py-2 flex items-center gap-2 flex-wrap border-t bg-muted/10">
          <span className="text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground">
            Últimas:
          </span>
          {lastDone.map((l) => {
            const hasErr = l.error_count > 0;
            return (
              <div
                key={l.id}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px]',
                  hasErr
                    ? 'border-warning/30 bg-warning-soft/40 text-warning'
                    : 'border-success/30 bg-success-soft/40 text-success',
                )}
                title={`${l.created_count} criados · ${l.updated_count} atualizados · ${l.skipped_count} ignorados · ${l.error_count} erros`}
              >
                <FontAwesomeIcon
                  icon={hasErr ? faTriangleExclamation : faCircleCheck}
                  className="h-2.5 w-2.5"
                />
                <span className="font-medium truncate max-w-[140px]">{l.filename ?? 'planilha'}</span>
                <span className="opacity-70 hidden sm:inline">
                  · {formatDistanceToNow(new Date(l.started_at), { addSuffix: true, locale: ptBR })}
                </span>
                <span className="font-mono opacity-80">
                  +{l.created_count}{l.updated_count > 0 && ` ~${l.updated_count}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RunningBar({ log }: { log: ReturnType<typeof useImportHistory>['inProgress'][number] }) {
  const total = log.total_rows || 1;
  const processed = log.created_count + log.updated_count + log.skipped_count + log.error_count;
  const pct = Math.min(100, Math.round((processed / total) * 100));
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3 mb-2">
        <span className="h-7 w-7 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faSpinner} spin className="h-3.5 w-3.5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] font-semibold text-foreground truncate">
              Importando: {log.filename ?? 'planilha'}
            </span>
            <FontAwesomeIcon icon={faFileExcel} className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            {processed} de {total} linhas processadas
          </div>
        </div>
        <span className="text-[13px] font-semibold font-mono text-info shrink-0">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-info transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
