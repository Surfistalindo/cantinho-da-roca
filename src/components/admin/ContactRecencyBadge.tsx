import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faClock,
  faTriangleExclamation,
  faCircleQuestion,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getContactRecency, type ContactRecency } from '@/lib/contactRecency';

interface Props {
  lastContactAt: string | null | undefined;
  status: string | null | undefined;
  createdAt?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

const ICON: Record<ContactRecency, IconDefinition> = {
  recent: faCircleCheck,
  attention: faClock,
  overdue: faTriangleExclamation,
  never: faCircleQuestion,
};

export default function ContactRecencyBadge({
  lastContactAt,
  status,
  createdAt,
  size = 'md',
  className,
}: Props) {
  const info = getContactRecency(lastContactAt, status, createdAt);
  const icon = ICON[info.level];

  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-0.5 gap-1.5';
  const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  const tooltipText = lastContactAt
    ? `Último contato: ${format(new Date(lastContactAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
    : 'Nenhuma interação registrada';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center rounded-full border font-medium whitespace-nowrap cursor-default',
              sizeClass,
              info.toneClass,
              className,
            )}
          >
            <FontAwesomeIcon icon={icon} className={iconSize} />
            {info.label}
          </span>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
