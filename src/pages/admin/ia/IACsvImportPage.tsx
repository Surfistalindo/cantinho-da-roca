import { faFileCsv } from '@fortawesome/free-solid-svg-icons';
import IAPageShell from '@/components/ia/IAPageShell';
import ComingSoonStub from '@/components/ia/ComingSoonStub';

export default function IACsvImportPage() {
  return (
    <IAPageShell
      title="Importação de CSV"
      subtitle="Envie arquivos .csv com detecção automática de delimitador e codificação."
      breadcrumbs={[{ label: 'CSV avançado' }]}
      backTo="/admin/ia"
    >
      <ComingSoonStub
        icon={faFileCsv}
        badge="CSV · Inteligente"
        headline="CSV avançado com detecção automática"
        description="A IA inspeciona seu arquivo, identifica delimitador e encoding, e direciona para o mesmo fluxo guiado da importação Excel."
        bullets={[
          'Detecta delimitador (,  ;  \\t  |) automaticamente',
          'Reconhece encoding (UTF-8, Latin-1, Windows-1252)',
          'Reaproveita mapeamento, validação, deduplicação e revisão da Excel',
          'Mesmo histórico e relatórios da importação tradicional',
        ]}
        ctaTo="/admin/ia/excel"
        ctaLabel="Usar fluxo Excel agora"
      />
    </IAPageShell>
  );
}
