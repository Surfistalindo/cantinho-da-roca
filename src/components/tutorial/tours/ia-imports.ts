import type { Tour } from '../types';

export const iaCsvTour: Tour = {
  id: 'ia-csv',
  title: 'Importação por CSV',
  summary: 'Mesma lógica do Excel, otimizada para arquivos .csv.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'Quando usar CSV em vez de Excel',
      body: 'Use CSV quando o arquivo veio de um <strong>formulário, exportação de site ou outro CRM</strong>. É mais leve e evita problemas de formatação.',
      details:
        'CSV não tem cores, fórmulas nem múltiplas abas — é texto puro separado por vírgula ou ponto-e-vírgula. Detectamos automaticamente o separador e o encoding (UTF-8 ou Latin-1). Se você só tem .xlsx, prefira a importação de Excel.',
    },
    {
      id: 'flow',
      target: '__viewport__',
      title: 'Fluxo guiado',
      body: 'O processo é o mesmo: <strong>upload → mapear colunas → revisar alertas → importar</strong>. Você pode desfazer a última importação se algo sair errado.',
      details:
        'A IA reconhece variações de nomes de colunas ("tel", "telefone", "celular", "fone" caem todos como telefone). Na revisão, ela aponta linhas com problema (telefone inválido, duplicado da base, data estranha) — você decide o que fazer com cada uma.',
    },
  ],
};

export const iaPasteTour: Tour = {
  id: 'ia-paste',
  title: 'Importação por colagem',
  summary: 'Cole leads de qualquer lugar (texto, planilha, e-mail).',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'Quando usar',
      body: 'Tem 5-50 leads soltos num e-mail, num WhatsApp ou numa lista? Cola aqui e a IA <strong>extrai nome, telefone e o que tiver</strong>.',
      details:
        'Funciona com formatos bagunçados: lista de contatos, mensagem de equipe, células copiadas do Excel. A IA tenta identificar nome, telefone, origem e observações no meio do texto. Quanto mais estruturado o que você colar, melhor o resultado.',
    },
    {
      id: 'review',
      target: '__viewport__',
      title: 'Revisar antes de salvar',
      body: 'Antes de gravar, você confere <strong>linha por linha</strong> o que a IA entendeu. Edita o que tiver errado, descarta o que não interessar.',
      details:
        'Esse passo é essencial: extração por IA tem ~95% de acerto, mas erra em casos esquisitos (apelido confundido com nome, número de série confundido com telefone). 30 segundos de revisão evitam lixo na base.',
    },
  ],
};

export const iaWhatsAppImportTour: Tour = {
  id: 'ia-whatsapp-import',
  title: 'Importação por WhatsApp',
  summary: 'Traga conversas e contatos diretamente do seu WhatsApp.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'O que essa importação faz',
      body: 'Lê <strong>contatos e conversas</strong> da sua sessão de WhatsApp e cria leads no CRM, com histórico já vinculado.',
      details:
        'Diferente das outras importações, aqui você não traz uma planilha — você conecta uma sessão de WhatsApp e escolhe quais contatos virar lead. As últimas mensagens entram como interações iniciais, então o lead já nasce com contexto.',
    },
    {
      id: 'select',
      target: '__viewport__',
      title: 'Escolher quem virar lead',
      body: 'Marque os contatos relevantes — <strong>nem todo número precisa virar lead</strong>. Família e fornecedor ficam de fora.',
      details:
        'Filtros úteis: contatos com mensagem nos últimos 30 dias, contatos com mais de N mensagens, contatos não-grupo. Você pode importar em lotes e ajustar — não precisa decidir tudo de uma vez.',
    },
  ],
};
