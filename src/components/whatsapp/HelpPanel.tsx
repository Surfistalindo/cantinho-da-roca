import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMessage, faBoltLightning, faRobot, faChartLine, faKeyboard, faBookOpen, faLightbulb, faGraduationCap,
} from '@fortawesome/free-solid-svg-icons';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const howto = [
  { icon: faChartLine, title: '1. Confira a conexão', text: 'No topo, o ponto verde indica que o WhatsApp está conectado. Se estiver laranja, peça para um admin abrir "Configurar".' },
  { icon: faMessage, title: '2. Escolha um contato', text: 'A coluna da esquerda lista todas as conversas. Use os filtros (Não lidas, Em automação, Sem resposta) ou busque por nome/telefone.' },
  { icon: faBoltLightning, title: '3. Envie usando templates', text: 'No campo de mensagem, clique no raio para inserir uma mensagem pronta. Variáveis como {{nome}} são preenchidas sozinhas.' },
  { icon: faRobot, title: '4. Deixe a régua trabalhar', text: 'Quando um lead vai para "Em contato", ele recebe a sequência automática. Se responder, a régua para sozinha.' },
];

const glossary = [
  { term: 'Régua / Cadência', def: 'Sequência automática de mensagens que o sistema envia para um lead novo, com intervalos pré-definidos.' },
  { term: 'Template', def: 'Mensagem modelo que você criou em "Automações". Pode usar variáveis como {{nome}}.' },
  { term: 'Z-API', def: 'Serviço externo que conecta o número de WhatsApp ao CRM. Configurado em "Configurar".' },
  { term: 'Opt-out', def: 'Quando o contato pede para parar de receber mensagens. A automação fica permanentemente pausada para ele.' },
  { term: 'Status "sent"', def: 'A Z-API confirmou que a mensagem saiu. Não significa lida — apenas entregue ao servidor.' },
  { term: 'Status "failed"', def: 'A mensagem não foi enviada (número inválido, instância desconectada, etc).' },
  { term: 'Régua esgotada', def: 'Todas as mensagens da automação foram enviadas sem resposta. O lead volta para a fila manual.' },
];

const shortcuts = [
  { key: '↑ / ↓', desc: 'Navegar entre conversas' },
  { key: '/', desc: 'Focar a busca de contatos' },
  { key: 'Enter', desc: 'Enviar mensagem' },
  { key: 'Shift + Enter', desc: 'Nova linha no composer' },
  { key: 'Esc', desc: 'Voltar para a lista (mobile)' },
  { key: '?', desc: 'Abrir/fechar este painel de ajuda' },
];

const tips = [
  'Use um número dedicado de WhatsApp para o CRM. Pessoal pode ser desconectado pelo app.',
  'Evite enviar massivamente em poucos minutos — Z-API pode bloquear por SPAM.',
  'Prefira mandar entre 9h e 20h. Mensagens fora desse horário têm taxa de resposta baixa.',
  'Personalize o template antes de enviar — texto idêntico para muita gente é detectado como SPAM.',
  'Use *negrito*, _itálico_, ~tachado~ e ```mono``` para destacar partes importantes.',
  'Se um contato pedir para parar, marque opt-out — a automação para definitivamente para ele.',
];

export default function HelpPanel({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="font-display-warm text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faGraduationCap} className="h-4 w-4 text-[hsl(var(--secondary))]" />
            Ajuda — WhatsApp Studio
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="howto" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-3 grid grid-cols-4">
            <TabsTrigger value="howto" className="text-[11px]">
              <FontAwesomeIcon icon={faBookOpen} className="h-2.5 w-2.5 mr-1" /> Como usar
            </TabsTrigger>
            <TabsTrigger value="glossary" className="text-[11px]">Glossário</TabsTrigger>
            <TabsTrigger value="shortcuts" className="text-[11px]">
              <FontAwesomeIcon icon={faKeyboard} className="h-2.5 w-2.5 mr-1" /> Atalhos
            </TabsTrigger>
            <TabsTrigger value="tips" className="text-[11px]">
              <FontAwesomeIcon icon={faLightbulb} className="h-2.5 w-2.5 mr-1" /> Dicas
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-2">
            <TabsContent value="howto" className="px-4 pb-4 space-y-3 mt-2">
              {howto.map((h) => (
                <div key={h.title} className="rounded-lg border border-border p-3 flex gap-3">
                  <span className="h-8 w-8 rounded-md bg-[hsl(var(--honey)/0.18)] text-[hsl(var(--cocoa))] flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={h.icon} className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{h.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{h.text}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="glossary" className="px-4 pb-4 space-y-2.5 mt-2">
              {glossary.map((g) => (
                <div key={g.term} className="text-xs">
                  <p className="font-semibold">{g.term}</p>
                  <p className="text-muted-foreground mt-0.5">{g.def}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="shortcuts" className="px-4 pb-4 space-y-1.5 mt-2">
              {shortcuts.map((s) => (
                <div key={s.key} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{s.desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-[10px]">{s.key}</kbd>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="tips" className="px-4 pb-4 space-y-2 mt-2">
              {tips.map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <FontAwesomeIcon icon={faLightbulb} className="h-3 w-3 mt-0.5 text-[hsl(var(--honey))] shrink-0" />
                  <p className="text-muted-foreground">{t}</p>
                </div>
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
