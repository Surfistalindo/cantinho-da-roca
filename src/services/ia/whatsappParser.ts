/**
 * Parser determinístico de listas/exports do WhatsApp.
 *
 * Suporta 3 formatos comuns:
 *
 * 1) Export de chat (.txt):
 *    [12/03/2024, 14:32:18] Maria Silva: oi, tudo bem?
 *    12/03/2024 14:32 - João Pereira: gostaria de saber...
 *    Cada autor único vira um lead.
 *
 * 2) Lista de contatos colada (1 por linha):
 *    Maria Silva +55 11 98888-7777
 *    João — 11 91234-5678
 *    Carla, (11) 99999-0000
 *
 * 3) "vCard light" (Nome\n+telefone em linhas alternadas).
 *
 * Sem IA — totalmente client-side.
 */

import type { ParsedSheet } from './excelParser';

export interface WhatsAppLead {
  name: string;
  phone: string | null;
  notes: string | null;
}

export interface WhatsAppParseResult {
  leads: WhatsAppLead[];
  format: 'chat-export' | 'contact-list' | 'mixed' | 'empty';
  totalLines: number;
  ignoredLines: number;
}

// === Helpers ===

const PHONE_RE = /(\+?\d[\d\s\-().]{7,}\d)/;

/** Normaliza telefone: só dígitos, prefixa +55 se brasileiro de 10/11 dígitos sem DDI. */
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = String(raw).replace(/\D+/g, '');
  if (!digits) return null;
  // 10 ou 11 dígitos => assume Brasil
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  // 12/13 dígitos começando com 55 => Brasil OK
  // Outros => mantém como veio (internacional)
  if (digits.length < 10) return null;
  return `+${digits}`;
}

function cleanName(s: string): string {
  return s
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '') // bidi marks
    .replace(/[«»"„""]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-—•·,.;:]+|[\s\-—•·,.;:]+$/g, '')
    .trim();
}

function isLikelyName(s: string): boolean {
  const t = cleanName(s);
  if (t.length < 2 || t.length > 80) return false;
  if (/^\d+$/.test(t)) return false;
  if (/[<>{}[\]\\\/]/.test(t)) return false;
  // ao menos uma letra
  return /[A-Za-zÀ-ÿ]/.test(t);
}

// === Detectores de linha ===

/**
 * Linha de chat-export. Tenta capturar formato:
 *   [data hora] Nome: msg     (iOS / formato com brackets)
 *   data, hora - Nome: msg    (Android / formato com hífen)
 *   data hora - Nome: msg
 */
const CHAT_LINE_RES = [
  // [12/03/2024, 14:32:18] Nome: msg     (com colchetes)
  /^\[\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\]\s+([^:]+?):\s*(.*)$/i,
  // 12/03/2024, 14:32 - Nome: msg        (sem colchetes, com hífen)
  /^\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\s+-\s+([^:]+?):\s*(.*)$/i,
];

function matchChatLine(line: string): { author: string; message: string } | null {
  for (const re of CHAT_LINE_RES) {
    const m = line.match(re);
    if (m) return { author: cleanName(m[1]), message: (m[2] ?? '').trim() };
  }
  return null;
}

const SYSTEM_AUTHORS_RE = /(mensagens? e ligaç|messages? and calls|criou o grupo|created group|adicionou|added|removeu|removed|saiu|left|você)/i;

function isSystemAuthor(author: string): boolean {
  if (!author) return true;
  if (SYSTEM_AUTHORS_RE.test(author)) return true;
  // autor que é puramente um número longo => sistema
  if (/^[\d\s+\-()]+$/.test(author) && author.replace(/\D/g, '').length > 4) {
    // pode ser um contato sem nome; mantemos
  }
  return false;
}

// === Parsers por formato ===

function parseChatExport(lines: string[]): { leads: WhatsAppLead[]; ignored: number } {
  const byAuthor = new Map<string, { messages: string[] }>();
  let ignored = 0;

  for (const raw of lines) {
    const m = matchChatLine(raw);
    if (!m) { ignored++; continue; }
    const { author, message } = m;
    if (isSystemAuthor(author) || !isLikelyName(author)) { ignored++; continue; }
    const entry = byAuthor.get(author) ?? { messages: [] };
    if (message && entry.messages.length < 3) entry.messages.push(message);
    byAuthor.set(author, entry);
  }

  const leads: WhatsAppLead[] = [];
  for (const [author, info] of byAuthor) {
    // Tenta extrair telefone do próprio nome do autor (alguns exports trazem só o número)
    const phoneMatch = author.match(PHONE_RE);
    const phone = normalizePhone(phoneMatch?.[1]);
    const nameOnly = phone ? cleanName(author.replace(phoneMatch![0], '')) || author : author;
    const finalName = isLikelyName(nameOnly) ? nameOnly : author;

    const notes = info.messages.length > 0
      ? `WhatsApp: ${info.messages.join(' / ').slice(0, 240)}`
      : 'Importado de export do WhatsApp';

    leads.push({ name: finalName, phone, notes });
  }

  return { leads, ignored };
}

function parseContactList(lines: string[]): { leads: WhatsAppLead[]; ignored: number } {
  const leads: WhatsAppLead[] = [];
  let ignored = 0;
  let pendingName: string | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const phoneMatch = line.match(PHONE_RE);

    if (phoneMatch) {
      const phone = normalizePhone(phoneMatch[1]);
      // Remove o telefone do texto e separadores comuns
      const rest = cleanName(line.replace(phoneMatch[0], '').replace(/[,;|]/g, ' '));

      let name: string;
      if (isLikelyName(rest)) {
        name = rest;
      } else if (pendingName && isLikelyName(pendingName)) {
        name = pendingName;
        pendingName = null;
      } else {
        // sem nome — usa o próprio número como nome temporário
        name = phone ?? line;
      }
      leads.push({ name, phone, notes: 'Importado do WhatsApp' });
    } else if (isLikelyName(line)) {
      // Linha sem telefone — pode ser nome aguardando próxima linha (vCard light)
      pendingName = line;
    } else {
      ignored++;
    }
  }
  return { leads, ignored };
}

