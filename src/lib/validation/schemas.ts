// Schemas de validação Zod para todas as mutações sensíveis.
// Aplicados nos services antes de qualquer chamada ao banco.
import { z } from 'zod';

/** Remove tags HTML/script de campos de texto livre. */
export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}

/** Sanitiza um campo opcional de texto livre (para notes/description). */
function safeText(max: number) {
  return z
    .string()
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => stripHtml(v));
}

const phoneSchema = z
  .string()
  .trim()
  .max(30, 'Telefone muito longo')
  .regex(/^[\d\s()+\-]*$/, 'Telefone com caracteres inválidos');

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Nome muito curto')
  .max(200, 'Nome muito longo')
  .transform(stripHtml);

// ---------- LEADS ----------
export const leadCreateSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  origin: z.string().trim().max(50).optional().or(z.literal('')),
  product_interest: safeText(500).optional().or(z.literal('')),
});

export const leadUpdateSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema.optional(),
  origin: z.string().trim().max(50).optional().nullable(),
  product_interest: safeText(500).optional().nullable(),
  status: z.string().trim().max(40).optional(),
  notes: safeText(2000).optional().nullable(),
  last_contact_at: z.string().datetime().optional().nullable(),
  next_contact_at: z.string().datetime().optional().nullable(),
});

// ---------- CUSTOMERS ----------
export const customerCreateSchema = z.object({
  name: nameSchema,
  phone: phoneSchema.optional().nullable(),
  notes: safeText(2000).optional().nullable(),
  product_bought: safeText(200).optional().nullable(),
  purchase_date: z.string().optional().nullable(),
});

export const customerUpdateSchema = customerCreateSchema.partial();

// ---------- INTERACTIONS ----------
export const interactionCreateSchema = z.object({
  lead_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  contact_type: z.string().min(1).max(40),
  description: z.string().min(1, 'Descrição obrigatória').max(2000),
  created_by: z.string().uuid(),
  interaction_date: z.string().datetime().optional(),
});

export const interactionUpdateSchema = z.object({
  description: safeText(2000).optional(),
  contact_type: z.string().max(40).optional(),
});

// ---------- PUBLIC LEAD FORM ----------
export const publicLeadSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  origin: z.string().trim().max(50).optional(),
  product_interest: safeText(500).optional(),
  message: safeText(500).optional(),
  // Honeypot — deve estar vazio
  website: z.string().max(0, 'bot').optional().or(z.literal('')),
});

/** Escapa caracteres usados pelo PostgREST para evitar injection em filtros .or(). */
export function escapePostgrestSearch(value: string): string {
  return value.replace(/[,()'"*\\]/g, '').slice(0, 100);
}
