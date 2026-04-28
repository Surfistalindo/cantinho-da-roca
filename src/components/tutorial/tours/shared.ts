import type { Tour } from '../types';

export const fallbackTour: Tour = {
  id: 'fallback',
  title: 'Conheça o sistema',
  summary: 'Atalhos essenciais e navegação.',
  version: 1,
  steps: [
    {
      id: 'sidebar',
      target: '[data-tour="sidebar"]',
      title: 'Menu lateral',
      body: 'Toda a navegação principal fica aqui: <strong>Dashboard, Leads, Pipeline, Clientes, IA</strong>.',
    },
    {
      id: 'palette',
      target: '__viewport__',
      title: 'Command palette',
      body: 'Aperte <strong>⌘K</strong> (ou Ctrl+K) para buscar leads, ações e telas em qualquer lugar.',
    },
    {
      id: 'help',
      target: '[data-tour="help-button"]',
      title: 'Sempre que precisar',
      body: 'O botão <strong>?</strong> no canto reabre este tour, mostra dicas rápidas e atalhos.',
    },
  ],
};
