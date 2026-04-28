import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faPause, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { WALeadInfo, WATemplate } from './types';

interface Props {
  lead: WALeadInfo;
  templates: WATemplate[];
}

export default function AutomationStatusCard({ lead, templates }: Props) {
  const total = templates.length;
  const inCadence = lead.cadence_state === 'active' && !lead.cadence_exhausted && !lead.whatsapp_opt_out;

  if (lead.whatsapp_opt_out) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <FontAwesomeIcon icon={faPause} className="h-3 w-3" />
          Automação pausada
        </div>
        <p className="text-[11px] text-muted-foreground">
          Este contato pediu para não receber mensagens automáticas.
        </p>
      </div>
    );
  }

  if (lead.cadence_exhausted) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <FontAwesomeIcon icon={faCircleXmark} className="h-3 w-3 text-muted-foreground" />
          Automação encerrada
        </div>
        <p className="text-[11px] text-muted-foreground">
          As {total} mensagens foram enviadas sem resposta. O lead voltou para a fila manual.
        </p>
      </div>
    );
  }

  if (!inCadence) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-3 space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <FontAwesomeIcon icon={faRobot} className="h-3 w-3" />
          Sem automação ativa
        </div>
        <p className="text-[11px] text-muted-foreground">
          Mude o status do lead para <strong>"Em contato"</strong> para iniciar a régua de boas-vindas.
        </p>
      </div>
    );
  }

  const next = lead.cadence_next_at ? new Date(lead.cadence_next_at) : null;
  const stepNum = lead.cadence_step;
  const nextLabel = next ? format(next, "EEE, d 'de' MMM 'às' HH:mm", { locale: ptBR }) : 'em instantes';

  return (
    <div className="rounded-xl border border-[hsl(var(--honey)/0.45)] bg-[hsl(var(--honey)/0.10)] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--cocoa))]">
          <FontAwesomeIcon icon={faRobot} className="h-3 w-3" />
          Automação ativa
        </div>
        <Badge variant="outline" className="text-[10px] border-[hsl(var(--honey)/0.6)]">
          Etapa {stepNum} de {total}
        </Badge>
      </div>

      <p className="text-[11px] text-foreground/80 leading-relaxed">
        Esta pessoa está na <strong>régua de boas-vindas</strong>.{' '}
        {stepNum === 0
          ? 'A primeira mensagem sai em alguns minutos.'
          : <>A próxima mensagem (etapa {stepNum + 1}) sai automaticamente em <strong>{nextLabel}</strong>.</>}
      </p>

      <div className="flex flex-wrap gap-1 pt-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={
              'h-1.5 flex-1 rounded-full ' +
              (i < stepNum
                ? 'bg-[hsl(var(--secondary))]'
                : i === stepNum
                ? 'bg-[hsl(var(--honey))]'
                : 'bg-border')
            }
            title={`Etapa ${i + 1}`}
          />
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
        <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5 text-success" />
        Se o lead responder, a automação para sozinha.
      </p>
    </div>
  );
}
