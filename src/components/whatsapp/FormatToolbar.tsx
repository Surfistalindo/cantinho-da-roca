import { useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBold, faItalic, faStrikethrough, faCode } from '@fortawesome/free-solid-svg-icons';

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

const wrappers: { icon: typeof faBold; label: string; mark: string; help: string }[] = [
  { icon: faBold, label: 'Negrito', mark: '*', help: '*texto* fica em negrito no WhatsApp' },
  { icon: faItalic, label: 'Itálico', mark: '_', help: '_texto_ fica em itálico no WhatsApp' },
  { icon: faStrikethrough, label: 'Tachado', mark: '~', help: '~texto~ fica riscado' },
  { icon: faCode, label: 'Monoespaçado', mark: '```', help: '```texto``` exibe em fonte mono' },
];

export default function FormatToolbar({ textareaRef, value, onChange, disabled }: Props) {
  const wrap = useCallback(
    (mark: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart ?? 0;
      const end = ta.selectionEnd ?? 0;
      const before = value.slice(0, start);
      const sel = value.slice(start, end) || 'texto';
      const after = value.slice(end);
      const next = `${before}${mark}${sel}${mark}${after}`;
      onChange(next);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = before.length + mark.length;
        ta.setSelectionRange(pos, pos + sel.length);
      });
    },
    [textareaRef, value, onChange],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-0.5">
        {wrappers.map((w) => (
          <Tooltip key={w.label}>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                onClick={() => wrap(w.mark)}
                className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-center disabled:opacity-40"
              >
                <FontAwesomeIcon icon={w.icon} className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
              <strong>{w.label}</strong> · {w.help}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
