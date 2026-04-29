import type { Tour } from '../types';

export const whatsappTour: Tour = {
  id: 'whatsapp',
  title: 'WhatsApp Studio',
  summary: 'Inbox unificada, templates, régua automática e atalhos.',
  version: 3,
  steps: [
    {
      id: 'status-bar',
      target: '[data-tour="wa-status-bar"]',
      title: 'Status da conexão',
      body: 'Veja em tempo real se o WhatsApp está <strong>conectado</strong> e quantas mensagens foram enviadas, respondidas e falharam <strong>hoje</strong>.',
      placement: 'bottom',
    },
    {
      id: 'search',
      target: '[data-tour="wa-conv-search"]',
      title: 'Busca de contatos',
      body: 'Digite parte do <strong>nome</strong> ou do <strong>número</strong> para encontrar uma conversa rapidamente. Atalho: tecle <kbd>/</kbd>.',
      placement: 'right',
    },
    {
      id: 'filters',
      target: '[data-tour="wa-conv-filters"]',
      title: 'Filtros rápidos',
      body: '<strong>Todas</strong>, <strong>Não lidas</strong>, <strong>Em automação</strong>, <strong>Pausadas</strong> ou <strong>Sem resposta</strong>. Use para focar nos leads que precisam de você agora.',
      placement: 'right',
    },
    {
      id: 'list',
      target: '[data-tour="wa-conv-list"]',
      title: 'Lista de conversas',
      body: 'Cada item mostra a última mensagem. <strong>🤖 honey</strong> = automação rodando. <strong>Bolinha laranja</strong> = mensagens recebidas não respondidas. Clique no <strong>"?"</strong> ao lado do contador para ver a legenda completa.',
      placement: 'right',
    },
    {
      id: 'thread',
      target: '[data-tour="wa-thread"]',
      title: 'Histórico da conversa',
      body: 'Mensagens agrupadas por dia. Use o menu <strong>⋯</strong> no topo para copiar o número, abrir no WhatsApp Web ou pausar a automação.',
      placement: 'left',
    },
    {
      id: 'composer-templates',
      target: '[data-tour="wa-composer-templates"]',
      title: 'Templates prontos',
      body: 'Clique no <strong>raio</strong> para inserir mensagens pré-definidas. Variáveis como <code>{{nome}}</code> são substituídas automaticamente pelo nome do lead.',
      placement: 'top',
    },
    {
      id: 'composer-format',
      target: '[data-tour="wa-composer-format"]',
      title: 'Formatação WhatsApp',
      body: 'Use <strong>B / I / S / mono</strong> para envolver o texto selecionado com <code>*negrito*</code>, <code>_itálico_</code>, <code>~tachado~</code> ou <code>```mono```</code>.',
      placement: 'top',
    },
    {
      id: 'context',
      target: '[data-tour="wa-context-panel"]',
      title: 'Contexto do lead',
      body: 'À direita: identidade, status da <strong>automação</strong>, últimas mensagens e estatísticas. Em telas menores, abre num painel lateral pelo ícone de info.',
      placement: 'left',
    },
    {
      id: 'help',
      target: '[data-tour="wa-help-fab"]',
      title: 'Ajuda sempre à mão',
      body: 'O botão <strong>?</strong> abre o painel de ajuda com glossário, atalhos e boas práticas. Atalho de teclado: <kbd>?</kbd>.',
      placement: 'left',
      nextLabel: 'Concluir',
    },
  ],
};
