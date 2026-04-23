import { faSitemap } from '@fortawesome/free-solid-svg-icons';
import IAPageShell from '@/components/ia/IAPageShell';
import ComingSoonStub from '@/components/ia/ComingSoonStub';

export default function IADuplicatesPage() {
  return (
    <IAPageShell
      title="Duplicados em todo o CRM"
      subtitle="Varredura completa da base com sugestões inteligentes de mesclagem."
      breadcrumbs={[{ label: 'Duplicados globais' }]}
      backTo="/admin/ia"
    >
      <ComingSoonStub
        icon={faSitemap}
        badge="Limpeza · IA"
        headline="Encontre e mescle duplicados em toda a base"
        description="Telefones normalizados + similaridade textual de nomes encontram leads repetidos. A IA propõe qual versão manter e como conciliar notas."
        bullets={[
          'Busca por telefone normalizado e similaridade de nome',
          'Agrupa duplicados lado-a-lado para revisão visual',
          'IA sugere qual nome manter e como conciliar notas',
          'Mescla preserva todo o histórico de interações',
        ]}
      />
    </IAPageShell>
  );
}
