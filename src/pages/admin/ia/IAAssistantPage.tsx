import { faComments } from '@fortawesome/free-solid-svg-icons';
import IAPageShell from '@/components/ia/IAPageShell';
import ComingSoonStub from '@/components/ia/ComingSoonStub';

export default function IAAssistantPage() {
  return (
    <IAPageShell
      title="Assistente Comercial IA"
      subtitle="Converse com sua base como se fosse um analista comercial sênior."
      breadcrumbs={[{ label: 'Assistente' }]}
      backTo="/admin/ia"
    >
      <ComingSoonStub
        icon={faComments}
        badge="RAG · Streaming"
        headline="Pergunte qualquer coisa sobre seus leads"
        description="Chat em tempo real com acesso total a leads e interações. O Assistente busca dados na sua base antes de responder, com transparência sobre o que consultou."
        bullets={[
          'Acesso a leads, interações, status e funil em tempo real',
          'Respostas em streaming com markdown e tabelas',
          'Trace transparente das consultas executadas',
          'Histórico de conversas persistido por usuário',
          'Sugestões prontas: "quem está parado há +7 dias?", "top 5 leads quentes"',
        ]}
      />
    </IAPageShell>
  );
}
