import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '5571999999999';
const message = encodeURIComponent('Olá, vim pelo site Cantinho da Roça e gostaria de mais informações.');

export default function WhatsAppFloat() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-14 w-14 rounded-full bg-secondary text-secondary-foreground shadow-lg hover:scale-110 transition-transform"
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
