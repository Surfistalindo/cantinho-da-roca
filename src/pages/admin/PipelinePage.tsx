import PageHeader from '@/components/admin/PageHeader';
import { Navigate } from 'react-router-dom';

export default function PipelinePage() {
  // Pipeline foi unificado dentro de Leads (visão Kanban).
  return (
    <>
      <PageHeader title="Pipeline" description="Redirecionando para Leads — visão Kanban..." />
      <Navigate to="/admin/leads?view=kanban" replace />
    </>
  );
}
