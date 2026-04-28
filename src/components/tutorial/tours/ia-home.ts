import type { Tour } from '../types';

export const iaHomeTour: Tour = {
  id: 'ia-home',
  title: 'Central de IA',
  summary: 'Importação, classificação, score e assistente.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'O que a IA faz por você',
      body: 'A Central de IA acelera tarefas repetitivas: <strong>importa planilhas, deduplica, classifica leads</strong> e responde perguntas sobre sua base.',
    },
    {
      id: 'cards',
      target: '[data-tour="ia-cards"]',
      title: 'Funcionalidades',
      body: 'Cada card abre uma ferramenta. Comece pela <strong>Importação por Excel</strong> se você ainda não trouxe sua base.',
    },
  ],
};
