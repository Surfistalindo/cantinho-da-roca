import { forwardRef, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faUser } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import ToolCallTrace from './ToolCallTrace';
import type { ChatTurn } from '@/hooks/useAIChat';

interface Props {
  turn: ChatTurn;
}

const MessageBubbleBase = forwardRef<HTMLDivElement, Props>(function MessageBubbleBase({ turn }, ref) {
  const isUser = turn.role === 'user';
  return (
    <div ref={ref} className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
        )}
      >
        <FontAwesomeIcon icon={isUser ? faUser : faRobot} className="h-3.5 w-3.5" />
      </div>
      <div className={cn('flex flex-col gap-1.5 min-w-0 max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
        {turn.trace && turn.trace.length > 0 && !isUser && (
          <ToolCallTrace trace={turn.trace} />
        )}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed break-words',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted/40 border border-border text-foreground rounded-tl-sm',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{turn.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-headings:mb-1 prose-headings:mt-3 prose-table:text-[12px] prose-th:px-2 prose-td:px-2">
              {turn.content ? (
                <ReactMarkdown>{turn.content}</ReactMarkdown>
              ) : turn.pending ? (
                <span className="inline-flex gap-1 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '120ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '240ms' }} />
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const MessageBubble = memo(MessageBubbleBase);
export default MessageBubble;
