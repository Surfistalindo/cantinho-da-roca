import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { INTERACTION_TYPES, getInteractionTypeConfig } from '@/lib/interactionTypes';

interface InteractionRow {
  id: string;
  contact_type: string;
  description: string;
  interaction_date: string;
  created_by: string;
  authorName?: string | null;
}

interface Props {
  entityId: string;
  entityType: 'lead' | 'customer';
}

export default function InteractionTimeline({ entityId, entityType }: Props) {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
  const [newType, setNewType] = useState('observação');
  const [newContent, setNewContent] = useState('');
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    const column = entityType === 'lead' ? 'lead_id' : 'customer_id';
    const { data } = await supabase
      .from('interactions')
      .select('id, contact_type, description, interaction_date, created_by')
      .eq(column, entityId)
      .order('interaction_date', { ascending: false });

    const rows = (data as InteractionRow[]) ?? [];

    // Resolve nomes via profiles em uma única query
    const userIds = Array.from(new Set(rows.map((r) => r.created_by).filter(Boolean)));
    let nameMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);
      nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.name ?? '']));
    }
    setInteractions(rows.map((r) => ({ ...r, authorName: nameMap[r.created_by] || null })));
  }, [entityId, entityType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRealtimeTable('interactions', fetchData);

  const addInteraction = async () => {
    if (!user || !newContent.trim()) return;
    setSending(true);
    const payload =
      entityType === 'lead'
        ? { lead_id: entityId, created_by: user.id, contact_type: newType, description: newContent.trim() }
        : { customer_id: entityId, created_by: user.id, contact_type: newType, description: newContent.trim() };

    const { error } = await supabase.from('interactions').insert(payload);
    setSending(false);
    if (error) {
      toast.error('Erro ao salvar interação');
      return;
    }
    setNewContent('');
    toast.success('Interação registrada');

    // Atualiza last_contact_at na entidade
    const table = entityType === 'lead' ? 'leads' : 'customers';
    await supabase.from(table).update({ last_contact_at: new Date().toISOString() }).eq('id', entityId);
  };

  return (
    <div className="space-y-5">
      {/* Form de nova interação */}
      <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
        <Select value={newType} onValueChange={setNewType}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTERACTION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={t.icon} className="h-3.5 w-3.5" />
                  {t.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          placeholder="Descreva a interação..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="min-h-[70px] resize-none"
        />
        <Button onClick={addInteraction} disabled={sending || !newContent.trim()} className="w-full" size="sm">
          <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5 mr-1.5" />
          Registrar interação
        </Button>
      </div>

      {/* Timeline */}
      {interactions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma interação registrada ainda.</p>
          <p className="text-xs text-muted-foreground mt-1">Registre o primeiro contato acima.</p>
        </div>
      ) : (
        <TooltipProvider delayDuration={200}>
          <ol className="relative ml-3 border-l border-border space-y-5 pl-6 pt-1">
            {interactions.map((item) => {
              const cfg = getInteractionTypeConfig(item.contact_type);
              return (
                <li key={item.id} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background',
                      cfg.dotClass,
                    )}
                  >
                    <FontAwesomeIcon icon={cfg.icon} className="h-3 w-3" />
                  </span>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
                        {cfg.label}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground cursor-default">
                            {formatDistanceToNow(new Date(item.interaction_date), { locale: ptBR, addSuffix: true })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(new Date(item.interaction_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      por <span className="font-medium">{item.authorName || 'Sistema'}</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </TooltipProvider>
      )}
    </div>
  );
}
