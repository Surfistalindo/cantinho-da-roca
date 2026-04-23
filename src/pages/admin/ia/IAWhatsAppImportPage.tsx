import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import IAPageShell from '@/components/ia/IAPageShell';
import ComingSoonStub from '@/components/ia/ComingSoonStub';

export default function IAWhatsAppImportPage() {
  return (
    <IAPageShell
      title="Importar do WhatsApp"
      subtitle="Cole exports e listas de contatos vindos do WhatsApp."
      breadcrumbs={[{ label: 'WhatsApp' }]}
      backTo="/admin/ia"
    >
      <ComingSoonStub
        icon={faWhatsapp}
        badge="WhatsApp · IA"
        headline="Transforme conversas em leads"
        description="Cole exports .txt do WhatsApp ou listas de contatos copiadas — a IA reconhece o formato e cria leads prontos para abordagem."
        bullets={[
          'Reconhece exports oficiais do WhatsApp',
          'Identifica nome + telefone em listas coladas',
          'Inclui contexto da última mensagem como observação',
          'Deduplica contra leads existentes antes de salvar',
        ]}
      />
    </IAPageShell>
  );
}
