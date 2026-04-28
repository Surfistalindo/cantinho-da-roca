import type { Tour } from '../types';

export const whatsappTour: Tour = {
  id: 'whatsapp',
  title: 'WhatsApp',
  summary: 'Disparos rápidos, templates e log de mensagens.',
  version: 2,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'Atalho para conversar',
      body: 'A partir de qualquer lead, abra o WhatsApp já com <strong>mensagem pré-formatada</strong> usando templates seus.',
      details:
        'No painel do lead há um botão <strong>"Enviar WhatsApp"</strong>. Ao clicar, abre o app do WhatsApp Web (ou celular) já no chat correto, com a mensagem do template escolhido pronta para revisar e enviar. Você economiza tempo e mantém o tom padronizado.',
    },
  ],
};
