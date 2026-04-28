import type { Tour } from '../types';

export const dashboardTour: Tour = {
  id: 'dashboard',
  title: 'Conhecendo o Dashboard',
  summary: 'Métricas do funil, score, origens e ações rápidas.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'Bem-vindo ao seu painel',
      body: 'Aqui você acompanha em tempo real <strong>como seus leads estão se movendo</strong> pelo funil. Vamos passar pelos pontos principais.',
      nextLabel: 'Vamos lá',
    },
    {
      id: 'kpis',
      target: '[data-tour="dashboard-kpis"]',
      title: 'Indicadores principais',
      body: 'Os cartões no topo mostram <strong>volume de leads, conversões e ticket</strong>. Os números são tabulares para facilitar a leitura.',
    },
    {
      id: 'tabs',
      target: '[data-tour="dashboard-tabs"]',
      title: 'Visões disponíveis',
      body: 'Alterne entre <strong>Funil, Score e Origem</strong> para entender de onde vem o seu resultado.',
    },
    {
      id: 'chart',
      target: '[data-tour="dashboard-chart"]',
      title: 'Gráfico contextual',
      body: 'O gráfico se adapta à aba selecionada. Passe o mouse sobre as áreas para ver os números detalhados.',
    },
  ],
};
