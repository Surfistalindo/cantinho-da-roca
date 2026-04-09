import PipelineBoard from '@/components/pipeline/PipelineBoard';

export default function PipelinePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold font-heading">Pipeline</h2>
      <PipelineBoard />
    </div>
  );
}
