import { supabase } from '@/integrations/supabase/client';

export interface ImportLog {
  id: string;
  user_id: string;
  source: string;
  filename: string | null;
  total_rows: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  started_at: string;
  finished_at: string | null;
}

/** Últimas importações (mais recentes primeiro). */
export async function listRecentImports(limit = 5): Promise<ImportLog[]> {
  const { data, error } = await supabase
    .from('ia_import_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ImportLog[];
}

/** Cria registro inicial de importação (status "em andamento"). */
export async function startImportLog(params: {
  source: string;
  filename: string | null;
  total_rows: number;
}): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from('ia_import_logs')
    .insert({
      user_id: userId,
      source: params.source,
      filename: params.filename,
      total_rows: params.total_rows,
    })
    .select('id')
    .single();
  if (error) {
    console.warn('startImportLog failed', error);
    return null;
  }
  return data?.id ?? null;
}

/** Atualização parcial (progresso em tempo real). */
export async function updateImportLog(
  id: string,
  patch: Partial<Pick<ImportLog, 'created_count' | 'updated_count' | 'skipped_count' | 'error_count'>>,
): Promise<void> {
  const { error } = await supabase.from('ia_import_logs').update(patch).eq('id', id);
  if (error) console.warn('updateImportLog failed', error);
}

/** Atualiza um log com o resultado final. */
export async function finishImportLog(
  id: string,
  result: { created: number; updated: number; skipped: number; errors: number },
): Promise<void> {
  const { error } = await supabase
    .from('ia_import_logs')
    .update({
      created_count: result.created,
      updated_count: result.updated,
      skipped_count: result.skipped,
      error_count: result.errors,
      finished_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) console.warn('finishImportLog failed', error);
}
