import type { Tour } from '../types';

export const pipelineTour: Tour = {
  id: 'pipeline',
  title: 'Pipeline de vendas',
  summary: 'Estágios visuais, drag-and-drop e taxa de conversão.',
  version: 2,
  steps: [
    {
      id: 'board',
      target: '[data-tour="pipeline-board"]',
      title: 'Quadro Kanban',
      body: 'Cada coluna é um <strong>estágio do funil</strong>. Os cards são leads em movimento.',
      details:
        'Pense em cada coluna como uma <strong>fase da venda</strong>: leads "novos" precisam de primeiro contato; leads em "negociação" precisam de proposta; e assim por diante. Quanto mais para a direita, mais perto de fechar.',
    },
    {
      id: 'drag',
      target: '[data-tour="pipeline-board"]',
      title: 'Arrastar para mover',
      body: 'Arraste e solte um card entre colunas para <strong>avançar ou retroceder</strong> o lead. O histórico é registrado automaticamente.',
      details:
        'Clique e segure o card, depois arraste para outra coluna e solte. O sistema registra <strong>quem moveu, quando e de qual estágio para qual</strong> — essas informações ficam no histórico do lead. Se errar, basta arrastar de volta.',
    },
  ],
};
