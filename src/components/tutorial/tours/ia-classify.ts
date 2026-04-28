import type { Tour } from '../types';

export const iaClassifyTour: Tour = {
  id: 'ia-classify',
  title: 'Classificação de status',
  summary: 'A IA sugere em que estágio do funil cada lead deveria estar.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'O que essa tela faz',
      body: 'A IA lê o histórico de cada lead (interações, WhatsApp, tempo sem contato) e <strong>sugere o status correto</strong> no funil. Você revisa e aplica.',
      details:
        'Em vez de você abrir lead por lead pra decidir se ainda é "novo" ou já virou "em contato"/"negociação", a IA faz esse trabalho repetitivo. Você só confirma — ou ignora — cada sugestão. Útil principalmente depois de importar uma base nova ou quando ficou tempo sem mexer no CRM.',
    },
    {
      id: 'kpis',
      target: '__viewport__',
      title: 'Os números no topo',
      body: '<strong>Total</strong> = leads visíveis. <strong>Em conflito</strong> = a IA discorda do status atual. <strong>Auto-aplicáveis</strong> = sugestões com confiança ≥80%, seguras de aplicar em massa.',
      details:
        'Os "auto-aplicáveis" são o atalho mais útil: se você confia no critério, clica em "Classificar visíveis" e a IA aplica de uma vez todas as sugestões com alta confiança. Os "em conflito" merecem revisão manual — geralmente são leads onde algo mudou recentemente.',
    },
    {
      id: 'filters',
      target: '__viewport__',
      title: 'Filtros e confiança mínima',
      body: 'Use <strong>Todos / Com sugestão / Em conflito / Sem sugestão</strong> para focar. O slider <strong>Min. confiança</strong> esconde sugestões fracas.',
      details:
        'Fluxo recomendado:<ul><li>Suba a confiança pra 70-80% e filtre por "Em conflito".</li><li>Revise um por um — a coluna "Razão" explica por que a IA sugeriu aquele status.</li><li>Aplique os que fazem sentido. Os fracos (≤50%) ignore por enquanto.</li></ul>',
    },
    {
      id: 'actions',
      target: '__viewport__',
      title: 'Aplicar ou ignorar',
      body: 'Em cada linha: <strong>Aplicar</strong> (✓) aceita a sugestão, <strong>X</strong> descarta. O botão grande <strong>Classificar visíveis</strong> aplica em lote tudo que está na tela.',
      details:
        'Quando você "aplica", o status do lead muda imediatamente no CRM e ele já entra no funil correto (Pipeline e Leads refletem na hora). Se errar, basta entrar no lead e mudar o status manualmente — nada é irreversível.',
    },
  ],
};
