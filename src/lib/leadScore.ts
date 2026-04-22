/**
 * Lead Score — Inteligência Comercial.
 *
 * Função pura que classifica leads em hot/warm/cold/closed combinando:
 *   - Status (até 35)
 *   - Recência sem contato (até 25)
 *   - Volume de interações (até 20)
 *   - Origem (até 10)
 *   - Próximo contato agendado (até 10)
 *
 * Mapeamento de cor semântica (override por urgência):
 *   verde     → ativo (hot com recência boa)
 *   amarelo   → atenção (warm OU hot 3–6 dias sem contato)
 *   vermelho  → urgente (hot ≥7d sem contato OU next_contact_at atrasado)
 *   cinza     → frio
 *   neutro    → encerrado (won/lost)
 */
import { isClosedStatus } from '@/lib/leadStatus';

export type LeadScoreLevel = 'hot' | 'warm' | 'cold' | 'closed';

export interface LeadScoreInput {
  status: string;
  origin: string | null;
  created_at: string;
  last_contact_at: string | null;
  next_contact_at?: string | null;
}

export interface LeadScoreInfo {
  score: number;            // 0–100
  level: LeadScoreLevel;
  label: string;            // "Quente" | "Morno" | "Frio" | "Encerrado"
  urgent: boolean;          // requer ação imediata
  reasons: string[];        // bullets explicativos
  toneClass: string;        // bg + text + border (token semântico)
  dotClass: string;         // somente bg-{token}
  iconKey: 'fire' | 'bolt' | 'half' | 'snow' | 'check';
}

const DAY_MS = 1000 * 60 * 60 * 24;

const ORIGIN_WEIGHTS: Record<string, number> = {
  'Indicação': 10,
  'WhatsApp': 8,
  'Site': 6,
  'Instagram': 5,
  'Outro': 3,
};

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.floor((new Date(iso).getTime() - Date.now()) / DAY_MS);
}