// === Função principal ===

export function parseWhatsApp(input: string): WhatsAppParseResult {
  const text = (input ?? '').replace(/\r\n/g, '\n');
  if (!text.trim()) {
    return { leads: [], format: 'empty', totalLines: 0, ignoredLines: 0 };
  }

  const lines = text.split('\n');
  const totalLines = lines.length;

  // Heurística: se >30% das primeiras 50 linhas casam com formato de chat → chat-export
  const sample = lines.slice(0, Math.min(50, lines.length));
  const chatHits = sample.filter((l) => matchChatLine(l)).length;
  const isChat = chatHits / Math.max(sample.length, 1) > 0.3;

  if (isChat) {
    const { leads, ignored } = parseChatExport(lines);
    return { leads: dedupe(leads), format: 'chat-export', totalLines, ignoredLines: ignored };
  }

  const { leads, ignored } = parseContactList(lines);
  return { leads: dedupe(leads), format: 'contact-list', totalLines, ignoredLines: ignored };
}

function dedupe(leads: WhatsAppLead[]): WhatsAppLead[] {
  const seen = new Map<string, WhatsAppLead>();
  for (const l of leads) {
    const key = (l.phone ?? '').trim() || `name:${l.name.toLowerCase()}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, l);
    } else {
      // mantém o que tiver mais info
      if (!existing.phone && l.phone) existing.phone = l.phone;
      if ((!existing.notes || existing.notes.length < (l.notes ?? '').length) && l.notes) existing.notes = l.notes;
    }
  }
  return Array.from(seen.values());
}

// === Conversão para ParsedSheet (mesmo padrão do textParser) ===

const HEADERS = ['name', 'phone', 'origin', 'notes'] as const;

export function whatsappLeadsToParsedSheet(leads: WhatsAppLead[]): ParsedSheet {
  const headers = [...HEADERS];
  const rows = leads.map((l) => ({
    name: l.name ?? '',
    phone: l.phone ?? '',
    origin: 'WhatsApp',
    notes: l.notes ?? '',
  }));
  const rawRows = rows.map((r) => headers.map((h) => (r as Record<string, unknown>)[h]));
  return {
    headers,
    rows,
    rawRows,
    sheetName: 'whatsapp-import',
    totalRows: rows.length,
  };
}
