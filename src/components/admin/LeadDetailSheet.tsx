import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import LeadStatusBadge from './LeadStatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  origem: string | null;
  interesse: string | null;
  status: string;
  created_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeadDetailSheet({ lead, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (lead && open) fetchNotes();
  }, [lead, open]);

  const fetchNotes = async () => {
    if (!lead) return;
    const { data } = await supabase
      .from('lead_notes')
      .select('id, content, created_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false });
    setNotes(data ?? []);
  };

  const addNote = async () => {
    if (!lead || !user || !newNote.trim()) return;
    setSending(true);
    const { error } = await supabase.from('lead_notes').insert({
      lead_id: lead.id,
      user_id: user.id,
      content: newNote.trim(),
    });
    setSending(false);
    if (error) {
      toast.error('Erro ao salvar observação');
      return;
    }
    setNewNote('');
    fetchNotes();
  };

  if (!lead) return null;

  const info = [
    { label: 'Nome', value: lead.name },
    { label: 'Telefone', value: lead.phone },
    { label: 'E-mail', value: lead.email },
    { label: 'Origem', value: lead.origem },
    { label: 'Interesse', value: lead.interesse },
    { label: 'Status', value: <LeadStatusBadge status={lead.status} /> },
    { label: 'Criado em', value: format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) },
    { label: 'UTM Source', value: lead.utm_source },
    { label: 'UTM Medium', value: lead.utm_medium },
    { label: 'UTM Campaign', value: lead.utm_campaign },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{lead.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {info.map((i) =>
            i.value ? (
              <div key={i.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{i.label}</span>
                <span className="font-medium text-right">{i.value}</span>
              </div>
            ) : null,
          )}
        </div>

        <div className="mt-8">
          <h4 className="font-semibold mb-3">Observações</h4>
          <div className="flex gap-2 mb-4">
            <Textarea
              placeholder="Adicionar observação..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[60px]"
            />
            <Button size="icon" onClick={addNote} disabled={sending || !newNote.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {notes.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma observação ainda.</p>
            )}
            {notes.map((n) => (
              <div key={n.id} className="bg-muted rounded-md p-3">
                <p className="text-sm">{n.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(n.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
