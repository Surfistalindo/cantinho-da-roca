import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MSym } from '@/components/crm/MSym';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Interaction {
  id: string;
  contact_type: string;
  description: string;
  interaction_date: string;
  lead_id: string | null;
  customer_id: string | null;
}
interface NameMap { [id: string]: string }

interface Props {
  items: Interaction[];
  leadNames: NameMap;
  customerNames: NameMap;
}

const TYPE_META: Record<string, { icon: string; tone: string; label: string }> = {
  whatsapp: { icon: 'chat', tone: 'success', label: 'WhatsApp' },
  ligacao: { icon: 'call', tone: 'info', label: 'Ligação' },
  ligação: { icon: 'call', tone: 'info', label: 'Ligação' },
  email: { icon: 'mail', tone: 'primary', label: 'E-mail' },
  'e-mail': { icon: 'mail', tone: 'primary', label: 'E-mail' },
  reuniao: { icon: 'event', tone: 'warning', label: 'Reunião' },
  reunião: { icon: 'event', tone: 'warning', label: 'Reunião' },
  observacao: { icon: 'sticky_note_2', tone: 'muted', label: 'Nota' },
  observação: { icon: 'sticky_note_2', tone: 'muted', label: 'Nota' },
};

function metaFor(type: string) {
  return TYPE_META[type.toLowerCase()] ?? { icon: 'bolt', tone: 'muted', label: type };
}

const TONE_BG: Record<string, string> = {
  success: 'bg-success/15 text-success',
  info: 'bg-info/15 text-info',
  primary: 'bg-primary/15 text-primary',
  warning: 'bg-warning/15 text-warning',
  muted: 'bg-muted text-muted-foreground',
};

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'ligacao', label: 'Ligações' },
  { key: 'observacao', label: 'Notas' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

function parseTemplate(desc: string): { template: string | null; body: string } {
  const m = desc.match(/^\[Template:\s*([^\]]+)\]\s*(.*)$/s);
  if (m) return { template: m[1].trim(), body: m[2].trim() };
  return { template: null, body: desc };
}

const PAGE = 12;

export default function ActivityFeed({ items, leadNames, customerNames }: Props) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => {
      const t = i.contact_type.toLowerCase();
      if (filter === 'whatsapp') return t === 'whatsapp';
      if (filter === 'ligacao') return t === 'ligacao' || t === 'ligação';
      if (filter === 'observacao') return t === 'observacao' || t === 'observação';
      return true;
    });
  }, [items, filter]);

  const visible = filtered.slice(0, limit);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">Activity Feed</h3>
          <span className="text-[11px] text-muted-foreground">{filtered.length} interações</span>
        </div>
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => { setFilter(f.key); setLimit(PAGE); }}
              className={cn(
                'h-7 px-2.5 rounded-md text-[11px] font-semibold transition-colors',
                filter === f.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          Nenhuma atividade no filtro atual.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {visible.map((i) => {
            const meta = metaFor(i.contact_type);
            const { template, body } = parseTemplate(i.description);
            const contactName = i.lead_id ? leadNames[i.lead_id] : i.customer_id ? customerNames[i.customer_id] : null;
            const href = i.lead_id
              ? `/admin/leads?focus=${i.lead_id}`
              : i.customer_id
              ? `/admin/clients?focus=${i.customer_id}`
              : null;
            const Wrapper: any = href ? Link : 'div';
            const wrapperProps = href ? { to: href } : {};

            return (
              <li key={i.id}>
                <Wrapper
                  {...wrapperProps}
                  className={cn(
                    'flex items-start gap-3 px-5 py-3.5',
                    href && 'hover:bg-muted/40 transition-colors cursor-pointer',
                  )}
                >
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', TONE_BG[meta.tone])}>
                    <MSym name={meta.icon} size={16} filled />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {contactName ? (
                        <span className="text-[13px] font-semibold text-foreground truncate">{contactName}</span>
                      ) : (
                        <span className="text-[13px] font-semibold text-muted-foreground italic">Contato removido</span>
                      )}
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        · {meta.label}
                      </span>
                      {template && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          Template: {template}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-foreground/80 line-clamp-2 leading-relaxed mt-1">
                      {body || '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                      {formatDistanceToNow(new Date(i.interaction_date), { locale: ptBR, addSuffix: true })}
                    </p>
                  </div>
                  {href && (
                    <MSym name="arrow_forward" size={14} className="text-muted-foreground mt-2 shrink-0" />
                  )}
                </Wrapper>
              </li>
            );
          })}
        </ul>
      )}

      {filtered.length > limit && (
        <div className="px-5 py-3 border-t border-border bg-muted/30 text-center">
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE)}
            className="text-[12px] font-semibold text-primary hover:opacity-80"
          >
            Carregar mais ({filtered.length - limit} restantes)
          </button>
        </div>
      )}
    </div>
  );
}
