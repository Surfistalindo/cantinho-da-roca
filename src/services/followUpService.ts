/**
 * Follow-up service — identifica leads que precisam de atenção.
 *
 * A lógica de recência foi centralizada em src/lib/contactRecency.ts.
 * Este arquivo mantém helpers de compatibilidade e utilitários de WhatsApp.
 */

import { getContactRecency, needsFollowUp } from '@/lib/contactRecency';

interface LeadForFollowUp {
  status: string;
  created_at: string;
  last_contact_at: string | null;
}

/** Compat: true quando o lead precisa de atenção (atenção ou atrasado). */
export function isLeadStale(lead: LeadForFollowUp): boolean {
  const info = getContactRecency(lead.last_contact_at, lead.status, lead.created_at);
  return needsFollowUp(info.level);
}

/** Gera URL padrão de follow-up no WhatsApp */
export function getFollowUpWhatsAppUrl(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  const num = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${num}?text=${encodeURIComponent('Oi! Passando para saber se ainda tem interesse 😊')}`;
}

/**
 * Hooks de automação futura — NÃO implementado ainda.
 */
export const followUpAutomation = {
  async schedule(_leadId: string, _delayDays: number): Promise<void> {
    // TODO: edge function + cron
  },
  async processAll(): Promise<void> {
    // TODO: batch
  },
};
