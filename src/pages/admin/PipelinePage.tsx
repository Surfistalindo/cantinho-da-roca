import PipelineBoard from '@/components/pipeline/PipelineBoard';
import PageHeader from '@/components/admin/PageHeader';

export default function PipelinePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <PageHeader
        title="Pipeline"
        description="Arraste os leads entre as colunas para atualizar o status."
      />
      <PipelineBoard />
    </div>
  );
}
