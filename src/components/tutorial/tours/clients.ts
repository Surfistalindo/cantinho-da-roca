import type { Tour } from '../types';

export const clientsTour: Tour = {
  id: 'clients',
  title: 'Base de Clientes',
  summary: 'Quem já comprou, com histórico e recompra.',
  version: 2,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'Diferença Lead × Cliente',
      body: 'Um <strong>Lead</strong> demonstrou interesse. Um <strong>Cliente</strong> já comprou pelo menos uma vez.',
      details:
        'Essa separação é importante porque a <strong>abordagem é diferente</strong>: com um lead você ainda está convencendo; com um cliente você está cuidando do relacionamento, oferecendo recompra, novidades e mantendo a base aquecida.',
    },
    {
      id: 'table',
      target: '[data-tour="clients-table"]',
      title: 'Tabela de clientes',
      body: 'Aqui aparecem todos os clientes com <strong>último pedido, ticket médio e recência</strong>.',
      details:
        '<ul><li><strong>Último pedido</strong>: data da compra mais recente — útil para identificar quem está sumindo.</li><li><strong>Ticket médio</strong>: valor que esse cliente costuma gastar.</li><li><strong>Recência</strong>: há quanto tempo não compra. Quem passou de 60 dias merece um contato.</li></ul>',
    },
  ],
};
