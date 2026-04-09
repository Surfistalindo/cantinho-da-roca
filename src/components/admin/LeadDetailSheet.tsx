import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import LeadStatusBadge from './LeadStatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, MessageCircle, Phone, FileText } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  product_interest: string | null;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  next_contact_at: string | null;
  notes: string | null;
}

interface Interaction {
  id: string;
  type: string;
  content: string;
  created_at: string;
}

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const interactionTypes = [
  { value: 'mensagem', label: 'Mensagem', icon: MessageCircle },
  { value: 'ligação', label: 'Ligação', icon: Phone },
  { value: 'observação', label: 'Observação', icon: FileText },
];

export default function LeadDetailSheet({ lead, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('observação');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (lead && open) fetchInteractions();
  }, [lead, open]);

  const fetchInteractions = async () => {
    if (!lead) return;
    const { data } = await supabase
      .from('interactions')
      .select('id, type, content, created_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false });
    setInteractions((data as Interaction[]) ?? []);
  };

  const addInteraction = async () => {
    if (!lead || !user || !newContent.trim()) return;
    setSending(true);
    const { error } = await supabase.from('interactions').insert({
      lead_id: lead.id,
      user_id: user.id,
      type: newType,
      content: newContent.trim(),
    });
    setSending(false);
    if (error) {
      toast.error('Erro ao salvar interação');
      return;
    }
    setNewContent('');
    toast.success('Interação registrada');
    fetchInteractions();
  };

  if (!lead) return null;

  const typeIcon = (type: string) => {
    const t = interactionTypes.find((i) => i.value === type);
    return t ? <t.icon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />;
  };

  const info = [
    { label: 'Nome', value: lead.name },
    { label: 'Telefone', value: lead.phone },
    { label: 'Origem', value: lead.origin },
    { label: 'Interesse', value: lead.product_interest },
    { label: 'Status', value: <LeadStatusBadge status={lead.status} /> },
    { label: 'Criado em', value: format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) },
    { label: 'Último contato', value: lead.last_contact_at ? format(new Date(lead.last_contact_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : null },
    { label: 'Próximo contato', value: lead.next_contact_at ? format(new Date(lead.next_contact_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : null },
    { label: 'Observações', value: lead.notes },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading">{lead.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {info.map((i) =>
            i.value ? (
              <div key={i.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{i.label}</span>
                <span className="font-medium text-right">{i.value}</span>
              </div>
            ) : null,
          )}
        </div>

        {lead.phone && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => {
              const clean = lead.phone!.replace(/\D/g, '');
              const num = clean.startsWith('55') ? clean : `55${clean}`;
              window.open(`https://wa.me/${num}`, '_blank');
            }}
          >
            <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
            Contato via WhatsApp
          </Button>
        )}

        <div className="mt-8">
          <h4 className="font-semibold mb-3">Histórico de Interações</h4>

          <div className="space-y-2 mb-4">
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {interactionTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Textarea
                placeholder="Registrar interação..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[60px]"
              />
              <Button size="icon" onClick={addInteraction} disabled={sending || !newContent.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {interactions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma interação registrada.</p>
            )}
            {interactions.map((n) => (
              <div key={n.id} className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  {typeIcon(n.type)}
                  <span className="text-xs font-medium capitalize">{n.type}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(n.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
