import { forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';

const SUGGESTIONS = [
  'Como está minha base hoje?',
  'Quem está parado há mais de 7 dias?',
  'Mostre meus 5 leads mais quentes',
  'Quais leads estão prontos para fechar?',
  'Faça uma triagem da minha base',
  'Quem entrou esta semana e ainda não foi contatado?',
];

interface Props {
  onPick: (q: string) => void;
  disabled?: boolean;
}

const SuggestedQuestions = forwardRef<HTMLDivElement, Props>(function SuggestedQuestions({ onPick, disabled }, ref) {
  return (
    <div ref={ref} className="space-y-3">
      <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <FontAwesomeIcon icon={faLightbulb} className="h-3 w-3 text-primary" />
        Sugestões para começar
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onPick(s)}
            className="text-left rounded-xl border bg-card hover:bg-muted/40 hover:border-primary/40 transition-colors px-3.5 py-2.5 text-[12.5px] text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
});

export default SuggestedQuestions;
