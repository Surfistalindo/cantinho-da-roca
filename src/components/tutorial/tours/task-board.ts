import type { Tour } from '../types';

export const taskBoardTour: Tour = {
  id: 'task-board',
  title: 'Board de tarefas',
  summary: 'Kanban interno do time, separado do funil de leads.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'O que cabe num board',
      body: 'Boards são pra <strong>tarefas internas</strong>: campanhas, post de Instagram, troca de fornecedor, follow-up de pedido. Não confunde com o pipeline de leads.',
      details:
        'A diferença é importante: no <strong>Pipeline</strong> as colunas são fases do funil de venda (Novo → Contato → Negociação → Cliente). Num <strong>Board</strong>, as colunas são o que você quiser (A fazer / Fazendo / Feito; ou Backlog / Sprint / Review). É o Trello/Monday do time.',
    },
    {
      id: 'columns',
      target: '__viewport__',
      title: 'Colunas e cards',
      body: 'Arraste cards entre colunas pra mudar o status. Clique para abrir e editar título, descrição, responsável e prazo.',
      details:
        'Cada coluna tem uma cor e um contador. Cards podem ser anexados a um lead (vira "tarefa daquele lead") ou ficar soltos como tarefa interna. Atribua um responsável pra que o card apareça no "Meu trabalho" da pessoa.',
    },
    {
      id: 'workspace',
      target: '__viewport__',
      title: 'Boards vivem em áreas',
      body: 'Cada board pertence a uma <strong>área de trabalho</strong> (sidebar à esquerda). Crie áreas por time ou projeto pra organizar.',
      details:
        'Exemplos de áreas úteis: "Marketing" (boards de campanha), "Operação" (logística, fornecedores), "Comercial" (apoio ao funil). Você arrasta boards entre áreas a qualquer momento na sidebar.',
    },
  ],
};
