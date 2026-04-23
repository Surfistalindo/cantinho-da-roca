/**
 * Dicionário de sinônimos por campo do CRM.
 * Usado pela heurística de mapeamento de colunas.
 * Chaves são normalizadas (lowercase, sem acentos, sem espaços/pontuação).
 */
export type CrmFieldKey =
  | 'name'
  | 'phone'
  | 'origin'
  | 'product_interest'
  | 'status'
  | 'next_contact_at'
  | 'notes'
  | 'ignore';

export const CRM_FIELD_LABELS: Record<CrmFieldKey, string> = {
  name: 'Nome',
  phone: 'Telefone',
  origin: 'Origem',
  product_interest: 'Produto / Interesse',
  status: 'Status',
  next_contact_at: 'Próximo contato',
  notes: 'Observações',
  ignore: 'Ignorar',
};

export const FIELD_DICTIONARY: Record<Exclude<CrmFieldKey, 'ignore'>, string[]> = {
  name: ['nome', 'cliente', 'contato', 'lead', 'razaosocial', 'comprador', 'pessoa', 'fullname', 'name'],
  phone: ['telefone', 'celular', 'whatsapp', 'whats', 'fone', 'tel', 'phone', 'numero', 'mobile'],
  origin: ['origem', 'fonte', 'canal', 'campanha', 'origemdolead', 'source', 'midia'],
  product_interest: ['produto', 'interesse', 'item', 'servico', 'oquequer', 'desejo', 'pedido'],
  status: ['status', 'etapa', 'situacao', 'fase', 'estagio', 'stage'],
  next_contact_at: ['retorno', 'followup', 'proximocontato', 'proximadata', 'agendamento', 'data', 'datadoretorno'],
  notes: ['observacoes', 'observacao', 'notas', 'nota', 'obs', 'comentarios', 'comentario', 'historico', 'descricao'],
};

export function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}
