import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ChevronUp, Trash2, X, Tag, CalendarPlus, Copy, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  count: number;
  onClear: () => void;
  onChangeStatus: (status: string) => void;
  onDelete: () => void;
  onScheduleFollowup?: (date: Date) => void;
  onCopyPhones?: () => void;
  onExport?: () => void;
}

export default function BulkActionsBar({
  count, onClear, onChangeStatus, onDelete,
  onScheduleFollowup, onCopyPhones, onExport,
}: Props) {
  const [calOpen, setCalOpen] = useState(false);
  if (count === 0) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-3 sm:bottom-5 z-50 animate-in slide-in-from-bottom-4 duration-150 max-w-[calc(100vw-1rem)]">
      <div className="flex items-center gap-1.5 sm:gap-2 h-12 pl-3 pr-2 rounded-xl border border-border-strong bg-card shadow-elegant overflow-x-auto">
        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-primary text-primary-foreground text-[12px] font-bold tabular-nums shrink-0">
          {count}
        </span>
        <span className="text-[13px] text-foreground/90 mr-1 sm:mr-2 shrink-0 hidden sm:inline">
          selecionado{count === 1 ? '' : 's'}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 shrink-0">
              <Tag className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Status</span>
              <ChevronUp className="h-3 w-3 ml-1 hidden sm:inline" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-48">
            <DropdownMenuLabel className="text-[11px]">Aplicar a {count} lead{count === 1 ? '' : 's'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {APP_CONFIG.leadStatuses.map((s) => (
              <DropdownMenuItem key={s.value} onClick={() => onChangeStatus(s.value)} className="text-xs">
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {onScheduleFollowup && (
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 shrink-0">
                <CalendarPlus className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Follow-up</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="center" className="w-auto p-0">
              <Calendar
                mode="single"
                onSelect={(d) => { if (d) { onScheduleFollowup(d); setCalOpen(false); } }}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className={cn('p-3 pointer-events-auto')}
              />
            </PopoverContent>
          </Popover>
        )}

        {onCopyPhones && (
          <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={onCopyPhones}>
            <Copy className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Copiar fones</span>
          </Button>
        )}

        {onExport && (
          <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={onExport}>
            <Download className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive shrink-0"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Excluir</span>
        </Button>

        <div className="w-px h-6 bg-border mx-1 shrink-0" />

        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClear} aria-label="Limpar seleção">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
