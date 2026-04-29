import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMessage, faBoltLightning, faRobot, faChartLine, faXmark, faCirclePlay,
} from '@fortawesome/free-solid-svg-icons';
import { useTutorial } from '@/components/tutorial/TutorialProvider';

const KEY = 'wa-welcome-dismissed';

const cards = [
  { icon: faMessage, title: 'Conversar', text: 'Inbox unificada com todos os leads que têm WhatsApp.' },
  { icon: faBoltLightning, title: 'Templates rápidos', text: 'Mensagens prontas com variáveis ({{nome}}).' },
  { icon: faRobot, title: 'Régua automática', text: 'Lead em "Em contato" recebe sequência sozinho.' },
  { icon: faChartLine, title: 'Status em tempo real', text: 'Veja enviadas, respondidas e falhas do dia.' },
];

export default function WelcomeBanner() {
  const [show, setShow] = useState(false);
  const { start, currentTour } = useTutorial();

  useEffect(() => {
    try { setShow(localStorage.getItem(KEY) !== '1'); } catch { /* ignore */ }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <div className="relative bg-gradient-to-br from-[hsl(var(--honey)/0.18)] via-card to-card border-b border-border px-4 sm:px-6 py-4">
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"
        title="Dispensar"
        aria-label="Dispensar"
      >
        <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="lg:max-w-[260px]">
          <h2 className="font-display-warm text-base font-bold leading-tight">
            Bem-vindo ao WhatsApp Studio
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Sua central de mensagens integrada ao CRM. Veja como aproveitar:
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={() => start(currentTour)} className="gap-1.5">
              <FontAwesomeIcon icon={faCirclePlay} className="h-3 w-3" />
              Tour guiado
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Entendi
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
          {cards.map((c) => (
            <div key={c.title} className="rounded-lg bg-card border border-border p-2.5 flex items-start gap-2">
              <span className="h-7 w-7 rounded-md bg-[hsl(var(--secondary)/0.12)] text-[hsl(var(--secondary))] flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={c.icon} className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight">{c.title}</p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
