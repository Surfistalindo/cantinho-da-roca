import type { Tour } from '../types';

export const boardsTour: Tour = {
  id: 'boards',
  title: 'Quadros (Boards)',
  summary: 'Grupos, colunas tipadas e status pills.',
  version: 1,
  steps: [
    {
      id: 'groups',
      target: '__viewport__',
      title: 'Grupos colapsáveis',
      body: 'Cada grupo agrupa itens (ex.: <em>Esta semana</em>, <em>Atrasados</em>). Clique no título para colapsar.',
    },
    {
      id: 'columns',
      target: '__viewport__',
      title: 'Colunas tipadas',
      body: 'Status, pessoa, data, número, texto. Cada tipo tem o editor certo (popover, datepicker etc.).',
    },
  ],
};
