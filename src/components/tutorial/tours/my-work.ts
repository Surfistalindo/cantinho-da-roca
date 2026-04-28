import type { Tour } from '../types';

export const myWorkTour: Tour = {
  id: 'my-work',
  title: 'Meu trabalho',
  summary: 'Sua caixa de entrada do dia: tarefas e leads que pedem ação.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'Por onde começar o dia',
      body: 'Esta tela junta <strong>tarefas atribuídas a você</strong> e <strong>leads que precisam de retorno</strong>. Pense como sua "caixa de entrada".',
      details:
        'Em vez de abrir Dashboard, depois Leads, depois Pipeline pra descobrir o que fazer, "Meu trabalho" mostra direto: o que tem prazo hoje, quem está sem contato há tempo demais, o que ficou aberto na sua mão. Ideal pra abrir logo cedo.',
    },
    {
      id: 'priority',
      target: '__viewport__',
      title: 'Ordem importa',
      body: 'Itens são ordenados por <strong>urgência</strong>: vencido primeiro, depois de hoje, depois futuros. Score IA influencia o desempate.',
      details:
        'Se um lead tem score 90 e outro 40 com o mesmo prazo, o de score 90 sobe — porque a probabilidade de fechar é maior. Você não precisa lembrar dessa lógica; só ir resolvendo de cima pra baixo.',
    },
    {
      id: 'actions',
      target: '__viewport__',
      title: 'Resolver sem sair daqui',
      body: 'Clique numa linha para abrir o lead em painel lateral, sem perder o contexto da lista.',
      details:
        'O painel lateral tem tudo: histórico, ações rápidas (mudar status, agendar próximo contato, abrir WhatsApp). Quando fechar, você volta pra lista exatamente onde estava — fluxo desenhado pra você processar 10-20 itens em sequência.',
    },
  ],
};
