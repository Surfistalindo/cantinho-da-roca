import type { Tour } from '../types';

export const pipelineTour: Tour = {
  id: 'pipeline',
  title: 'Pipeline de vendas',
  summary: 'KPIs, filtros, drag-and-drop entre estágios e criação rápida.',
  version: 3,
  steps: [
    {
      id: 'kpis',
      target: '[data-tour="pipeline-kpis"]',
      title: 'Indicadores do funil',
      body: 'Acompanhe rapidamente <strong>quantos leads estão ativos</strong>, quantos são prioritários, sua <strong>taxa de conversão</strong> e o tempo médio até a venda.',
      details:
        '"No funil" mostra leads em <em>novo, em contato e negociando</em> (exclui ganhos/perdidos). "Conversão" é ganhos ÷ (ganhos + perdidos). "Tempo médio" usa apenas leads ganhos.',
    },
    {
      id: 'filters',
      target: '[data-tour="pipeline-filters"]',
      title: 'Filtros & busca',
      body: 'Refine o quadro por <strong>nome/telefone, origem, responsável</strong> ou nível de prioridade. Atalho: pressione <kbd>/</kbd> para focar a busca.',
    },
    {
      id: 'board',
      target: '[data-tour="pipeline-board"]',
      title: 'Quadro Kanban',
      body: 'Cada coluna é um <strong>estágio do funil</strong>. Arraste e solte um card para <strong>avançar ou retroceder</strong> o lead. Use o <strong>+</strong> no topo da coluna para criar um lead já naquela etapa.',
      details:
        'O sistema atualiza o status no banco em tempo real. Se errar, basta arrastar de volta. Cards "hot" e urgentes ficam visíveis pelo selo no topo.',
    },
  ],
};
