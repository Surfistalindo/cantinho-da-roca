import type { Tour } from '../types';

export const boardsTour: Tour = {
  id: 'boards',
  title: 'Quadros (Boards)',
  summary: 'Grupos, colunas tipadas e status pills.',
  version: 2,
  steps: [
    {
      id: 'groups',
      target: '__viewport__',
      title: 'Grupos colapsáveis',
      body: 'Cada grupo agrupa itens (ex.: <em>Esta semana</em>, <em>Atrasados</em>). Clique no título para colapsar.',
      details:
        'Grupos servem para <strong>organizar visualmente</strong> sem precisar de várias telas. Você pode colapsar grupos que não está usando agora para focar só no que importa hoje. O estado de colapsado é lembrado por usuário.',
    },
    {
      id: 'columns',
      target: '__viewport__',
      title: 'Colunas tipadas',
      body: 'Status, pessoa, data, número, texto. Cada tipo tem o editor certo (popover, datepicker etc.).',
      details:
        'O <strong>tipo da coluna</strong> define como você edita: status abre uma lista colorida, data abre calendário, pessoa abre busca de membros da equipe, número aceita só dígitos. Isso evita erros de digitação e mantém os dados consistentes.',
    },
  ],
};
