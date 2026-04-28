import type { Tour } from '../types';

export const iaExcelTour: Tour = {
  id: 'ia-excel',
  title: 'Importação por Excel',
  summary: 'Do upload ao import: 4 etapas guiadas pela IA.',
  version: 2,
  steps: [
    {
      id: 'dropzone',
      target: '[data-tour="excel-dropzone"]',
      title: 'Arraste sua planilha',
      body: 'Aceitamos <strong>.xlsx, .xls e .csv</strong>. A primeira linha deve ter os nomes das colunas.',
      details:
        'Não precisa que sua planilha esteja no formato "certo": a IA reconhece nomes em variações ("tel", "telefone", "celular", "whats" caem todos como telefone). Apenas garanta que a <strong>primeira linha sejam títulos</strong> e não dados.',
    },
    {
      id: 'stepper',
      target: '[data-tour="excel-stepper"]',
      title: 'Etapas da importação',
      body: 'Você vai passar por <strong>Upload → Pré-visualização → Mapeamento → Revisão → Importação</strong>. A barra acompanha onde você está.',
      details:
        '<ul><li><strong>Pré-visualização</strong>: confere se o arquivo abriu certo.</li><li><strong>Mapeamento</strong>: você confirma qual coluna da planilha vira qual campo do CRM.</li><li><strong>Revisão</strong>: a IA mostra alertas (telefones inválidos, duplicados, datas estranhas).</li><li><strong>Importação</strong>: efetiva tudo. Você pode <strong>desfazer</strong> a última importação se algo sair errado.</li></ul>',
    },
    {
      id: 'history',
      target: '[data-tour="excel-history"]',
      title: 'Histórico recente',
      body: 'Veja importações anteriores, com quantas linhas foram aproveitadas e <strong>refaça mapeamentos</strong> que deram certo.',
      details:
        'Se você importa a mesma planilha mensalmente (ex.: relatório do site), ao invés de mapear tudo de novo, abra um import antigo e use <strong>"Repetir mapeamento"</strong>. Economiza minutos toda vez.',
    },
  ],
};
