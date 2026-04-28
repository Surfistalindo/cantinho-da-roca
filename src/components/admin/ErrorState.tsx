import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faRotateRight } from '@fortawesome/free-solid-svg-icons';

interface Props {
  title?: string;
  description?: string;
  onRetry?: () => void;
  /** Mensagem técnica opcional (ex.: error.message) — exibida em fonte pequena. */
  detail?: string;
}

/**
 * Padrão visual único para falhas de carregamento em listagens.
 * Mantém a UI consistente e oferece sempre uma ação de recuperação.
 */
export default function ErrorState({
  title = 'Não foi possível carregar',
  description = 'Verifique sua conexão e tente novamente.',
  detail,
  onRetry,
}: Props) {
  return (
    <div className="text-center py-10 px-6">
      <div className="w-12 h-12 rounded-xl bg-destructive/10 mx-auto mb-3 flex items-center justify-center ring-4 ring-destructive/15">
        <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5 text-destructive" />
      </div>
      <p className="text-[13px] font-semibold text-foreground">{title}</p>
      <p className="text-[12px] text-muted-foreground mt-1 max-w-sm mx-auto leading-snug">
        {description}
      </p>
      {detail && (
        <p className="text-[11px] text-muted-foreground/80 mt-2 font-mono break-all max-w-sm mx-auto">
          {detail}
        </p>
      )}
      {onRetry && (
        <div className="mt-4">
          <Button size="sm" variant="outline" onClick={onRetry}>
            <FontAwesomeIcon icon={faRotateRight} className="w-3 h-3 mr-1.5" />
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}
