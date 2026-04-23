import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faUsers } from '@fortawesome/free-solid-svg-icons';

interface Props {
  count: number;
}

export default function ExtractedLeadsBanner({ count }: Props) {
  return (
    <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3">
      <span className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
        <FontAwesomeIcon icon={faWandMagicSparkles} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-semibold text-foreground flex items-center gap-1.5">
          <FontAwesomeIcon icon={faUsers} className="h-3 w-3 text-muted-foreground" />
          {count} {count === 1 ? 'lead extraído' : 'leads extraídos'} pela IA
        </div>
        <div className="text-[11.5px] text-muted-foreground mt-0.5">
          Revise os campos abaixo, ajuste se necessário, defina a estratégia de duplicados e confirme a importação.
        </div>
      </div>
    </div>
  );
}
