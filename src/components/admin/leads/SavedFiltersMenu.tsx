import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faTrashCan, faPlus, faBookmark } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import type { RecencyFilter, PriorityFilter } from '@/components/admin/LeadFilters';

export interface SavedLeadFilter {
  id: string;
  name: string;
  search: string;
  status: string;
  origin: string;
  recency: RecencyFilter;
  priority: PriorityFilter;
}

const STORAGE_KEY = 'crm:leads:savedFilters';

function loadSaved(): SavedLeadFilter[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}
function persist(list: SavedLeadFilter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

interface Props {
  current: Omit<SavedLeadFilter, 'id' | 'name'>;
  onApply: (f: SavedLeadFilter) => void;
}

export default function SavedFiltersMenu({ current, onApply }: Props) {
  const [saved, setSaved] = useState<SavedLeadFilter[]>(loadSaved);
  const [openDialog, setOpenDialog] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => { persist(saved); }, [saved]);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const item: SavedLeadFilter = { id: crypto.randomUUID(), name: trimmed, ...current };
    setSaved((p) => [item, ...p].slice(0, 12));
    setName('');
    setOpenDialog(false);
    toast.success(`Filtro "${trimmed}" salvo`);
  };

  const remove = (id: string) => {
    setSaved((p) => p.filter((s) => s.id !== id));
    toast.success('Filtro removido');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-[12px]">
            <FontAwesomeIcon icon={faBookmark} className="h-3 w-3 mr-1.5" />
            Filtros salvos
            {saved.length > 0 && (
              <span className="ml-1.5 px-1 rounded bg-muted text-[10px] tabular-nums">{saved.length}</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-[11px]">Meus filtros</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {saved.length === 0 && (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              Nenhum filtro salvo ainda.
            </div>
          )}
          {saved.map((f) => (
            <DropdownMenuItem
              key={f.id}
              onClick={() => onApply(f)}
              className="text-xs flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2 min-w-0">
                <FontAwesomeIcon icon={faStar} className="h-3 w-3 text-honey shrink-0" />
                <span className="truncate">{f.name}</span>
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); remove(f.id); }}
                className="text-muted-foreground hover:text-destructive p-0.5"
                aria-label={`Remover ${f.name}`}
              >
                <FontAwesomeIcon icon={faTrashCan} className="h-3 w-3" />
              </button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenDialog(true)} className="text-xs">
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3 mr-2" />
            Salvar filtros atuais
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nomear filtro</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Ex.: Quentes da semana"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!name.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
