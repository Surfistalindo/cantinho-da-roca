import type { Tour } from '../types';

export const iaAssistantTour: Tour = {
  id: 'ia-assistant',
  title: 'Assistente Comercial IA',
  summary: 'Converse com sua base em linguagem natural.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'Pergunte qualquer coisa sobre seus leads',
      body: 'Digite em português, como se fosse um analista da equipe: <em>"quantos leads quentes essa semana?"</em>, <em>"liste quem não recebe contato há 14 dias"</em>, <em>"qual origem converte mais?"</em>',
      details:
        'O assistente lê leads, interações e WhatsApp em tempo real. Ele <strong>não inventa números</strong> — sempre cita os dados da sua base. Se a pergunta não fizer sentido com os dados disponíveis, ele avisa em vez de chutar.',
    },
    {
      id: 'suggestions',
      target: '__viewport__',
      title: 'Perguntas sugeridas',
      body: 'Quando a tela está vazia, mostramos <strong>perguntas prontas</strong>. Clique para enviar — bom ponto de partida pra entender do que ele é capaz.',
      details:
        'As sugestões cobrem os usos mais comuns: priorização ("quem atender hoje?"), diagnóstico ("por que perdemos esses leads?"), follow-up ("redija mensagem pra reativar leads frios"). Use como inspiração e adapte ao seu vocabulário.',
    },
    {
      id: 'history',
      target: '__viewport__',
      title: 'Conversas salvas',
      body: 'A coluna da esquerda guarda <strong>conversas anteriores</strong>. Pode reabrir, continuar ou criar uma nova a qualquer momento.',
      details:
        'Cada conversa é independente — o assistente não "vaza" contexto entre elas. Útil quando você analisa coisas diferentes em paralelo (ex.: uma conversa pra "fechamento da semana", outra pra "qualidade da base"). Apague o que não serve mais pra manter a lista limpa.',
    },
  ],
};
