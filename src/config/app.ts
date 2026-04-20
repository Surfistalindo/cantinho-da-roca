// ========================================
// Configuração centralizada do sistema
// Altere os valores abaixo conforme necessário
// ========================================

export const APP_CONFIG = {
  /** Número do WhatsApp para contato (com código do país) */
  whatsappNumber: '5571991026884',

  /** Credenciais padrão do administrador
   *  Use estas credenciais no primeiro acesso.
   *  Após o login, altere a senha nas configurações do sistema.
   *
   *  Email: admin@cantinhodaroca.com
   *  Senha: Admin@Roca2024!
   */
  adminEmail: 'admin@cantinhodaroca.com',
  adminDefaultPassword: 'Admin@Roca2024!',

  /** Opções de status dos leads */
  leadStatuses: [
    { value: 'new', label: 'Novo', color: 'bg-info-soft text-info' },
    { value: 'negotiating', label: 'Negociando', color: 'bg-warning-soft text-warning' },
    { value: 'sold', label: 'Vendido', color: 'bg-success-soft text-success' },
    { value: 'no_response', label: 'Sem resposta', color: 'bg-muted text-muted-foreground' },
  ] as const,

  /** Opções de origem */
  leadOrigins: ['WhatsApp', 'Instagram', 'Indicação', 'Outro'] as const,
};

export type LeadStatus = (typeof APP_CONFIG.leadStatuses)[number]['value'];
