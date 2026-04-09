// ========================================
// Configuração centralizada do sistema
// Altere os valores abaixo conforme necessário
// ========================================

export const APP_CONFIG = {
  /** Número do WhatsApp para contato (com código do país) */
  whatsappNumber: '5571999999999',

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
    { value: 'new', label: 'Novo', color: 'bg-blue-100 text-blue-800' },
    { value: 'negotiating', label: 'Negociando', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'sold', label: 'Vendido', color: 'bg-green-100 text-green-800' },
    { value: 'no_response', label: 'Sem resposta', color: 'bg-gray-100 text-gray-800' },
  ] as const,

  /** Opções de origem */
  leadOrigins: ['WhatsApp', 'Instagram', 'Indicação', 'Outro'] as const,
};

export type LeadStatus = (typeof APP_CONFIG.leadStatuses)[number]['value'];
