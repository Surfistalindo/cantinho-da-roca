import type { Tour } from '../types';

export const telemetryTour: Tour = {
  id: 'telemetry',
  title: 'Telemetria',
  summary: 'Saúde do sistema: erros, latência, uso da IA.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'Pra que serve essa tela',
      body: 'Aqui você acompanha <strong>erros de runtime, lentidão e consumo de IA</strong>. É pra entender se o sistema está bem — não é pra uso comercial diário.',
      details:
        'Útil principalmente quando alguém do time reportou "tá lento" ou "deu erro" e você quer confirmar onde foi. Também ajuda a controlar gastos com IA: você vê quantas chamadas foram feitas hoje e em quais funcionalidades.',
    },
    {
      id: 'errors',
      target: '__viewport__',
      title: 'Erros recentes',
      body: 'A lista mostra erros capturados no front e back. <strong>Vermelho = crítico</strong> (algo quebrou pra um usuário), amarelo = alerta.',
      details:
        'Cada linha tem usuário, rota e mensagem. Se o mesmo erro aparece muitas vezes em pessoas diferentes, é bug real e merece um "try to fix" no editor. Erros isolados costumam ser rede instável ou navegador antigo.',
    },
  ],
};
