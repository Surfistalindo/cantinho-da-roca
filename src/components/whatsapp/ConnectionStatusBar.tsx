import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faRobot, faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { cn } from '@/lib/utils';

interface Props {
  isConfigured: boolean;
  isAdmin: boolean;
  todayStats: { sent: number; replied: number; failed: number };
  onOpenSetup: () => void;
  onOpenAutomations: () => void;
}

export default function ConnectionStatusBar({
  isConfigured, isAdmin, todayStats, onOpenSetup, onOpenAutomations,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-card border-b border-border">
      {/* Esquerda: identidade + status */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-lg bg-[#25D366]/10 flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 text-[#25D366]" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display-warm text-base font-bold truncate">WhatsApp Studio</h1>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 text-[11px] font-semibold mt-0.5',
              isConfigured ? 'text-success' : 'text-warning',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isConfigured ? 'bg-success animate-pulse' : 'bg-warning',
              )}
            />
            {isConfigured ? 'Conectado' : 'Desconectado · clique em Configurar'}
          </div>
        </div>
      </div>

      {/* Direita: métricas + ações */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="px-2 py-1 rounded-md bg-success-soft text-success font-semibold">
            <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5 mr-1" />
            {todayStats.sent} enviadas
          </span>
          <span className="px-2 py-1 rounded-md bg-info-soft text-info font-semibold">
            ← {todayStats.replied} respondidas
          </span>
          {todayStats.failed > 0 && (
            <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive font-semibold">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-2.5 w-2.5 mr-1" />
              {todayStats.failed}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={onOpenAutomations}>
            <FontAwesomeIcon icon={faRobot} className="h-3 w-3 mr-1.5" />
            Automações
          </Button>
          {isAdmin && (
            <Button size="sm" variant={isConfigured ? 'outline' : 'default'} onClick={onOpenSetup}>
              <FontAwesomeIcon icon={faGear} className="h-3 w-3 mr-1.5" />
              Configurar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
