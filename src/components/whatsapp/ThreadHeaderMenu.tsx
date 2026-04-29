import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEllipsisVertical, faCheck, faPause, faPlay, faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WALeadInfo } from './types';

interface Props {
  lead: WALeadInfo;
  onChanged: () => void;
}

export default function ThreadHeaderMenu({ lead, onChanged }: Props) {
  const navigate = useNavigate();

  const markRead = () => {
    try {
      localStorage.setItem(`wa-read-${lead.id}`, String(Date.now()));
      toast.success('Conversa marcada como lida');
    } catch { /* ignore */ }
  };

  const togglePause = async () => {
    const next = lead.cadence_state === 'paused' ? 'active' : 'paused';
    const { error } = await supabase
      .from('leads')
      .update({ cadence_state: next })
      .eq('id', lead.id);
    if (error) toast.error(error.message);
    else {
      toast.success(next === 'paused' ? 'Automação pausada' : 'Automação retomada');
      onChanged();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-9 w-9" title="Mais ações">
          <FontAwesomeIcon icon={faEllipsisVertical} className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={markRead}>
          <FontAwesomeIcon icon={faCheck} className="h-3 w-3 mr-2" />
          Marcar como lida
        </DropdownMenuItem>
        <DropdownMenuItem onClick={togglePause}>
          <FontAwesomeIcon
            icon={lead.cadence_state === 'paused' ? faPlay : faPause}
            className="h-3 w-3 mr-2"
          />
          {lead.cadence_state === 'paused' ? 'Retomar automação' : 'Pausar automação'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/admin/leads?lead=${lead.id}`)}>
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3 w-3 mr-2" />
          Abrir painel do lead
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
