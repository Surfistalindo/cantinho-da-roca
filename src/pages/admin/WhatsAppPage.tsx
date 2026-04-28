import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  faPaperPlane, faImage, faCommentDots, faCircleCheck, faCircleXmark,
  faGear, faClockRotateLeft, faRobot, faKey, faRotate,
} from '@fortawesome/free-solid-svg-icons';
import PageHeader from '@/components/admin/PageHeader';

interface WhatsAppMessage {
  id: string;
  direction: string;
  status: string;
  message_type: string;
  body: string | null;
  image_url: string | null;
  template_name: string | null;
  cadence_step: number | null;
  lead_id: string | null;
  error_message: string | null;
  created_at: string;
}

interface WhatsAppTemplate {
  id: string;
  meta_name: string;
  name: string;
  body_preview: string;
  step_order: number | null;
  delay_hours: number | null;
  is_active: boolean;
}

interface CadenceLead {
  id: string;
  name: string;
  phone: string | null;
  cadence_step: number;
  cadence_state: string;
  cadence_next_at: string | null;
  cadence_exhausted: boolean;
  whatsapp_opt_out: boolean;
}

interface ConfigRow {
  instance_id: string | null;
  is_configured: boolean;
  updated_at: string;
}

export default function WhatsAppPage() {
  const { isAdmin } = useUserRole();
  const [tab, setTab] = useState('send');

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        description="Envie mensagens via Z-API, gerencie a régua de cadência e visualize o histórico."
        icon={<FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5 text-success" />}
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="send" className="gap-2">
            <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" /> Enviar
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FontAwesomeIcon icon={faClockRotateLeft} className="h-3.5 w-3.5" /> Histórico
          </TabsTrigger>
          <TabsTrigger value="cadence" className="gap-2">
            <FontAwesomeIcon icon={faRobot} className="h-3.5 w-3.5" /> Cadência
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2" disabled={!isAdmin}>
            <FontAwesomeIcon icon={faGear} className="h-3.5 w-3.5" /> Configuração
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send"><SendTab /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
        <TabsContent value="cadence"><CadenceTab /></TabsContent>
        <TabsContent value="config">{isAdmin && <ConfigTab />}</TabsContent>
      </Tabs>
    </div>
  );
}

