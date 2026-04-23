import { LEAD_STATUS } from '@/lib/leadStatus';
import type { LeadStatus } from '@/config/app';

const STATUS_MAP: Array<{ keywords: string[]; status: LeadStatus }> = [
  { keywords: ['novo', 'new', 'recebido', 'recente', 'leadnovo'], status: LEAD_STATUS.NEW },
  {
    keywords: [
      'contato', 'contatando', 'abordagem', 'contacting', 'emcontato',
      'entraremcontato', 'entrareicontato', 'reengajamento', 'peengajamento',
      'reengajar', 'semresposta',
    ],
    status: LEAD_STATUS.CONTACTING,
  },
  {
    keywords: [
      'negociacao', 'negociando', 'aguardando', 'proposta', 'orcamento',
      'pendente', 'vaipassarnaloja', 'vaipassar', 'presencial', 'agendado',
      'aguardandoresposta', 'aguardandochegar',
    ],
    status: LEAD_STATUS.NEGOTIATING,
  },
  {
    keywords: [
      'cliente', 'fechado', 'comprou', 'ganho', 'vendido', 'won', 'venda', 'pago',
      'vendaconcluida', 'concluida', 'concluido', 'finalizada', 'finalizado',
    ],
    status: LEAD_STATUS.WON,
  },
  {
    keywords: ['perdido', 'naorespondeu', 'desistiu', 'lost', 'cancelado', 'desistencia'],
    status: LEAD_STATUS.LOST,
  },
];

export interface StatusInferenceResult {
  status: LeadStatus;
  matched: boolean;
}

export function inferStatus(raw: unknown): StatusInferenceResult {
  if (raw == null || raw === '') return { status: LEAD_STATUS.NEW, matched: false };
  const norm = String(raw)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  for (const { keywords, status } of STATUS_MAP) {
    if (keywords.some((k) => norm.includes(k))) return { status, matched: true };
  }
  return { status: LEAD_STATUS.NEW, matched: false };
}
