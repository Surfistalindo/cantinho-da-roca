// ========================================
// Configuração centralizada do sistema
// ========================================
//
// SEGURANÇA: este arquivo é compilado para o bundle do cliente.
// NUNCA armazene aqui senhas, tokens, chaves privadas ou qualquer
// segredo. Use Lovable Cloud → Secrets para credenciais sensíveis.
//
// O cadastro do administrador é feito diretamente em Lovable Cloud →
// Users (criação manual). Senhas são gerenciadas pelo Supabase Auth
// e podem ser redefinidas via fluxo "Esqueci minha senha" na tela de
// login (envia link de recuperação para o e-mail cadastrado).

export const APP_CONFIG = {
  /** Número do WhatsApp para contato (com código do país) */
  whatsappNumber: '5571991026884',

  /** Opções de status dos leads — funil comercial */
  leadStatuses: [
    { value: 'new', label: 'Novo lead', color: 'bg-info-soft text-info' },
    { value: 'contacting', label: 'Em contato', color: 'bg-primary/10 text-primary' },
    { value: 'negotiating', label: 'Negociação', color: 'bg-warning-soft text-warning' },
    { value: 'won', label: 'Cliente', color: 'bg-success-soft text-success' },
    { value: 'lost', label: 'Perdido', color: 'bg-muted text-muted-foreground' },
  ] as const,

  /** Opções de origem */
  leadOrigins: ['Site', 'WhatsApp', 'Instagram', 'Indicação', 'Outro'] as const,
};

export type LeadStatus = (typeof APP_CONFIG.leadStatuses)[number]['value'];
