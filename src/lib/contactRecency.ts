/**
 * Helper de recência de contato — fonte única para classificar quão "fresco"
 * está o último contato com um lead/cliente.
 *
 * Regras (apenas para leads ABERTOS — fechados retornam 'recent' neutro):
 * - recent:    ≤ 2 dias desde o último contato
 * - attention: 3–6 dias
 * - overdue:   ≥ 7 dias OU nunca contatado e criado há ≥ 7 dias
 * - never:     nunca contatado (e criado há < 7 dias)
 */
import { isClosedStatus } from '@/lib/leadStatus';

export type ContactRecency = 'recent' | 'attention' | 'overdue' | 'never';

export interface ContactRecencyInfo {
  level: ContactRecency;
  /** Dias desde o último contato. null se nunca contatado. */
  days: number | null;
  /** Label curta para exibição ("há 3 dias", "nunca contatado"). */
  label: string;
  /** Classes Tailwind (token semântico) para o pill. */
  toneClass: string;
}

const DAY_MS = 1000 * 60 * 60 * 24;

const TONE: Record<ContactRecency, string> = {
  recent: 'bg-success-soft text-success border-success/20',
  attention: 'bg-warning-soft text-warning border-warning/30',
  overdue: 'bg-destructive/10 text-destructive border-destructive/30',
  never: 'bg-muted text-muted-foreground border-border',
};

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

function relativeLabel(days: number): string {
  if (days <= 0) return 'hoje';
  if (days === 1) return 'há 1 dia';
  return `há ${days} dias`;
}

export function getContactRecency(
  lastContactAt: string | null | undefined,
  status: string | null | undefined,
  createdAt?: string | null,
): ContactRecencyInfo {
  // Leads fechados não precisam de follow-up — neutro.
  if (isClosedStatus(status)) {
    return { level: 'recent', days: null, label: 'Encerrado', toneClass: TONE.recent };
  }

  if (lastContactAt) {
    const days = daysSince(lastContactAt);
    if (days <= 2) return { level: 'recent', days, label: relativeLabel(days), toneClass: TONE.recent };
    if (days <= 6) return { level: 'attention', days, label: relativeLabel(days), toneClass: TONE.attention };
    return { level: 'overdue', days, label: relativeLabel(days), toneClass: TONE.overdue };
  }

  // Nunca contatado.
  const ageDays = createdAt ? daysSince(createdAt) : 0;
  if (ageDays >= 7) {
    return { level: 'overdue', days: null, label: 'Nunca contatado', toneClass: TONE.overdue };
  }
  return { level: 'never', days: null, label: 'Ainda não contatado', toneClass: TONE.never };
}

/** True se o lead exige atenção (atenção ou atrasado). */
export function needsFollowUp(level: ContactRecency): boolean {
  return level === 'attention' || level === 'overdue';
}
