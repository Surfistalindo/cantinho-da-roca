/**
 * Helper central para status de leads.
 * Fonte única: APP_CONFIG.leadStatuses em src/config/app.ts.
 * Use estas funções em vez de strings literais para evitar inconsistências.
 */
import { APP_CONFIG, type LeadStatus } from '@/config/app';

export const LEAD_STATUS_VALUES = APP_CONFIG.leadStatuses.map((s) => s.value) as readonly LeadStatus[];

export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTING: 'contacting',
  NEGOTIATING: 'negotiating',
  WON: 'won',
  LOST: 'lost',
} as const satisfies Record<string, LeadStatus>;

export interface LeadStatusConfig {
  value: string;
  label: string;
  color: string;
}

const FALLBACK: LeadStatusConfig = {
  value: 'unknown',
  label: 'Desconhecido',
  color: 'bg-muted text-muted-foreground',
};

/** Retorna config (label, cor) de um status — com fallback seguro se desconhecido. */
export function getLeadStatusConfig(status: string | null | undefined): LeadStatusConfig {
  if (!status) return FALLBACK;
  const cfg = APP_CONFIG.leadStatuses.find((s) => s.value === status);
  return cfg ?? { ...FALLBACK, value: status, label: status };
}

/** True se o lead já saiu do funil ativo (ganho ou perdido). */
export function isClosedStatus(status: string | null | undefined): boolean {
  return status === LEAD_STATUS.WON || status === LEAD_STATUS.LOST;
}
