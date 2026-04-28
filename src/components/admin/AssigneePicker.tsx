import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { UserPlus, UserMinus } from 'lucide-react';
import InitialsAvatar from './InitialsAvatar';

interface Profile {
  user_id: string;
  name: string | null;
  email: string | null;
}

interface Props {
  triggerLabel?: string;
  triggerSrLabel?: string;
  onSelect: (userId: string | null, name: string | null) => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
  /** quando usado em barra fixa, manter botão pequeno */
  compact?: boolean;
}

export default function AssigneePicker({
  triggerLabel = 'Responsável',
  triggerSrLabel = 'Atribuir responsável',
  onSelect,
  align = 'center',
  side = 'top',
  compact = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || profiles.length > 0) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('user_id, name, email')
      .order('name', { ascending: true })
      .then(({ data }) => {
        setProfiles((data as Profile[]) ?? []);
        setLoading(false);
      });
  }, [open, profiles.length]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={compact ? 'h-8 shrink-0' : 'h-9'}
          aria-label={triggerSrLabel}
        >
          <UserPlus className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">{triggerLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Buscar pessoa..." className="h-9" />
          <CommandList>
            {loading && <div className="py-6 text-center text-xs text-muted-foreground">Carregando...</div>}
            <CommandEmpty>Ninguém encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__unassign__"
                onSelect={() => { setOpen(false); onSelect(null, null); }}
                className="text-xs"
              >
                <UserMinus className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                Remover responsável
              </CommandItem>
              {profiles.map((p) => (
                <CommandItem
                  key={p.user_id}
                  value={`${p.name ?? ''} ${p.email ?? ''}`}
                  onSelect={() => { setOpen(false); onSelect(p.user_id, p.name ?? p.email ?? null); }}
                  className="text-xs gap-2"
                >
                  <InitialsAvatar name={p.name ?? p.email ?? '?'} size="sm" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">{p.name ?? '(sem nome)'}</span>
                    {p.email && <span className="truncate text-[10px] text-muted-foreground">{p.email}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
