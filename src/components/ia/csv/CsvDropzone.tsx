import { useCallback, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowUp, faFileCsv, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CsvDropzoneProps {
  onFile: (file: File) => void;
}

const ACCEPT = '.csv,text/csv,application/csv,text/plain';

export default function CsvDropzone({ onFile }: CsvDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={cn(
        'relative rounded-2xl border-2 border-dashed p-10 md:p-14 text-center transition-all',
        dragOver ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40',
      )}
    >
      <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-info/15 to-info/5 text-info flex items-center justify-center mb-5">
        <FontAwesomeIcon icon={faCloudArrowUp} className="h-7 w-7" />
      </div>
      <h3 className="text-[17px] font-semibold text-foreground mb-1.5">Envie seu arquivo CSV</h3>
      <p className="text-[13px] text-muted-foreground mb-6 max-w-md mx-auto">
        Arraste um arquivo .csv aqui ou selecione manualmente. A IA detecta o delimitador
        e a codificação automaticamente.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
      <Button onClick={() => inputRef.current?.click()} size="lg">
        <FontAwesomeIcon icon={faFileArrowUp} className="h-4 w-4 mr-2" />
        Selecionar arquivo CSV
      </Button>
      <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-muted-foreground flex-wrap">
        <span className="inline-flex items-center gap-1.5">
          <FontAwesomeIcon icon={faFileCsv} className="h-3 w-3 text-info" />
          .csv
        </span>
        <span>•</span>
        <span>Delimitadores: , ; \t |</span>
        <span>•</span>
        <span>UTF-8 / Latin-1</span>
        <span>•</span>
        <span>Até 5.000 linhas</span>
      </div>
    </div>
  );
}
