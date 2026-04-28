import type { Tour } from '../types';

export const clientsTour: Tour = {
  id: 'clients',
  title: 'Base de Clientes',
  summary: 'Quem já comprou, com histórico e recompra.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'Diferença Lead × Cliente',
      body: 'Um <strong>Lead</strong> demonstrou interesse. Um <strong>Cliente</strong> já comprou pelo menos uma vez.',
    },
    {
      id: 'table',
      target: '[data-tour="clients-table"]',
      title: 'Tabela de clientes',
      body: 'Aqui aparecem todos os clientes com <strong>último pedido, ticket médio e recência</strong>.',
    },
  ],
};
