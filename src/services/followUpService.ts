/**
 * Follow-up service — identifies stale leads that need attention.
 * Prepared for future automation (scheduled messages, WhatsApp API integration).
 */

const STALE_DAYS = 2;

interface LeadForFollowUp {
  status: string;
  created_at: string;
  last_contact_at: string | null;
}

/** Returns true if a lead has had no contact for STALE_DAYS or more */
export function isLeadStale(lead: LeadForFollowUp): boolean {
  if (lead.status === 'won' || lead.status === 'lost') return false;

  const reference = lead.last_contact_at ?? lead.created_at;
  const refDate = new Date(reference);
  const now = new Date();
  const diffMs = now.getTime() - refDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= STALE_DAYS;
}

/** Generates the default follow-up WhatsApp URL */
export function getFollowUpWhatsAppUrl(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  const num = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${num}?text=${encodeURIComponent('Oi! Passando para saber se ainda tem interesse 😊')}`;
}

/**
 * Future automation hooks — NOT implemented yet.
 * These stubs prepare the codebase for:
 * - Scheduled follow-up messages via WhatsApp Business API
 * - Automated status transitions
 * - Follow-up sequences with escalation
 */
export const followUpAutomation = {
  /** Schedule a follow-up for a specific lead */
  async schedule(_leadId: string, _delayDays: number): Promise<void> {
    // TODO: Implement with edge function + cron
  },

  /** Process all pending follow-ups */
  async processAll(): Promise<void> {
    // TODO: Implement batch processing
  },
};
