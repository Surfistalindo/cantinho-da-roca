// Helpers para serialização do campo `ai_summary` da tabela `leads`.
// O conteúdo é guardado como JSON com { summary, next_steps[], whatsapp_message }.
// Resumos legados (texto puro) são interpretados como apenas `summary`.

export interface LeadInsight {
  summary: string;
  next_steps: string[];
  whatsapp_message: string;
}

export function parseInsight(raw: string | null | undefined): LeadInsight | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Tenta JSON primeiro
  if (trimmed.startsWith("{")) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj.summary === "string") {
        return {
          summary: obj.summary,
          next_steps: Array.isArray(obj.next_steps) ? obj.next_steps.filter((x: unknown) => typeof x === "string") : [],
          whatsapp_message: typeof obj.whatsapp_message === "string" ? obj.whatsapp_message : "",
        };
      }
    } catch {
      // cai no fallback
    }
  }
  // Legado: tratar string solta como summary
  return { summary: trimmed, next_steps: [], whatsapp_message: "" };
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  const text = encodeURIComponent(message);
  if (!digits) return `https://wa.me/?text=${text}`;
  // Se o número não começar com 55 (Brasil) e tiver 10-11 dígitos, prefixa.
  const normalized = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${normalized}?text=${text}`;
}
