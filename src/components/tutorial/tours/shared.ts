import type { Tour } from '../types';

export const fallbackTour: Tour = {
  id: 'fallback',
  title: 'Conheça o sistema',
  summary: 'Atalhos essenciais e navegação.',
  version: 2,
  steps: [
    {
      id: 'sidebar',
      target: '[data-tour="sidebar"]',
      title: 'Menu lateral',
      body: 'Toda a navegação principal fica aqui: <strong>Dashboard, Leads, Pipeline, Clientes, IA</strong>.',
      details:
        'A barra lateral é fixa e não muda quando você navega — sempre que quiser ir para outra área, basta clicar aqui. Cada item tem um ícone para você reconhecer rápido. Você pode <strong>colapsar a barra</strong> no botão do topo para ganhar espaço.',
    },
    {
      id: 'palette',
      target: '__viewport__',
      title: 'Command palette',
      body: 'Aperte <strong>⌘K</strong> (ou Ctrl+K) para buscar leads, ações e telas em qualquer lugar.',
      details:
        'É o jeito mais rápido de fazer <strong>qualquer coisa</strong> sem tirar as mãos do teclado: digite "leads" para abrir a tela, digite o nome de um lead para ir direto, digite "novo" para criar. Pense como o "Spotlight" do Mac, só que dentro do CRM.',
    },
    {
      id: 'help',
      target: '[data-tour="help-button"]',
      title: 'Sempre que precisar',
      body: 'O botão <strong>?</strong> no canto reabre este tour, mostra dicas rápidas e atalhos.',
      details:
        'Esqueceu como faz alguma coisa? Clique no <strong>?</strong> no canto inferior direito da tela. Ele sabe em qual tela você está e abre o tutorial daquela tela específica. Você pode reabrir quantas vezes quiser, sem prejuízo.',
    },
  ],
};
