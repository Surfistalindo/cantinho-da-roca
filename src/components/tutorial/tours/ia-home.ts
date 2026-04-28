import type { Tour } from '../types';

export const iaHomeTour: Tour = {
  id: 'ia-home',
  title: 'Central de IA',
  summary: 'Importação, classificação, score e assistente.',
  version: 2,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'O que a IA faz por você',
      body: 'A Central de IA acelera tarefas repetitivas: <strong>importa planilhas, deduplica, classifica leads</strong> e responde perguntas sobre sua base.',
      details:
        'Em vez de cadastrar lead por lead na mão, ou tentar adivinhar quem está mais quente, a IA <strong>analisa os dados</strong> e devolve respostas práticas: "esses 5 leads são duplicados", "esse lead tem score 92, atenda primeiro", "essa planilha tem 200 linhas válidas para importar".',
    },
    {
      id: 'cards',
      target: '[data-tour="ia-cards"]',
      title: 'Funcionalidades',
      body: 'Cada card abre uma ferramenta. Comece pela <strong>Importação por Excel</strong> se você ainda não trouxe sua base.',
      details:
        'Sugestão de ordem para quem está começando:<ul><li>1. <strong>Importação Excel</strong> — traga sua base atual.</li><li>2. <strong>Classificação</strong> — deixe a IA marcar prioridade e estágio.</li><li>3. <strong>Assistente</strong> — faça perguntas em linguagem natural ("quantos leads quentes essa semana?").</li></ul>',
    },
  ],
};
