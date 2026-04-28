import type { Tour } from '../types';

export const pipelineTour: Tour = {
  id: 'pipeline',
  title: 'Pipeline de vendas',
  summary: 'Estágios visuais, drag-and-drop e taxa de conversão.',
  version: 1,
  steps: [
    {
      id: 'board',
      target: '[data-tour="pipeline-board"]',
      title: 'Quadro Kanban',
      body: 'Cada coluna é um <strong>estágio do funil</strong>. Os cards são leads em movimento.',
    },
    {
      id: 'drag',
      target: '[data-tour="pipeline-board"]',
      title: 'Arrastar para mover',
      body: 'Arraste e solte um card entre colunas para <strong>avançar ou retroceder</strong> o lead. O histórico é registrado automaticamente.',
    },
  ],
};
