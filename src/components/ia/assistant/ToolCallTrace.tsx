import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import type { ToolTraceEntry } from '@/services/ai/aiAssistantService';

const TOOL_LABELS: Record<string, string> = {
  search_leads: 'Buscar leads',
  get_lead_detail: 'Detalhar lead',
  count_leads_by_status: 'Contar funil',
  list_stale_leads: 'Listar leads parados',
};

function fmtArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return entries.map(([k, v]) => `${k}=${typeof v === 'string' ? `"${v}"` : JSON.stringify(v)}`).join(', ');
}

interface Props {
  trace: ToolTraceEntry[];
}

export default function ToolCallTrace({ trace }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border bg-muted/30 text-[11px] overflow-hidden w-full max-w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted/50 transition-colors text-left"
      >
        <FontAwesomeIcon icon={open ? faChevronDown : faChevronRight} className="h-2.5 w-2.5 text-muted-foreground" />
        <FontAwesomeIcon icon={faMagnifyingGlass} className="h-2.5 w-2.5 text-primary" />
        <span className="font-mono text-muted-foreground">
          {trace.length} {trace.length === 1 ? 'consulta executada' : 'consultas executadas'}
        </span>
      </button>
      {open && (
        <ul className="border-t bg-background/40 px-2.5 py-1.5 space-y-0.5 font-mono">
          {trace.map((t, i) => (
            <li key={i} className={cn('text-[10.5px] text-muted-foreground')}>
              <span className="text-foreground font-semibold">{TOOL_LABELS[t.name] ?? t.name}</span>
              {fmtArgs(t.args) && <span className="ml-1 opacity-70">({fmtArgs(t.args)})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
