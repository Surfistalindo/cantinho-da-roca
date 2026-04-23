import { faTag } from '@fortawesome/free-solid-svg-icons';
import IAPageShell from '@/components/ia/IAPageShell';
import ComingSoonStub from '@/components/ia/ComingSoonStub';

export default function IAClassifyPage() {
  return (
    <IAPageShell
      title="Classificação de status"
      subtitle="A IA analisa cada lead e sugere o estágio correto no funil."
      breadcrumbs={[{ label: 'Classificação' }]}
      backTo="/admin/ia"
    >
      <ComingSoonStub
        icon={faTag}
        badge="Classificação · IA"
        headline="Sugestão automática de status por lead"
        description="A IA lê histórico, interações e notas para sugerir em qual estágio do funil cada lead deveria estar. Você revisa e aplica."
        bullets={[
          'Processamento em lote (até 20 leads por chamada)',
          'Mostra status atual × sugerido com nível de confiança',
          'Aplique uma a uma ou todas com confiança ≥ 80%',
          'Filtro por leads sem sugestão ou com conflito',
        ]}
      />
    </IAPageShell>
  );
}
