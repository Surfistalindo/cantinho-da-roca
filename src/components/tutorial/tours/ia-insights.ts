import type { Tour } from '../types';

export const iaInsightsTour: Tour = {
  id: 'ia-insights',
  title: 'Vibe (Insights)',
  summary: 'Mensagens prontas e diagnósticos automáticos por lead.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'O que a Vibe gera',
      body: 'Para cada lead, a IA escreve uma <strong>mensagem de follow-up personalizada</strong> e um diagnóstico curto da situação atual.',
      details:
        'Não é mensagem genérica. A Vibe usa o nome, o produto de interesse, a última conversa e o tempo sem contato pra montar algo que parece escrito por você. Bom pra reativar listas grandes sem soar robótico.',
    },
    {
      id: 'use',
      target: '__viewport__',
      title: 'Copiar e enviar',
      body: 'Botão <strong>Copiar</strong> coloca a mensagem na área de transferência. O ícone do <strong>WhatsApp</strong> abre o chat já com o texto pronto.',
      details:
        'Sempre revise antes de enviar — a IA acerta o tom, mas você conhece o cliente. Editar 1-2 palavras costuma ser suficiente. Se a mensagem não bater com a realidade do lead, clique em "Regenerar" pra outra versão.',
    },
    {
      id: 'refresh',
      target: '__viewport__',
      title: 'Quando atualizar',
      body: 'Os insights envelhecem. Se um lead recebeu interação nova depois da geração, clique em <strong>Atualizar</strong> pra incorporar o que mudou.',
      details:
        'Bom hábito: gerar insights pela manhã pra fila do dia, e atualizar pontualmente os leads que tiveram movimento. Não precisa rodar tudo de novo — só os afetados.',
    },
  ],
};
