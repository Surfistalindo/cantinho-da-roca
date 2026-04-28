import React, { useState } from 'react';
import { HelpCircle, Play, Lightbulb, Keyboard, BookOpen, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTutorial } from './TutorialProvider';
import Glossary from './Glossary';

interface Props {
  /** Abre o painel de atalhos (compartilhado com Cmd+/) */
  onOpenShortcuts: () => void;
}

export default function HelpButton({ onOpenShortcuts }: Props) {
  const { currentTour, start, isCompleted } = useTutorial();
  const [open, setOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const isNew = !isCompleted(currentTour.id, currentTour.version);

  const handleStartTour = () => {
    setOpen(false);
    // pequeno delay para o popover fechar antes do overlay subir
    setTimeout(() => start(currentTour), 50);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-tour="help-button"
            aria-label="Ajuda e tutoriais"
            className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-1 ring-primary/40 hover:scale-105 hover:shadow-xl transition-all"
          >
            <HelpCircle className="h-5 w-5" strokeWidth={2.25} />
            {isNew && (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-background"
              />
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          side="top"
          sideOffset={12}
          className="w-[300px] p-2 rounded-xl border-border shadow-xl"
        >
          <div className="px-2 pt-1.5 pb-2">
            <p className="text-[10.5px] uppercase tracking-wider font-semibold text-primary">
              Ajuda contextual
            </p>
            <h3 className="text-[13.5px] font-semibold text-foreground tracking-tight">
              {currentTour.title}
            </h3>
            <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug">
              {currentTour.summary}
            </p>
          </div>

          <div className="h-px bg-border mx-1 my-1" />

          <MenuItem
            icon={<Play className="h-3.5 w-3.5" />}
            label={isNew ? 'Iniciar tour desta tela' : 'Refazer tour desta tela'}
            hint={`${currentTour.steps.length} passos · ~${Math.max(1, Math.round(currentTour.steps.length * 0.4))} min`}
            badge={isNew ? 'Novo' : undefined}
            onClick={handleStartTour}
            primary
          />
          <MenuItem
            icon={<Lightbulb className="h-3.5 w-3.5" />}
            label="Dicas rápidas"
            hint="Resumo dos passos em texto"
            onClick={() => { setOpen(false); setTimeout(() => setTipsOpen(true), 50); }}
          />
          <MenuItem
            icon={<Keyboard className="h-3.5 w-3.5" />}
            label="Atalhos de teclado"
            hint="Cmd/Ctrl + /"
            onClick={() => { setOpen(false); onOpenShortcuts(); }}
          />
          <MenuItem
            icon={<BookOpen className="h-3.5 w-3.5" />}
            label="Glossário"
            hint="Lead, Pipeline, Score…"
            onClick={() => { setOpen(false); setTimeout(() => setGlossaryOpen(true), 50); }}
          />
        </PopoverContent>
      </Popover>

      <Glossary open={glossaryOpen} onOpenChange={setGlossaryOpen} />

      <TipsSheet open={tipsOpen} onOpenChange={setTipsOpen} />
    </>
  );
}

function MenuItem({
  icon, label, hint, onClick, primary, badge,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  primary?: boolean;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors ${
        primary
          ? 'bg-primary/10 hover:bg-primary/15 text-foreground'
          : 'hover:bg-accent text-foreground'
      }`}
    >
      <span className={`flex h-7 w-7 items-center justify-center rounded-md ${primary ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="text-[12.5px] font-medium truncate">{label}</span>
          {badge && (
            <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-px rounded bg-orange-500 text-white">
              {badge}
            </span>
          )}
        </span>
        {hint && <span className="block text-[10.5px] text-muted-foreground mt-0.5 truncate">{hint}</span>}
      </span>
    </button>
  );
}

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
const TipsSheet = React.forwardRef<HTMLDivElement, { open: boolean; onOpenChange: (o: boolean) => void }>(
  function TipsSheet({ open, onOpenChange }, _ref) {
    const { currentTour } = useTutorial();
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[380px] sm:w-[440px] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {currentTour.title} — dicas
            </SheetTitle>
            <SheetDescription>{currentTour.summary}</SheetDescription>
          </SheetHeader>
          <ol className="mt-5 space-y-3.5">
            {currentTour.steps.map((s, i) => (
              <li key={s.id} className="flex gap-3 rounded-lg border border-border bg-card/40 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-semibold tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-foreground">{s.title}</p>
                  <p
                    className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed [&_strong]:text-foreground [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: s.body }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </SheetContent>
      </Sheet>
    );
  },
);

