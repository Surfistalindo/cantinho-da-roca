import PipelineBoard from '@/components/pipeline/PipelineBoard';
import PageHeader from '@/components/admin/PageHeader';

export default function PipelinePage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-7">
      <PageHeader
        title="Pipeline"
        description="Arraste os leads entre as colunas para atualizar o status do funil em tempo real."
      />
      <PipelineBoard />
    </div>
  );
}
