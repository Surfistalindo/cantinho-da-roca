import { useCallback, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowUp, faFileExcel, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ExcelDropzoneProps {
  onFile: (file: File) => void;
}

const ACCEPT = '.xlsx,.xls,.xlsm,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroenabled.12,text/csv';
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTS = ['xlsx', 'xls', 'xlsm', 'csv'];

function validateFile(file: File): string | null {
  // Path traversal / nome suspeito
  if (/[\\/]|\.\./.test(file.name)) return 'Nome de arquivo inválido.';
  if (file.name.length > 200) return 'Nome de arquivo muito longo.';
  // Tamanho
  if (file.size === 0) return 'Arquivo vazio.';
  if (file.size > MAX_SIZE_BYTES) return 'Arquivo maior que 10 MB.';
  // Extensão
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTS.includes(ext)) {
    return 'Formato não permitido. Use .xlsx, .xls, .xlsm ou .csv.';
  }
  return null;
}

export default function ExcelDropzone({ onFile }: ExcelDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    const err = validateFile(file);
    if (err) {
      toast.error('Arquivo rejeitado', { description: err });
      return;
    }
    onFile(file);
  }, [onFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

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
      <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary flex items-center justify-center mb-5">
        <FontAwesomeIcon icon={faCloudArrowUp} className="h-7 w-7" />
      </div>
      <h3 className="text-[17px] font-semibold text-foreground mb-1.5">Envie sua planilha</h3>
      <p className="text-[13px] text-muted-foreground mb-6 max-w-md mx-auto">
        Arraste um arquivo aqui ou selecione manualmente. A IA vai interpretar as colunas e preparar a importação.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      <Button onClick={() => inputRef.current?.click()} size="lg">
        <FontAwesomeIcon icon={faFileArrowUp} className="h-4 w-4 mr-2" />
        Selecionar arquivo
      </Button>
      <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <FontAwesomeIcon icon={faFileExcel} className="h-3 w-3 text-success" />
          .xlsx, .xls, .xlsm, .csv
        </span>
        <span>•</span>
        <span>Até 10 MB · 5.000 linhas</span>
      </div>
    </div>
  );
}
