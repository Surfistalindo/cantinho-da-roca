import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronUp, Trash2, X, Tag } from 'lucide-react';

interface Props {
  count: number;
  onClear: () => void;
  onChangeStatus: (status: string) => void;
  onDelete: () => void;
}

export default function BulkActionsBar({ count, onClear, onChangeStatus, onDelete }: Props) {
  if (count === 0) return null;
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-5 z-50 animate-in slide-in-from-bottom-4 duration-150">
      <div className="flex items-center gap-2 h-12 pl-3 pr-2 rounded-xl border border-border-strong bg-card shadow-elegant">
        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-primary text-primary-foreground text-[12px] font-bold tabular-nums">
          {count}
        </span>
        <span className="text-[13px] text-foreground/90 mr-2">selecionado{count === 1 ? '' : 's'}</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Tag className="h-3.5 w-3.5 mr-1.5" />
              Mudar status
              <ChevronUp className="h-3 w-3 ml-1" />
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

        <Button
          variant="outline"
          size="sm"
          className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Excluir
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear} aria-label="Limpar seleção">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