// ====================== ENVIAR ======================
function SendTab() {
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'text' | 'image'>('text');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);
  const [imgValid, setImgValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (type !== 'image' || !imageUrl.trim()) { setImgValid(null); return; }
    setImgValid(null);
    const img = new Image();
    img.onload = () => setImgValid(true);
    img.onerror = () => setImgValid(false);
    img.src = imageUrl;
  }, [imageUrl, type]);

  const send = async () => {
    if (!phone.trim()) { toast.error('Informe o número'); return; }
    if (type === 'text' && !message.trim()) { toast.error('Escreva a mensagem'); return; }
    if (type === 'image' && !imageUrl.trim()) { toast.error('Informe URL da imagem'); return; }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('wa-send', {
        body: { phone, type, message, imageUrl, caption },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || 'Falha no envio');
      } else {
        toast.success('Mensagem enviada!');
        setMessage(''); setCaption('');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-6 max-w-3xl space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="wa-phone">Número (com DDD)</Label>
          <Input id="wa-phone" placeholder="71991026884"
            value={phone} onChange={(e) => setPhone(e.target.value)} />
          <p className="text-[11px] text-muted-foreground">Z-API adiciona o código 55 automaticamente.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as 'text' | 'image')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text"><FontAwesomeIcon icon={faCommentDots} className="h-3 w-3 mr-2" />Texto</SelectItem>
              <SelectItem value="image"><FontAwesomeIcon icon={faImage} className="h-3 w-3 mr-2" />Imagem</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {type === 'text' ? (
        <div className="space-y-1.5">
          <Label htmlFor="wa-msg">Mensagem</Label>
          <Textarea id="wa-msg" rows={6} placeholder="Olá! Tudo bem?"
            value={message} onChange={(e) => setMessage(e.target.value)} />
          <p className="text-[11px] text-muted-foreground">{message.length} caracteres</p>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="wa-img">URL pública da imagem</Label>
            <Input id="wa-img" placeholder="https://..."
              value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            {imgValid === false && <p className="text-[11px] text-destructive">URL inválida ou não acessível.</p>}
            {imgValid === true && (
              <div className="mt-2 rounded-lg border border-border overflow-hidden bg-muted/30 max-w-xs">
                <img src={imageUrl} alt="Preview" className="w-full h-auto max-h-64 object-contain" />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wa-caption">Legenda (caption)</Label>
            <Textarea id="wa-caption" rows={3} placeholder="Confira nossos produtos!"
              value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
        </>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={send} disabled={sending} className="bg-[#25D366] hover:bg-[#20bd5a] text-white">
          <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5 mr-2" />
          {sending ? 'Enviando...' : 'Enviar agora'}
        </Button>
      </div>
    </Card>
  );
}

// ====================== HISTÓRICO ======================
function HistoryTab() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setMessages((data as WhatsAppMessage[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold">Últimas 100 mensagens</h3>
        <Button size="sm" variant="ghost" onClick={load}>
          <FontAwesomeIcon icon={faRotate} className="h-3 w-3 mr-1.5" /> Atualizar
        </Button>
      </div>
      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : messages.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma mensagem registrada ainda.</div>
      ) : (
        <div className="divide-y divide-border">
          {messages.map((m) => (
            <div key={m.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={m.status === 'sent' ? faCircleCheck : faCircleXmark}
                    className={`h-3.5 w-3.5 ${m.status === 'sent' ? 'text-success' : 'text-destructive'}`}
                  />
                  <span className="text-xs font-medium uppercase tracking-wide">{m.direction}</span>
                  <Badge variant="outline" className="text-[10px]">{m.message_type}</Badge>
                  {m.cadence_step && <Badge variant="secondary" className="text-[10px]">Cadência #{m.cadence_step}</Badge>}
                  {m.template_name && <Badge variant="secondary" className="text-[10px]">{m.template_name}</Badge>}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(m.created_at), { locale: ptBR, addSuffix: true })}
                </span>
              </div>
              {m.body && <p className="text-sm text-foreground/90 whitespace-pre-wrap">{m.body}</p>}
              {m.image_url && (
                <a href={m.image_url} target="_blank" rel="noreferrer"
                  className="text-xs text-primary underline break-all">{m.image_url}</a>
              )}
              {m.error_message && (
                <p className="text-[11px] text-destructive mt-1.5 font-mono bg-destructive/5 p-2 rounded">{m.error_message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ====================== CADÊNCIA ======================
function CadenceTab() {
  const [leads, setLeads] = useState<CadenceLead[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: ld }, { data: tp }] = await Promise.all([
      supabase.from('leads')
        .select('id, name, phone, cadence_step, cadence_state, cadence_next_at, cadence_exhausted, whatsapp_opt_out')
        .eq('status', 'contacting')
        .order('cadence_next_at', { ascending: true, nullsFirst: true }),
      supabase.from('whatsapp_templates')
        .select('*').not('step_order', 'is', null).order('step_order'),
    ]);
    setLeads((ld as CadenceLead[]) ?? []);
    setTemplates((tp as WhatsAppTemplate[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const triggerNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('wa-cadence-tick', { body: {} });
      if (error) toast.error(error.message);
      else {
        toast.success(`Processado: ${data?.processed ?? 0} leads · ${data?.sent ?? 0} enviados · ${data?.exhausted ?? 0} esgotados`);
        load();
      }
    } finally { setRunning(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Leads em régua ativa</h3>
            <p className="text-xs text-muted-foreground">Status "Em contato" · Cron roda a cada 5 min</p>
          </div>
          <Button size="sm" onClick={triggerNow} disabled={running}>
            <FontAwesomeIcon icon={faRotate} className={`h-3 w-3 mr-1.5 ${running && 'animate-spin'}`} />
            {running ? 'Processando...' : 'Rodar agora'}
          </Button>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
        ) : leads.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">Nenhum lead em régua.</div>
        ) : (
          <div className="space-y-2">
            {leads.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/20">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{l.name}</span>
                    {l.cadence_exhausted && <Badge variant="destructive" className="text-[10px]">Régua esgotada</Badge>}
                    {l.whatsapp_opt_out && <Badge variant="outline" className="text-[10px]">Opt-out</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono">{l.phone ?? '—'}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold">Etapa {l.cadence_step}/{templates.length}</p>
                  <p className="text-muted-foreground">
                    {l.cadence_next_at
                      ? `Próx: ${format(new Date(l.cadence_next_at), 'dd/MM HH:mm')}`
                      : l.cadence_exhausted ? 'Finalizada' : 'Aguardando 1º envio'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3">Mensagens da régua</h3>
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="p-3 rounded-lg border border-border bg-muted/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">Etapa {t.step_order}</span>
                <Badge variant="outline" className="text-[10px]">+{t.delay_hours}h</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground whitespace-pre-wrap line-clamp-4">{t.body_preview}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Variável disponível: <code className="bg-muted px-1 rounded">{'{{nome}}'}</code>
        </p>
      </Card>
    </div>
  );
}

// ====================== CONFIGURAÇÃO ======================
function ConfigTab() {
  const [config, setConfig] = useState<ConfigRow | null>(null);
  const [instanceId, setInstanceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('whatsapp_config')
      .select('instance_id, is_configured, updated_at')
      .eq('provider', 'zapi')
      .maybeSingle();
    setConfig(data as ConfigRow);
    setInstanceId(data?.instance_id ?? '');
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!instanceId.trim()) { toast.error('Informe o Instance ID'); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('wa-config-save', {
        body: { instance_id: instanceId.trim() },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || 'Falha ao salvar');
      } else {
        toast.success('Configuração salva!');
        load();
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl">
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FontAwesomeIcon icon={faKey} className="h-3.5 w-3.5" /> Credenciais Z-API
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Encontre os valores em <a href="https://app.z-api.io/" target="_blank" rel="noreferrer" className="text-primary underline">app.z-api.io</a>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="instance-id">Instance ID</Label>
          <Input id="instance-id" placeholder="3D..." value={instanceId}
            onChange={(e) => setInstanceId(e.target.value)} disabled={loading} />
          <p className="text-[11px] text-muted-foreground">Aparece no painel da Z-API ao lado da sua instância.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Instance Token</Label>
          <Input value="•••••••••••• (armazenado em segredo)" disabled />
        </div>
        <div className="space-y-1.5">
          <Label>Client-Token</Label>
          <Input value="•••••••••••• (armazenado em segredo)" disabled />
          <p className="text-[11px] text-muted-foreground">
            Os tokens sensíveis ficam em Lovable Cloud → Secrets. Para atualizar, peça ao desenvolvedor.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={config?.is_configured ? faCircleCheck : faCircleXmark}
              className={`h-4 w-4 ${config?.is_configured ? 'text-success' : 'text-muted-foreground'}`}
            />
            <span className="text-xs">
              {config?.is_configured ? 'Configurado' : 'Aguardando configuração'}
            </span>
          </div>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h3 className="text-sm font-semibold">Como funciona</h3>
        <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
          <li>Cadastre sua <strong>instância Z-API</strong> em app.z-api.io e escaneie o QR Code com o WhatsApp.</li>
          <li>Copie o <strong>Instance ID</strong> e cole no campo ao lado.</li>
          <li>Os tokens (Instance Token + Client-Token) são salvos como segredos seguros no servidor.</li>
          <li>A régua automática roda a cada 5 minutos para leads em <strong>"Em contato"</strong>.</li>
          <li>Após 3 mensagens sem resposta, o lead recebe a tag <strong>"régua esgotada"</strong>.</li>
        </ul>
      </Card>
    </div>
  );
}
