import { format } from 'date-fns';

interface ExportableLead {
  id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  product_interest: string | null;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  next_contact_at: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  new: 'Novo lead',
  contacting: 'Em contato',
  negotiating: 'Negociação',
  won: 'Cliente',
  lost: 'Perdido',
};

const escapeCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export function exportLeadsToCsv(leads: ExportableLead[], filenamePrefix = 'leads') {
  const header = [
    'Nome',
    'Telefone',
    'Status',
    'Origem',
    'Interesse',
    'Criado em',
    'Último contato',
    'Próximo follow-up',
  ];
  const rows = leads.map((l) => [
    l.name,
    l.phone ?? '',
    STATUS_LABEL[l.status] ?? l.status,
    l.origin ?? '',
    l.product_interest ?? '',
    format(new Date(l.created_at), 'yyyy-MM-dd HH:mm'),
    l.last_contact_at ? format(new Date(l.last_contact_at), 'yyyy-MM-dd HH:mm') : '',
    l.next_contact_at ? format(new Date(l.next_contact_at), 'yyyy-MM-dd HH:mm') : '',
  ]);
  const csv = [header, ...rows].map((r) => r.map(escapeCell).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
