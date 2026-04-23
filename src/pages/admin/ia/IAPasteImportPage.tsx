import { faClipboard } from '@fortawesome/free-solid-svg-icons';
import IAPageShell from '@/components/ia/IAPageShell';
import ComingSoonStub from '@/components/ia/ComingSoonStub';

export default function IAPasteImportPage() {
  return (
    <IAPageShell
      title="Texto colado"
      subtitle="Cole uma lista qualquer e a IA extrai os leads automaticamente."
      breadcrumbs={[{ label: 'Texto colado' }]}
      backTo="/admin/ia"
    >
      <ComingSoonStub
        icon={faClipboard}
        badge="Texto livre · IA"
        headline="Cole qualquer lista — a IA organiza"
        description="Email, anotações, lista de contatos, mensagens — a IA identifica nomes, telefones e observações em texto não estruturado."
        bullets={[
          'Extrai nome, telefone e notas de qualquer texto',
          'Aceita listas formatadas ou texto corrido',
          'Pré-visualiza antes de confirmar',
          'Entra direto no fluxo de revisão e deduplicação',
        ]}
      />
    </IAPageShell>
  );
}
