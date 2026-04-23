import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faClock,
  faTriangleExclamation,
  faMoon,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getCustomerLifecycle, purchaseRecencyLabel, type LifecycleStage } from '@/lib/customerLifecycle';

interface Props {
  lastContactAt: string | null | undefined;
  purchaseDate: string | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

const ICON: Record<LifecycleStage, IconDefinition> = {
  active: faCircleCheck,
  watch: faClock,
  inactive: faTriangleExclamation,
  dormant: faMoon,
};

export default function CustomerLifecycleBadge({
  lastContactAt,
  purchaseDate,
  size = 'md',
  className,
}: Props) {
  const info = getCustomerLifecycle(lastContactAt, purchaseDate);
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-0.5 gap-1.5';
  const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  const tooltip = [
    info.purchaseDays !== null ? `Última compra ${purchaseRecencyLabel(info.purchaseDays)}` : 'Sem data de compra',
    info.contactDays !== null ? `Último contato ${purchaseRecencyLabel(info.contactDays)}` : 'Sem contato registrado',
  ].join(' · ');

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
            <FontAwesomeIcon icon={ICON[info.stage]} className={iconSize} />
            {info.label}
          </span>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
