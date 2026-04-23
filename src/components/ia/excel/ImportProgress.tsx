import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import type { ImportProgress as Progress } from '@/services/ia/importExecutor';
import { Progress as ProgressBar } from '@/components/ui/progress';

export default function ImportProgress({ progress }: { progress: Progress | null }) {
  const pct = progress && progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
        <FontAwesomeIcon icon={faSpinner} spin className="h-6 w-6" />
      </div>
      <h3 className="text-[16px] font-semibold text-foreground mb-1">Importando para o CRM…</h3>
      <p className="text-[13px] text-muted-foreground mb-5" aria-live="polite">
        {progress ? `${progress.processed} de ${progress.total} processados` : 'Preparando…'}
      </p>
      <div className="max-w-md mx-auto">
        <ProgressBar value={pct} className="h-2" />
        <div className="text-[11.5px] text-muted-foreground mt-2 font-mono">{pct}%</div>
      </div>
    </div>
  );
}
