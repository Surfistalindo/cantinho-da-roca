import {
  faHandshake,
  faClockRotateLeft,
  faRotateRight,
  faHeart,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { getContactRecency } from '@/lib/contactRecency';

export type TemplateKey = 'first_contact' | 'follow_up' | 'reengagement' | 'customer_reactivation';

export interface TemplateLead {
  name: string;
  product_interest?: string | null;
  product_bought?: string | null;
  status?: string;
  last_contact_at?: string | null;
  created_at?: string;
}

export interface WhatsAppTemplate {
  key: TemplateKey;
  label: string;
  icon: IconDefinition;
  description: string;
  build: (lead: TemplateLead) => string;
}

function firstName(name: string) {
  return (name?.trim().split(/\s+/)[0] ?? '').replace(/[^\p{L}\p{N}'-]/gu, '');
}

function interestPart(lead: TemplateLead) {
  const i = lead.product_interest?.trim();
  return i ? ` no(a) ${i}` : '';
}

function boughtPart(lead: TemplateLead) {
  const i = lead.product_bought?.trim();
  return i ? ` o(a) ${i}` : ' nossos produtos';
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    key: 'first_contact',
    label: 'Primeiro contato',
    icon: faHandshake,
    description: 'Para leads novos, ainda sem conversa iniciada.',
    build: (lead) =>
      `Olá ${firstName(lead.name)}! Aqui é do Cantinho da Roça 🌿 Vi seu interesse${interestPart(lead)} e queria entender melhor como podemos te ajudar. Posso te passar mais detalhes por aqui?`,
  },
  {
    key: 'follow_up',
    label: 'Follow-up',
    icon: faClockRotateLeft,
    description: 'Retomar conversa em andamento ou aguardando resposta.',
    build: (lead) =>
      `Oi ${firstName(lead.name)}! Tudo certo? Passando para retomar nossa conversa${interestPart(lead)}. Ainda tem interesse? Fico no aguardo 😊`,
  },
  {
    key: 'reengagement',
    label: 'Reengajamento',
    icon: faRotateRight,
    description: 'Lead frio, sem contato há muito tempo.',
    build: (lead) =>
      `Olá ${firstName(lead.name)}! Faz um tempinho que não conversamos. Estamos com novidades por aqui e lembrei de você — ainda posso te ajudar com${interestPart(lead) || ' o que precisar'}? 🌱`,
  },
  {
    key: 'customer_reactivation',
    label: 'Reativar cliente',
    icon: faHeart,
    description: 'Para clientes inativos — convite carinhoso para voltar.',
    build: (lead) =>
      `Oi ${firstName(lead.name)}! 🌿 Faz um tempo que você não passa por aqui. Queria saber se ainda está gostando${boughtPart(lead)} e te avisar que temos novidades fresquinhas que podem te interessar. Posso te mostrar?`,
  },
];

export function getTemplate(key: TemplateKey): WhatsAppTemplate {
  return WHATSAPP_TEMPLATES.find((t) => t.key === key) ?? WHATSAPP_TEMPLATES[0];
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null;
  const clean = phone.replace(/\D/g, '');
  if (!clean) return null;
  const num = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function pickSuggestedTemplate(lead: TemplateLead, opts?: { interactionCount?: number }): TemplateKey {
  const interactions = opts?.interactionCount ?? 0;
  const recency = getContactRecency(lead.last_contact_at ?? null, lead.status ?? 'new', lead.created_at ?? new Date().toISOString());

  if (recency.level === 'overdue') return 'reengagement';
  if (lead.status === 'new' || interactions === 0) return 'first_contact';
  return 'follow_up';
}
