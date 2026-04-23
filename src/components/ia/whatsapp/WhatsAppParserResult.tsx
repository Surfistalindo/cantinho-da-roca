import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faUsers, faComments, faAddressBook } from '@fortawesome/free-solid-svg-icons';
import type { WhatsAppParseResult } from '@/services/ia/whatsappParser';

interface Props {
  result: WhatsAppParseResult;
}

const FORMAT_LABELS: Record<WhatsAppParseResult['format'], { label: string; icon: typeof faComments; desc: string }> = {
  'chat-export': { label: 'Export de chat', icon: faComments, desc: 'Identificamos cada autor único como um lead.' },
  'contact-list': { label: 'Lista de contatos', icon: faAddressBook, desc: 'Cada linha foi interpretada como um contato.' },
  mixed: { label: 'Misto', icon: faUsers, desc: 'Conteúdo variado processado.' },
  empty: { label: 'Vazio', icon: faUsers, desc: 'Sem conteúdo.' },
};

export default function WhatsAppParserResult({ result }: Props) {
  const fmt = FORMAT_LABELS[result.format];
  return (
    <div className="mb-4 rounded-xl border border-success/30 bg-success-soft/40 px-4 py-3 flex items-start gap-3">
      <span className="h-9 w-9 rounded-lg bg-success/15 text-success flex items-center justify-center shrink-0 mt-0.5">
        <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
          <FontAwesomeIcon icon={faUsers} className="h-3 w-3 text-muted-foreground" />
          {result.leads.length} {result.leads.length === 1 ? 'contato extraído' : 'contatos extraídos'}
          <span className="text-muted-foreground font-normal">·</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground font-normal text-[11.5px]">
            <FontAwesomeIcon icon={fmt.icon} className="h-2.5 w-2.5" />
            {fmt.label}
          </span>
        </div>
        <div className="text-[11.5px] text-muted-foreground mt-0.5">
          {fmt.desc} {result.ignoredLines > 0 && (
            <span className="opacity-80">{result.ignoredLines} {result.ignoredLines === 1 ? 'linha ignorada' : 'linhas ignoradas'} (sistema, vazias ou sem dados úteis).</span>
          )}
        </div>
      </div>
    </div>
  );
}
