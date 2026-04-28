import type { Tour } from '../types';

export const leadsTour: Tour = {
  id: 'leads',
  title: 'Gerenciando Leads',
  summary: 'Buscar, filtrar, criar e mover leads pelo pipeline.',
  version: 2,
  steps: [
    {
      id: 'search',
      target: '[data-tour="leads-search"]',
      title: 'Busca rápida',
      body: 'Pesquise por <strong>nome, telefone ou e-mail</strong>. A busca é instantânea, sem precisar apertar Enter.',
      details:
        'A busca é <strong>tolerante</strong>: pode digitar só parte do nome ("mar" encontra "Mariana"), telefone com ou sem DDD, e ignora maiúsculas/minúsculas. Para limpar, apague o texto ou clique no X.',
    },
    {
      id: 'new',
      target: '[data-tour="leads-new"]',
      title: 'Criar novo lead',
      body: 'Clique aqui ou use o atalho <strong>N</strong> para criar um lead manualmente.',
      details:
        'Use quando alguém entrar em contato fora dos canais automáticos (ligação, indicação na rua, evento). Preencha pelo menos <strong>nome e telefone</strong> — o resto pode ser completado depois pela IA ou no histórico.',
    },
    {
      id: 'view-toggle',
      target: '[data-tour="leads-view-toggle"]',
      title: 'Tabela ou Kanban',
      body: 'Alterne entre a <strong>tabela densa</strong> (estilo Monday) e o <strong>Kanban</strong> visual por estágio.',
      details:
        '<ul><li><strong>Tabela</strong>: melhor para enxergar muitos leads de uma vez, ordenar e editar em massa.</li><li><strong>Kanban</strong>: melhor para entender visualmente em que etapa cada lead está e arrastar entre colunas.</li><li><strong>Cards</strong>: visão intermediária com mais detalhes por lead.</li></ul>',
    },
    {
      id: 'table',
      target: '[data-tour="leads-table"]',
      title: 'Tabela inline',
      body: 'Clique em qualquer célula para editar direto. <strong>Status</strong> e <strong>estágio</strong> mudam com 1 clique.',
      details:
        'Não precisa abrir o lead para fazer pequenas alterações: clique no nome para renomear, no status para trocar (vira menu), na prioridade para alterar. As mudanças salvam <strong>automaticamente</strong> assim que você sai da célula.',
    },
    {
      id: 'row-action',
      target: '[data-tour="leads-table"]',
      title: 'Abrir detalhe',
      body: 'Um clique na linha abre o painel lateral com <strong>histórico completo, anotações e ações de WhatsApp</strong>.',
      details:
        'O painel lateral concentra <strong>tudo sobre o lead</strong>: conversas, observações, atividades anteriores, score da IA e botões para enviar mensagem direto pelo WhatsApp. Para fechar, clique fora ou aperte <strong>Esc</strong>.',
    },
  ],
};
