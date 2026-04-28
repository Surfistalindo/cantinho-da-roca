import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableList, faColumns, faGripHorizontal } from '@fortawesome/free-solid-svg-icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type LeadsView = 'table' | 'kanban' | 'cards';

const OPTIONS: { value: LeadsView; label: string; icon: typeof faTableList; shortcut: string }[] = [
  { value: 'table',  label: 'Tabela', icon: faTableList,      shortcut: '1' },
  { value: 'kanban', label: 'Kanban', icon: faColumns,        shortcut: '2' },
  { value: 'cards',  label: 'Cards',  icon: faGripHorizontal, shortcut: '3' },
];

export default function LeadsViewSwitcher({
  view,
  onChange,
}: {
  view: LeadsView;
  onChange: (v: LeadsView) => void;
}) {
  return (
    <div role="tablist" className="inline-flex items-center rounded-md border border-border p-0.5 bg-card">
      {OPTIONS.map((o) => {
        const active = view === o.value;
        return (
          <Tooltip key={o.value}>
            <TooltipTrigger asChild>
              <button
                role="tab"
                aria-selected={active}
                onClick={() => onChange(o.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-[12px] font-medium transition-colors',
                  active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <FontAwesomeIcon icon={o.icon} className="h-3 w-3" />
                <span className="hidden sm:inline">{o.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {o.label} <kbd className="ml-1 text-[10px] opacity-70">{o.shortcut}</kbd>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