export function getLeadScore(
  lead: LeadScoreInput,
  opts: { interactionCount?: number } = {},
): LeadScoreInfo {
  const interactionCount = opts.interactionCount ?? 0;
  const reasons: string[] = [];

  // Status fechado → fora da priorização
  if (isClosedStatus(lead.status)) {
    return {
      score: 0,
      level: 'closed',
      label: 'Encerrado',
      urgent: false,
      reasons: ['Lead encerrado'],
      toneClass: 'bg-muted text-muted-foreground border-border',
      dotClass: 'bg-muted-foreground/40',
      iconKey: 'check',
    };
  }

  // 1) Status (35)
  let statusPts = 0;
  switch (lead.status) {
    case 'negotiating':
      statusPts = 35;
      reasons.push('Em negociação');
      break;
    case 'contacting':
      statusPts = 22;
      reasons.push('Em contato ativo');
      break;
    case 'new':
      statusPts = 15;
      reasons.push('Lead novo');
      break;
    default:
      statusPts = 8;
  }

  // 2) Recência (25) — quanto mais tempo sem contato, mais crítico
  const sinceContact = daysSince(lead.last_contact_at);
  const sinceCreated = daysSince(lead.created_at) ?? 0;
  let recencyPts = 0;
  let overdueDays = 0;

  if (sinceContact === null) {
    // Nunca contatado: usa idade do lead
    if (sinceCreated >= 14) { recencyPts = 25; overdueDays = sinceCreated; reasons.push(`Nunca contatado (há ${sinceCreated} dias)`); }
    else if (sinceCreated >= 7) { recencyPts = 22; overdueDays = sinceCreated; reasons.push(`Nunca contatado (há ${sinceCreated} dias)`); }
    else if (sinceCreated >= 3) { recencyPts = 15; reasons.push(`Aguardando contato há ${sinceCreated} dias`); }
    else { recencyPts = 5; }
  } else {
    if (sinceContact >= 14) { recencyPts = 25; overdueDays = sinceContact; reasons.push(`${sinceContact} dias sem contato`); }
    else if (sinceContact >= 7) { recencyPts = 22; overdueDays = sinceContact; reasons.push(`${sinceContact} dias sem contato`); }
    else if (sinceContact >= 3) { recencyPts = 15; reasons.push(`${sinceContact} dias sem contato`); }
    else if (sinceContact >= 1) { recencyPts = 5; reasons.push(`Contato recente (${sinceContact}d)`); }
    else { recencyPts = 0; reasons.push('Contato hoje'); }
  }

  // 3) Interações (20)
  const interactionPts = Math.max(0, Math.min(20, interactionCount * 5));
  if (interactionCount > 0) {
    reasons.push(`${interactionCount} interaç${interactionCount === 1 ? 'ão' : 'ões'} registrada${interactionCount === 1 ? '' : 's'}`);
  }

  // 4) Origem (10)
  const originKey = lead.origin ?? 'Outro';
  const originPts = ORIGIN_WEIGHTS[originKey] ?? 3;
  if (originKey === 'Indicação') reasons.push('Indicação (alta prioridade)');

  // 5) Próximo contato (10)
  let schedulePts = 0;
  let scheduleOverdue = false;
  const untilNext = daysUntil(lead.next_contact_at ?? null);
  if (untilNext !== null) {
    if (untilNext < 0) { schedulePts = 10; scheduleOverdue = true; reasons.push(`Follow-up atrasado (${Math.abs(untilNext)}d)`); }
    else if (untilNext === 0) { schedulePts = 8; reasons.push('Follow-up agendado para hoje'); }
    else if (untilNext <= 3) { schedulePts = 5; reasons.push(`Follow-up em ${untilNext} dia${untilNext === 1 ? '' : 's'}`); }
    else { schedulePts = 2; }
  }

  const score = Math.max(0, Math.min(100, statusPts + recencyPts + interactionPts + originPts + schedulePts));

  // Classificação
  let level: LeadScoreLevel;
  if (score >= 65) level = 'hot';
  else if (score >= 35) level = 'warm';
  else level = 'cold';

  // Urgência (override de cor semântica)
  const urgent = (level === 'hot' && overdueDays >= 7) || scheduleOverdue;

  // Mapeamento visual
  let toneClass = '';
  let dotClass = '';
  let iconKey: LeadScoreInfo['iconKey'] = 'half';
  let label = '';

  if (urgent) {
    toneClass = 'bg-destructive/10 text-destructive border-destructive/30';
    dotClass = 'bg-destructive';
    iconKey = 'fire';
    label = 'Urgente';
  } else if (level === 'hot') {
    toneClass = 'bg-success-soft text-success border-success/25';
    dotClass = 'bg-success';
    iconKey = 'bolt';
    label = 'Quente';
  } else if (level === 'warm') {
    toneClass = 'bg-warning-soft text-warning border-warning/30';
    dotClass = 'bg-warning';
    iconKey = 'half';
    label = 'Morno';
  } else {
    toneClass = 'bg-muted text-muted-foreground border-border';
    dotClass = 'bg-muted-foreground/50';
    iconKey = 'snow';
    label = 'Frio';
  }

  return { score, level, label, urgent, reasons, toneClass, dotClass, iconKey };
}

/** Comparador para ordenar leads por prioridade desc (encerrados ao final). */
export function compareByScore(
  a: { _scoreInfo?: LeadScoreInfo } & LeadScoreInput,
  b: { _scoreInfo?: LeadScoreInfo } & LeadScoreInput,
): number {
  const sa = a._scoreInfo ?? getLeadScore(a);
  const sb = b._scoreInfo ?? getLeadScore(b);
  // Encerrados sempre no fim
  if (sa.level === 'closed' && sb.level !== 'closed') return 1;
  if (sb.level === 'closed' && sa.level !== 'closed') return -1;
  // Urgentes primeiro
  if (sa.urgent !== sb.urgent) return sa.urgent ? -1 : 1;
  return sb.score - sa.score;
}
