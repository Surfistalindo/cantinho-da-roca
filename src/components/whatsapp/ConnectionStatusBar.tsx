import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    <TooltipProvider delayDuration={200}>
      <div
        data-tour="wa-status-bar"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-card border-b border-border"
      >
        {/* Esquerda: identidade + status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-[#25D366]/10 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 text-[#25D366]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display-warm text-base font-bold truncate">WhatsApp Studio</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'inline-flex items-center gap-1.5 text-[11px] font-semibold mt-0.5 cursor-help',
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
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px] max-w-[240px]">
                {isConfigured
                  ? 'Instância Z-API ativa. Mensagens podem ser enviadas e recebidas.'
                  : 'Sem instância Z-API configurada. Um administrador precisa abrir "Configurar" e seguir os 3 passos.'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Direita: métricas + ações */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="px-2 py-1 rounded-md bg-success-soft text-success font-semibold cursor-help">
                  <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5 mr-1" />
                  {todayStats.sent} enviadas
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-[11px]">Mensagens com status “sent” retornado pela Z-API hoje.</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <span className="px-2 py-1 rounded-md bg-info-soft text-info font-semibold cursor-help">
                  ← {todayStats.replied} respondidas
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-[11px]">Mensagens recebidas (entrantes) hoje, somando todos os contatos.</TooltipContent>
            </Tooltip>

            {todayStats.failed > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive font-semibold cursor-help">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="h-2.5 w-2.5 mr-1" />
                    {todayStats.failed}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-[11px] max-w-[220px]">
                  Mensagens que falharam (número inválido, instância caída, bloqueio Z-API…). Verifique nos logs do contato.
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={onOpenAutomations}>
                  <FontAwesomeIcon icon={faRobot} className="h-3 w-3 mr-1.5" />
                  Automações
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-[11px]">Editar a régua de mensagens automáticas (templates e ordem).</TooltipContent>
            </Tooltip>

            {isAdmin ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant={isConfigured ? 'outline' : 'default'} onClick={onOpenSetup}>
                    <FontAwesomeIcon icon={faGear} className="h-3 w-3 mr-1.5" />
                    Configurar
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-[11px]">Conectar uma instância Z-API ao CRM em 3 passos.</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button size="sm" variant="outline" disabled>
                      <FontAwesomeIcon icon={faGear} className="h-3 w-3 mr-1.5" />
                      Configurar
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-[11px]">Apenas administradores podem configurar a conexão.</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
