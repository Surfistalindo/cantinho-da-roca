/**
 * Helper de ciclo de vida pós-venda — espelha contactRecency mas focado em clientes.
 *
 * Baseado em duas dimensões:
 * - Recência de contato (last_contact_at): quanto tempo desde a última interação.
 * - Recência de compra (purchase_date): quanto tempo desde a última compra.
 *
 * Status derivado:
 * - active:    contato ≤30d OU compra ≤30d
 * - watch:     contato 31–60d ou compra 31–90d (em atenção)
 * - inactive:  contato/compra ≥90d (precisa reativação)
 * - dormant:   ≥180d sem contato e sem compra recente (frio profundo)
 */

export type LifecycleStage = 'active' | 'watch' | 'inactive' | 'dormant';

export interface LifecycleInfo {
  stage: LifecycleStage;
  /** Dias desde último contato (null se nunca). */
  contactDays: number | null;
  /** Dias desde última compra (null se desconhecido). */
  purchaseDays: number | null;
  label: string;
  toneClass: string;
}

const DAY_MS = 1000 * 60 * 60 * 24;

const TONE: Record<LifecycleStage, string> = {
  active: 'bg-success-soft text-success border-success/20',
  watch: 'bg-warning-soft text-warning border-warning/30',
  inactive: 'bg-destructive/10 text-destructive border-destructive/30',
  dormant: 'bg-muted text-muted-foreground border-border',
};

const LABEL: Record<LifecycleStage, string> = {
  active: 'Ativo',
  watch: 'Em atenção',
  inactive: 'Inativo',
  dormant: 'Adormecido',
};

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

export function getCustomerLifecycle(
  lastContactAt: string | null | undefined,
  purchaseDate: string | null | undefined,
): LifecycleInfo {
  const contactDays = daysSince(lastContactAt);
  const purchaseDays = daysSince(purchaseDate);

  // Pega o "menor" (mais recente) sinal positivo entre contato e compra.
  const signals = [contactDays, purchaseDays].filter((d): d is number => d !== null);
  const freshest = signals.length ? Math.min(...signals) : null;

  let stage: LifecycleStage;
  if (freshest === null) {
    // Sem nenhum sinal — depende da idade
    stage = 'dormant';
  } else if (freshest <= 30) {
    stage = 'active';
  } else if (freshest <= 90) {
    stage = 'watch';
  } else if (freshest <= 180) {
    stage = 'inactive';
  } else {
    stage = 'dormant';
  }

  return {
    stage,
    contactDays,
    purchaseDays,
    label: LABEL[stage],
    toneClass: TONE[stage],
  };
}

export function purchaseRecencyLabel(days: number | null): string {
  if (days === null) return 'Sem data';
  if (days <= 0) return 'hoje';
  if (days === 1) return 'há 1 dia';
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'há 1 mês';
  if (months < 12) return `há ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? 'há 1 ano' : `há ${years} anos`;
}

export function needsReactivation(stage: LifecycleStage): boolean {
  return stage === 'inactive' || stage === 'dormant';
}
