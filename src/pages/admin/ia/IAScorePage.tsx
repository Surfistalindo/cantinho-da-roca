import { faChartSimple } from '@fortawesome/free-solid-svg-icons';
import IAPageShell from '@/components/ia/IAPageShell';
import ComingSoonStub from '@/components/ia/ComingSoonStub';

export default function IAScorePage() {
  return (
    <IAPageShell
      title="Score automático"
      subtitle="Pontuação 0–100 por lead, com explicação."
      breadcrumbs={[{ label: 'Score' }]}
      backTo="/admin/ia"
    >
      <ComingSoonStub
        icon={faChartSimple}
        badge="Scoring · IA"
        headline="Pontue toda a sua base em segundos"
        description="A IA combina recência, frequência de interações, status, tempo no funil e origem para gerar um score 0–100 com justificativa."
        bullets={[
          'Score 0–100 com motivo em uma frase',
          'Distribuição visual: quentes (≥80), mornos, frios (≤30)',
          'Top 10 leads quentes destacados',
          'Badge de score visível no Pipeline e na lista de Leads',
        ]}
      />
    </IAPageShell>
  );
}
