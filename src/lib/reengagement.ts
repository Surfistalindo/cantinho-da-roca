/**
 * Lógica unificada de reengajamento:
 * combina leads "atrasados" + clientes "inativos" em uma fila priorizada.
 */
import { getContactRecency } from '@/lib/contactRecency';
import { getCustomerLifecycle } from '@/lib/customerLifecycle';
import { isClosedStatus } from '@/lib/leadStatus';

export type ReengagementUrgency = 'critical' | 'high' | 'medium';
export type ReengagementKind = 'lead' | 'customer';

export interface ReengagementCandidateLead {
  kind: 'lead';
  id: string;
  name: string;
  phone: string | null;
  product_interest: string | null;
  origin: string | null;
  status: string;
  last_contact_at: string | null;
  created_at: string;
  daysSinceContact: number | null;
  urgency: ReengagementUrgency;
  reason: string;
}

export interface ReengagementCandidateCustomer {
  kind: 'customer';
  id: string;
  name: string;
  phone: string | null;
  product_bought: string | null;
  purchase_date: string | null;
  last_contact_at: string | null;
  daysSinceContact: number | null;
  daysSincePurchase: number | null;
  urgency: ReengagementUrgency;
  reason: string;
}

export type ReengagementCandidate = ReengagementCandidateLead | ReengagementCandidateCustomer;

export interface LeadInput {
  id: string;
  name: string;
  phone: string | null;
  product_interest: string | null;
  origin: string | null;
  status: string;
  last_contact_at: string | null;
  created_at: string;
}

export interface CustomerInput {
  id: string;
  name: string;
  phone: string | null;
  product_bought: string | null;
  purchase_date: string | null;
  last_contact_at: string | null;
}

const URGENCY_RANK: Record<ReengagementUrgency, number> = { critical: 0, high: 1, medium: 2 };

function leadUrgency(days: number | null): ReengagementUrgency {
  if (days === null || days >= 30) return 'critical';
  if (days >= 14) return 'high';
  return 'medium';
}

function customerUrgency(days: number | null): ReengagementUrgency {
  if (days === null) return 'high';
  if (days >= 180) return 'critical';
  if (days >= 120) return 'high';
  return 'medium';
}

export function getReengagementCandidates(
  leads: LeadInput[],
  customers: CustomerInput[],
): ReengagementCandidate[] {
  const out: ReengagementCandidate[] = [];

  for (const l of leads) {
    if (isClosedStatus(l.status)) continue;
    const recency = getContactRecency(l.last_contact_at, l.status, l.created_at);
    if (recency.level !== 'overdue') continue;
    const days = recency.days;
    out.push({
      kind: 'lead',
      id: l.id,
      name: l.name,
      phone: l.phone,
      product_interest: l.product_interest,
      origin: l.origin,
      status: l.status,
      last_contact_at: l.last_contact_at,
      created_at: l.created_at,
      daysSinceContact: days,
      urgency: leadUrgency(days),
      reason: days === null ? 'Nunca contatado' : `${days} dias sem retorno`,
    });
  }

  for (const c of customers) {
    const lc = getCustomerLifecycle(c.last_contact_at, c.purchase_date);
    if (lc.stage !== 'inactive' && lc.stage !== 'dormant') continue;
    // Precisa de janela mínima ~60d para considerar reativação.
    const dRef = lc.contactDays ?? lc.purchaseDays ?? 9999;
    if (dRef < 60) continue;
    out.push({
      kind: 'customer',
      id: c.id,
      name: c.name,
      phone: c.phone,
      product_bought: c.product_bought,
      purchase_date: c.purchase_date,
      last_contact_at: c.last_contact_at,
      daysSinceContact: lc.contactDays,
      daysSincePurchase: lc.purchaseDays,
      urgency: customerUrgency(lc.purchaseDays ?? lc.contactDays),
      reason:
        lc.purchaseDays !== null
          ? `Última compra há ${lc.purchaseDays} dias`
          : 'Sem contato recente',
    });
  }

  out.sort((a, b) => {
    const ru = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    if (ru !== 0) return ru;
    const da = a.kind === 'lead' ? a.daysSinceContact : (a.daysSincePurchase ?? a.daysSinceContact);
    const db = b.kind === 'lead' ? b.daysSinceContact : (b.daysSincePurchase ?? b.daysSinceContact);
    return (db ?? 0) - (da ?? 0);
  });

  return out;
}

export function urgencyToneClass(u: ReengagementUrgency): string {
  if (u === 'critical') return 'bg-destructive/10 text-destructive border-destructive/30';
  if (u === 'high') return 'bg-warning-soft text-warning border-warning/30';
  return 'bg-muted text-muted-foreground border-border';
}

export function urgencyLabel(u: ReengagementUrgency): string {
  return u === 'critical' ? 'Crítico' : u === 'high' ? 'Alto' : 'Médio';
}
