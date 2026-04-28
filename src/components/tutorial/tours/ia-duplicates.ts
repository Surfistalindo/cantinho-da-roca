import type { Tour } from '../types';

export const iaDuplicatesTour: Tour = {
  id: 'ia-duplicates',
  title: 'Duplicados',
  summary: 'Encontre e mescle leads repetidos sem perder histórico.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'Por que isso importa',
      body: 'Leads duplicados <strong>poluem relatórios</strong>, dividem o histórico de conversa em dois lugares e fazem você atender o mesmo cliente duas vezes. A IA acha e mescla.',
      details:
        'Duplicados acontecem em três cenários típicos: importação de planilha que já tinha gente cadastrada; lead preencheu o form duas vezes; mesma pessoa entrou por canais diferentes (Instagram + site). A mescla preserva todas as interações — nada de histórico é perdido.',
    },
    {
      id: 'scan',
      target: '__viewport__',
      title: 'Varrer a base',
      body: 'Clique em <strong>Varrer</strong> para a IA agrupar por <strong>telefone exato</strong> e <strong>nome similar</strong>. Pode demorar alguns segundos em bases grandes.',
      details:
        '"Telefone exato" é o critério mais seguro — quase sempre é a mesma pessoa. "Nome similar" pega variações ("João Silva" vs "Joao da Silva") e merece olhar antes de mesclar, porque pode haver homônimos.',
    },
    {
      id: 'merge',
      target: '__viewport__',
      title: 'Escolher o "principal" e mesclar',
      body: 'Em cada grupo, marque qual lead permanece (default = mais antigo). Os outros viram histórico do principal.',
      details:
        'O lead "principal" mantém o ID, o status atual e os dados do cabeçalho. Os outros são removidos como entidade, mas suas <strong>interações são transferidas</strong> para o principal. Não dá pra desfazer uma mescla — então confira a escolha antes de confirmar.',
    },
  ],
};
