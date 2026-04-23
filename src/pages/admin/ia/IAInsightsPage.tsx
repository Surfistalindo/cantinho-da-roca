import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import IAPageShell from '@/components/ia/IAPageShell';
import ComingSoonStub from '@/components/ia/ComingSoonStub';

export default function IAInsightsPage() {
  return (
    <IAPageShell
      title="Insights e resumos"
      subtitle="Resumos automáticos do histórico de cada lead e próximos passos sugeridos."
      breadcrumbs={[{ label: 'Insights' }]}
      backTo="/admin/ia"
    >
      <ComingSoonStub
        icon={faLightbulb}
        badge="Insights · IA"
        headline="Conheça cada lead em 2 linhas"
        description="A IA lê todo o histórico e gera um resumo objetivo + próximos passos comerciais sugeridos. Ótimo antes de uma ligação."
        bullets={[
          'Resumo de 2 linhas por lead',
          'Lista de próximos passos sugeridos',
          'Filtro: prioridade, score, status, sem resumo',
          'Sugestão de mensagem de follow-up integrada ao WhatsApp',
        ]}
      />
    </IAPageShell>
  );
}
