import type { Tour } from '../types';

export const iaScoreTour: Tour = {
  id: 'ia-score',
  title: 'Score IA',
  summary: 'A IA dá uma nota (0-100) para cada lead, indicando temperatura.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'Para que serve o Score',
      body: 'A IA analisa <strong>recência de contato, engajamento, origem e estágio</strong> e dá uma nota de 0 a 100 para cada lead. Quanto maior, mais quente.',
      details:
        'É um termômetro. Em vez de você adivinhar quem atender primeiro numa lista de 200 leads, o score ordena por probabilidade de fechamento. Leads com score ≥65 são "quentes" — devem entrar no topo da fila do dia. Leads "frios" (<35) não são lixo: só não merecem prioridade.',
    },
    {
      id: 'levels',
      target: '__viewport__',
      title: 'Filtros por nível',
      body: '<strong>Quentes ≥65</strong> = atender hoje. <strong>Mornos</strong> = nutrir. <strong>Frios</strong> = pausar. <strong>Desatualizados</strong> = score com mais de 7 dias, recalcular.',
      details:
        'O filtro "Desatualizados" é importante: o score envelhece junto com o lead. Se o último cálculo foi há mais de uma semana, a temperatura mudou (pra cima ou pra baixo). Recalcular é barato e mantém a fila do dia confiável.',
    },
    {
      id: 'recalc',
      target: '__viewport__',
      title: 'Recalcular e razão',
      body: 'O botão <strong>Recalcular</strong> processa os leads visíveis. A coluna <strong>Razão</strong> explica em uma linha por que a IA deu aquela nota.',
      details:
        'Recalcular custa créditos de IA, então o ideal é filtrar antes (ex.: só "Desatualizados" ou só "Sem score"). A "Razão" é útil pra confiar no número: se a IA diz "respondeu WhatsApp ontem + interesse explícito", você sabe que o 88 não foi chute.',
    },
  ],
};
