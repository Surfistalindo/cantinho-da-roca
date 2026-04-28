import type { Tour } from '../types';

export const dashboardTour: Tour = {
  id: 'dashboard',
  title: 'Conhecendo o Dashboard',
  summary: 'Métricas do funil, score, origens e ações rápidas.',
  version: 2,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'Bem-vindo ao seu painel',
      body: 'Aqui você acompanha em tempo real <strong>como seus leads estão se movendo</strong> pelo funil. Vamos passar pelos pontos principais.',
      details:
        'O painel é a sua <strong>visão de comando</strong>: tudo o que está acontecendo no comercial aparece resumido aqui. Não é preciso ficar abrindo várias telas — passe o olho no dashboard pela manhã para entender se o dia está saudável (volume entrando, leads sendo atendidos, conversões fechando).',
      nextLabel: 'Vamos lá',
    },
    {
      id: 'kpis',
      target: '[data-tour="dashboard-kpis"]',
      title: 'Indicadores principais',
      body: 'Os cartões no topo mostram <strong>volume de leads, conversões e ticket</strong>. Os números são tabulares para facilitar a leitura.',
      details:
        '<strong>O que cada cartão significa:</strong><ul><li><strong>Total de leads</strong>: quantos contatos você tem na base, somando todos os status.</li><li><strong>Conversões</strong>: leads que viraram cliente no período.</li><li><strong>Ticket médio</strong>: valor médio de cada venda fechada.</li></ul>Use esses números para comparar semanas ou meses e identificar tendências.',
    },
    {
      id: 'tabs',
      target: '[data-tour="dashboard-tabs"]',
      title: 'Visões disponíveis',
      body: 'Alterne entre <strong>Funil, Score e Origem</strong> para entender de onde vem o seu resultado.',
      details:
        '<ul><li><strong>Funil</strong>: mostra quantos leads estão em cada etapa (novo → contato → proposta → fechado). Serve para ver onde está travando.</li><li><strong>Score</strong>: agrupa os leads pela nota da IA — quanto maior, mais quente.</li><li><strong>Origem</strong>: revela qual canal (Instagram, indicação, site...) traz mais resultado.</li></ul>',
    },
    {
      id: 'chart',
      target: '[data-tour="dashboard-chart"]',
      title: 'Gráfico contextual',
      body: 'O gráfico se adapta à aba selecionada. Passe o mouse sobre as áreas para ver os números detalhados.',
      details:
        'Ao passar o mouse sobre o gráfico, aparece um <strong>tooltip</strong> com o valor exato daquele ponto. Se algo parecer estranho (uma queda brusca, por exemplo), clique na aba correspondente para investigar.',
    },
  ],
};
