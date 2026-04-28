import type { Tour } from '../types';

export const whatsappTour: Tour = {
  id: 'whatsapp',
  title: 'WhatsApp',
  summary: 'Disparos rápidos, templates e log de mensagens.',
  version: 1,
  steps: [
    {
      id: 'intro',
      target: '__viewport__',
      title: 'Atalho para conversar',
      body: 'A partir de qualquer lead, abra o WhatsApp já com <strong>mensagem pré-formatada</strong> usando templates seus.',
    },
  ],
};
