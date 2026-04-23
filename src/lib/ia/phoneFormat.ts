/**
 * Normaliza telefone para formato BR.
 * Retorna apenas dígitos com DDI 55 quando aplicável, ou null se inválido.
 */
export function normalizePhone(raw: unknown): string | null {
  if (raw == null) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return null;
  // Remove zeros à esquerda
  let d = digits.replace(/^0+/, '');
  if (!d) return null;

  // Se já começar com 55 e tiver tamanho razoável (12-13)
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d;

  // BR sem DDI: 10 (fixo com DDD) ou 11 (celular com DDD)
  if (d.length === 10 || d.length === 11) return '55' + d;

  // Fallback: aceita se tiver pelo menos 10 dígitos
  if (d.length >= 10 && d.length <= 15) return d;

  return null;
}

export function formatPhoneDisplay(normalized: string | null): string {
  if (!normalized) return '';
  const d = normalized.replace(/\D/g, '');
  if (d.startsWith('55') && d.length === 13) {
    return `+55 (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  }
  if (d.startsWith('55') && d.length === 12) {
    return `+55 (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  }
  return normalized;
}
