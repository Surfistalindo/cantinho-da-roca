import type { Tour } from '../types';

export const leadsTour: Tour = {
  id: 'leads',
  title: 'Gerenciando Leads',
  summary: 'Buscar, filtrar, criar e mover leads pelo pipeline.',
  version: 1,
  steps: [
    {
      id: 'search',
      target: '[data-tour="leads-search"]',
      title: 'Busca rápida',
      body: 'Pesquise por <strong>nome, telefone ou e-mail</strong>. A busca é instantânea, sem precisar apertar Enter.',
    },
    {
      id: 'new',
      target: '[data-tour="leads-new"]',
      title: 'Criar novo lead',
      body: 'Clique aqui ou use o atalho <strong>N</strong> para criar um lead manualmente.',
    },
    {
      id: 'view-toggle',
      target: '[data-tour="leads-view-toggle"]',
      title: 'Tabela ou Kanban',
      body: 'Alterne entre a <strong>tabela densa</strong> (estilo Monday) e o <strong>Kanban</strong> visual por estágio.',
    },
    {
      id: 'table',
      target: '[data-tour="leads-table"]',
      title: 'Tabela inline',
      body: 'Clique em qualquer célula para editar direto. <strong>Status</strong> e <strong>estágio</strong> mudam com 1 clique.',
    },
    {
      id: 'row-action',
      target: '[data-tour="leads-table"]',
      title: 'Abrir detalhe',
      body: 'Um clique na linha abre o painel lateral com <strong>histórico completo, anotações e ações de WhatsApp</strong>.',
    },
  ],
};
