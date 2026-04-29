import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion, faRobot } from '@fortawesome/free-solid-svg-icons';

export default function InboxLegend() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="h-5 w-5 rounded-full text-muted-foreground hover:bg-muted flex items-center justify-center"
          title="Como ler esta lista"
          aria-label="Como ler esta lista"
        >
          <FontAwesomeIcon icon={faCircleQuestion} className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 text-[12px] space-y-2.5 p-3">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          Como ler esta lista
        </p>

        <div className="flex items-start gap-2.5">
          <FontAwesomeIcon icon={faRobot} className="h-3 w-3 text-[hsl(var(--honey))] mt-0.5" />
          <div>
            <p className="font-semibold">Robô amarelo</p>
            <p className="text-muted-foreground text-[11px]">Régua de mensagens automáticas rodando.</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Badge className="h-4 min-w-[16px] px-1 text-[9px] bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))] text-white shrink-0 mt-0.5">
            3
          </Badge>
          <div>
            <p className="font-semibold">Bolinha laranja</p>
            <p className="text-muted-foreground text-[11px]">Mensagens recebidas que você ainda não respondeu.</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <span className="text-[11px] font-semibold mt-0.5">Você:</span>
          <div>
            <p className="font-semibold">Prefixo "Você:"</p>
            <p className="text-muted-foreground text-[11px]">A última mensagem foi enviada por você ou pela automação.</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <span className="text-base mt-[-2px]">🖼</span>
          <div>
            <p className="font-semibold">Ícone de imagem</p>
            <p className="text-muted-foreground text-[11px]">A última mensagem foi mídia (imagem com legenda).</p>
          </div>
        </div>

        <div className="pt-1 border-t border-border text-[10.5px] text-muted-foreground">
          Conversas ordenam pela mensagem mais recente.
        </div>
      </PopoverContent>
    </Popover>
  );
}
