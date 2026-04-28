import type { Tour } from '../types';

export const iaExcelTour: Tour = {
  id: 'ia-excel',
  title: 'Importação por Excel',
  summary: 'Do upload ao import: 4 etapas guiadas pela IA.',
  version: 1,
  steps: [
    {
      id: 'dropzone',
      target: '[data-tour="excel-dropzone"]',
      title: 'Arraste sua planilha',
      body: 'Aceitamos <strong>.xlsx, .xls e .csv</strong>. A primeira linha deve ter os nomes das colunas.',
    },
    {
      id: 'stepper',
      target: '[data-tour="excel-stepper"]',
      title: 'Etapas da importação',
      body: 'Você vai passar por <strong>Upload → Pré-visualização → Mapeamento → Revisão → Importação</strong>. A barra acompanha onde você está.',
    },
    {
      id: 'history',
      target: '[data-tour="excel-history"]',
      title: 'Histórico recente',
      body: 'Veja importações anteriores, com quantas linhas foram aproveitadas e <strong>refaça mapeamentos</strong> que deram certo.',
    },
  ],
};
