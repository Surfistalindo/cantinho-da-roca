import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { APP_CONFIG } from '@/config/app';

const message = encodeURIComponent('Olá! Vim pelo site e quero saber mais sobre os produtos naturais 🌿');

export default function WhatsAppFloat() {
  return (
    <a
      href={`https://wa.me/${APP_CONFIG.whatsappNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform"
      aria-label="Fale conosco no WhatsApp"
    >
      <FontAwesomeIcon icon={faWhatsapp} className="h-7 w-7" />
    </a>
  );
}
