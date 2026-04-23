import { supabase } from '@/integrations/supabase/client';
import type { NormalizedLeadRow } from './leadNormalizer';
import type { DuplicateMatch } from './duplicateDetector';

export interface ImportProgress {
  processed: number;
  total: number;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ rowIndex: number; message: string }>;
}

const BATCH_SIZE = 50;

export async function executeImport(
  rows: NormalizedLeadRow[],
  duplicates: DuplicateMatch[],
  filename: string | undefined,
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: 0, errorDetails: [] };
  const dupMap = new Map(duplicates.map((d) => [d.rowIndex, d]));
  const validRows = rows.filter((r) => r.errors.length === 0);
  const total = rows.length;
  let processed = rows.length - validRows.length; // erros já entram no progresso
  result.errors += processed;
  for (const r of rows.filter((x) => x.errors.length)) {
    result.errorDetails.push({ rowIndex: r.rowIndex, message: r.errors.join('; ') });
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const batch = validRows.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (row) => {
      try {
        const dup = dupMap.get(row.rowIndex);
        if (dup && dup.strategy === 'skip') {
          result.skipped++;
          return;
        }
        if (dup && dup.strategy === 'update') {
          const { error } = await supabase.from('leads').update({
            name: row.data.name!,
            phone: row.data.phone,
            origin: row.data.origin,
            product_interest: row.data.product_interest,
            status: row.data.status,
            next_contact_at: row.data.next_contact_at,
            notes: row.data.notes,
            updated_at: new Date().toISOString(),
          }).eq('id', dup.existing.id);
          if (error) throw error;
          result.updated++;
          return;
        }
        if (dup && dup.strategy === 'merge') {
          // Carrega lead atual para preencher só campos vazios
          const { data: existing } = await supabase.from('leads')
            .select('*').eq('id', dup.existing.id).maybeSingle();
          if (existing) {
            const patch: Record<string, unknown> = {};
            if (!existing.phone && row.data.phone) patch.phone = row.data.phone;
            if (!existing.origin && row.data.origin) patch.origin = row.data.origin;
            if (!existing.product_interest && row.data.product_interest) patch.product_interest = row.data.product_interest;
            if (!existing.next_contact_at && row.data.next_contact_at) patch.next_contact_at = row.data.next_contact_at;
            if (!existing.notes && row.data.notes) patch.notes = row.data.notes;
            if (Object.keys(patch).length) {
              patch.updated_at = new Date().toISOString();
              await supabase.from('leads').update(patch).eq('id', dup.existing.id);
            }
            if (userId && row.data.notes) {
              await supabase.from('lead_notes').insert({
                lead_id: dup.existing.id,
                user_id: userId,
                content: `[Importação${filename ? ` ${filename}` : ''}] ${row.data.notes}`,
              });
            }
          }
          result.updated++;
          return;
        }
        // Novo
        const { data: inserted, error } = await supabase.from('leads').insert({
          name: row.data.name!,
          phone: row.data.phone,
          origin: row.data.origin,
          product_interest: row.data.product_interest,
          status: row.data.status,
          next_contact_at: row.data.next_contact_at,
          notes: row.data.notes,
        }).select('id').single();
        if (error) throw error;
        if (userId && inserted && row.data.notes) {
          await supabase.from('lead_notes').insert({
            lead_id: inserted.id,
            user_id: userId,
            content: `[Importação${filename ? ` ${filename}` : ''}] ${row.data.notes}`,
          });
        }
        result.created++;
      } catch (e) {
        result.errors++;
        result.errorDetails.push({
          rowIndex: row.rowIndex,
          message: e instanceof Error ? e.message : 'Erro desconhecido',
        });
      } finally {
        processed++;
        onProgress?.({ processed, total });
      }
    }));
  }

  // Log de importação
  if (userId) {
    await supabase.from('ia_import_logs').insert({
      user_id: userId,
      source: 'excel',
      filename: filename ?? null,
      total_rows: total,
      created_count: result.created,
      updated_count: result.updated,
      skipped_count: result.skipped,
      error_count: result.errors,
      finished_at: new Date().toISOString(),
    });
  }

  return result;
}
