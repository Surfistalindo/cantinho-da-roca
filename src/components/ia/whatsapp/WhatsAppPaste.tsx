import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWhatsapp,
} from '@fortawesome/free-brands-svg-icons';
import {
  faSpinner, faWandMagicSparkles, faFileLines, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onExtract: () => void;
  loading: boolean;
  maxChars?: number;
}

const EXAMPLE = `Lista de contatos:
Maria Silva +55 11 98888-7777
João Pereira — 11 91234-5678
Carla, (11) 99999-0000

…ou export de chat (.txt):
[12/03/2024, 14:32] Maria Silva: oi, tudo bem?
12/03/2024, 14:35 - João Pereira: quero saber sobre o queijo`;

export default function WhatsAppPaste({ value, onChange, onExtract, loading, maxChars = 200_000 }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const len = value.length;
  const over = len > maxChars;
  const canExtract = !loading && value.trim().length > 0 && !over;

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(txt|csv|log)$/i) && file.type && !file.type.startsWith('text/')) {
      toast.error('Use um arquivo .txt do export do WhatsApp');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 5 MB)');
      return;
    }
    try {
      const text = await file.text();
      onChange(text.slice(0, maxChars));
      setFilename(file.name);
    } catch {
      toast.error('Falha ao ler arquivo');
    }
  }, [onChange, maxChars]);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onPick = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  }, [handleFile]);

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5 space-y-3">
      <div className="flex items-start gap-2.5">
        <span className="h-9 w-9 rounded-xl bg-success-soft text-success flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-foreground">Cole o conteúdo do WhatsApp</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Lista de contatos ou export de chat .txt. Reconhecemos os dois formatos automaticamente.
          </p>
        </div>
      </div>

      {/* Dropzone para .txt */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'w-full rounded-xl border-2 border-dashed px-4 py-3 text-[12px] flex items-center justify-center gap-2 transition-colors',
          dragOver
            ? 'border-success bg-success-soft/40 text-success'
            : 'border-border bg-muted/20 text-muted-foreground hover:border-success/50 hover:bg-success-soft/20',
        )}
      >
        <FontAwesomeIcon icon={faFileLines} className="h-3.5 w-3.5" />
        {filename ? (
          <span className="flex items-center gap-2">
            <span className="font-medium text-foreground">{filename}</span>
            <span className="text-muted-foreground">— clique para trocar</span>
          </span>
        ) : (
          <span>Arraste um <strong>.txt</strong> ou clique para escolher (opcional)</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.log,.csv,text/plain"
          className="hidden"
          onChange={onPick}
        />
      </button>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Exemplo:\n${EXAMPLE}`}
        rows={12}
        className="font-mono text-[12.5px] resize-y min-h-[240px]"
        disabled={loading}
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className={cn(
          'text-[11px] font-mono',
          over ? 'text-destructive' : 'text-muted-foreground',
        )}>
          {len.toLocaleString('pt-BR')} / {maxChars.toLocaleString('pt-BR')} caracteres
        </div>
        <div className="flex items-center gap-2">
          {(value || filename) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onChange(''); setFilename(null); }}
              disabled={loading}
              className="text-muted-foreground gap-1.5"
            >
              <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
              Limpar
            </Button>
          )}
          <Button onClick={onExtract} disabled={!canExtract} className="gap-2">
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="h-3.5 w-3.5" />
                Processando…
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3.5 w-3.5" />
                Extrair contatos
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
