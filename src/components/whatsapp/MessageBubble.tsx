import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheck, faCheckDouble, faTriangleExclamation, faClock } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import type { WAMessage } from './types';

interface Props { msg: WAMessage }

export default function MessageBubble({ msg }: Props) {
  const isOut = msg.direction === 'out';
  const isAutomation = isOut && (msg.cadence_step != null || msg.template_name != null);
  const isFailed = msg.status === 'failed';

  const time = format(new Date(msg.created_at), 'HH:mm');

  return (
    <div className={cn('flex w-full', isOut ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'group relative max-w-[78%] sm:max-w-[68%] rounded-2xl px-3.5 py-2.5 shadow-sm',
          'transition-shadow hover:shadow',
          isAutomation && 'bg-[hsl(var(--honey)/0.18)] border border-[hsl(var(--honey)/0.45)] rounded-tr-md',
          !isAutomation && isOut && 'bg-[hsl(var(--secondary)/0.20)] border border-[hsl(var(--secondary)/0.30)] text-foreground rounded-tr-md',
          !isOut && 'bg-card border border-border rounded-tl-md',
          isFailed && 'border-destructive/50 bg-destructive/5',
        )}
      >
        {isAutomation && (
          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-wider font-semibold text-[hsl(var(--cocoa))]">
            <FontAwesomeIcon icon={faRobot} className="h-2.5 w-2.5" />
            Automação · etapa {msg.cadence_step ?? '?'}
          </div>
        )}

        {msg.image_url && (
          <a href={msg.image_url} target="_blank" rel="noreferrer" className="block mb-1.5">
            <img
              src={msg.image_url}
              alt="Anexo"
              className="rounded-lg max-h-64 w-auto object-contain bg-muted"
              loading="lazy"
            />
          </a>
        )}

        {msg.body && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
        )}

        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-muted-foreground">
          <span className="font-mono">{time}</span>
          {isOut && (
            <span title={isFailed ? msg.error_message ?? 'Erro' : msg.status}>
              {msg.status === 'queued' && <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />}
              {msg.status === 'sent' && <FontAwesomeIcon icon={faCheckDouble} className="h-2.5 w-2.5 text-success" />}
              {msg.status === 'delivered' && <FontAwesomeIcon icon={faCheckDouble} className="h-2.5 w-2.5 text-info" />}
              {msg.status === 'failed' && <FontAwesomeIcon icon={faTriangleExclamation} className="h-2.5 w-2.5 text-destructive" />}
              {!['queued', 'sent', 'delivered', 'failed'].includes(msg.status) && (
                <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
              )}
            </span>
          )}
        </div>

        {isFailed && msg.error_message && (
          <div className="mt-1.5 pt-1.5 border-t border-destructive/20 text-[10px] text-destructive font-mono break-all">
            {msg.error_message.slice(0, 120)}
          </div>
        )}
      </div>
    </div>
  );
}
