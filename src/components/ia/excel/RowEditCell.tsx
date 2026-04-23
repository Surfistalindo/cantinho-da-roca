import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faWandMagicSparkles, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LEAD_STATUSES, type LeadStatus } from '@/config/app';
import { getLeadStatusConfig } from '@/lib/leadStatus';
import { formatPhoneDisplay } from '@/lib/ia/phoneFormat';
import { cn } from '@/lib/utils';

export type CellState = 'ok' | 'warning' | 'error' | 'empty';

interface RowEditCellProps {
  value: unknown;
  field: string;
  state: CellState;
  message?: string;
  onCommit: (value: unknown) => void;
}

export default function RowEditCell({ value, field, state, message, onCommit }: RowEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(formatForDisplay(field, value));

  useEffect(() => { setDraft(formatForDisplay(field, value)); }, [value, field]);

  const commit = () => {
    setEditing(false);
    const parsed = parseField(field, draft);
    if (parsed !== value) onCommit(parsed);
  };

  const cancel = () => {
    setDraft(formatForDisplay(field, value));
    setEditing(false);
  };

  const cellClasses = cn(
    'group relative px-2 py-1.5 rounded-md border text-[12px] cursor-pointer transition-colors min-h-[32px] flex items-center gap-1.5',
    state === 'error' && 'border-destructive/50 bg-destructive/5 text-destructive',
    state === 'warning' && 'border-warning/50 bg-warning-soft text-warning',
    state === 'ok' && 'border-transparent hover:border-border hover:bg-muted/30 text-foreground',
    state === 'empty' && 'border-dashed border-border text-muted-foreground italic hover:bg-muted/30',
  );

  if (editing) {
    if (field === 'status') {
      return (
        <Select
          value={draft || 'new'}
          onValueChange={(v) => { setDraft(v); onCommit(v); setEditing(false); }}
          open
          onOpenChange={(o) => { if (!o) cancel(); }}
        >
          <SelectTrigger className="h-8 text-[12px]" autoFocus>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{getLeadStatusConfig(s).label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            else if (e.key === 'Escape') cancel();
          }}
          className="h-8 text-[12px]"
          placeholder={field === 'next_contact_at' ? 'dd/mm/aaaa' : ''}
        />
        <button
          type="button"
          onClick={commit}
          className="h-7 w-7 flex items-center justify-center rounded-md text-success hover:bg-success-soft"
          aria-label="Confirmar"
        >
          <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={cancel}
          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label="Cancelar"
        >
          <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={cellClasses} onClick={() => setEditing(true)} title={message ?? 'Clique para editar'}>
      {state === 'error' && <FontAwesomeIcon icon={faTriangleExclamation} className="h-3 w-3 shrink-0" />}
      {state === 'warning' && <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3 w-3 shrink-0" />}
      <span className="truncate">{displayValue(field, value) || (state === 'empty' ? '— vazio —' : '—')}</span>
    </div>
  );
}

function formatForDisplay(field: string, value: unknown): string {
  if (value == null) return '';
  if (field === 'next_contact_at' && typeof value === 'string') {
    try {
      const d = new Date(value);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch { return String(value); }
  }
  return String(value);
}

function displayValue(field: string, value: unknown): string {
  if (value == null || value === '') return '';
  if (field === 'phone' && typeof value === 'string') return formatPhoneDisplay(value);
  if (field === 'status' && typeof value === 'string') return getLeadStatusConfig(value).label;
  if (field === 'next_contact_at' && typeof value === 'string') {
    try { return new Date(value).toLocaleDateString('pt-BR'); } catch { return String(value); }
  }
  return String(value);
}

function parseField(field: string, raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (field === 'status') return trimmed as LeadStatus;
  if (field === 'next_contact_at') {
    // dd/mm/aaaa ou ISO
    const br = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(trimmed);
    if (br) {
      const [, d, m, y] = br;
      const yyyy = y.length === 2 ? `20${y}` : y;
      const date = new Date(`${yyyy}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00`);
      if (!isNaN(date.getTime())) return date.toISOString();
    }
    const iso = new Date(trimmed);
    if (!isNaN(iso.getTime())) return iso.toISOString();
    return trimmed; // mantém para o usuário corrigir
  }
  if (field === 'phone') {
    const digits = trimmed.replace(/\D/g, '');
    return digits || trimmed;
  }
  return trimmed;
}
