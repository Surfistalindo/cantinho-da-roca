import { supabase } from '@/integrations/supabase/client';
import type { NormalizedLeadRow } from './leadNormalizer';
import type { DuplicateMatch } from './duplicateDetector';
import { startImportLog, finishImportLog, updateImportLog } from './importLogService';

export interface ImportProgress {
  processed: number;
  total: number;
}

export type ImportOutcome = 'created' | 'updated' | 'skipped' | 'error';

export interface ImportDetail {
  rowIndex: number;
  name: string | null;
  phone: string | null;
  outcome: ImportOutcome;
  message?: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ rowIndex: number; message: string }>;
  details: ImportDetail[];
}

const BATCH_SIZE = 50;

export async function executeImport(
  rows: NormalizedLeadRow[],
  duplicates: DuplicateMatch[],
  filename: string | undefined,
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportResult> {
  const result: ImportResult = {
    created: 0, updated: 0, skipped: 0, errors: 0,
    errorDetails: [], details: [],
  };
  const dupMap = new Map(duplicates.map((d) => [d.rowIndex, d]));
  const validRows = rows.filter((r) => r.errors.length === 0);
  const total = rows.length;

  // Linhas inválidas entram primeiro como "error" no detalhamento.
  const invalidRows = rows.filter((x) => x.errors.length);
  for (const r of invalidRows) {
    result.errors++;
    result.errorDetails.push({ rowIndex: r.rowIndex, message: r.errors.join('; ') });
    result.details.push({
      rowIndex: r.rowIndex,
      name: r.data.name,
      phone: r.data.phone,
      outcome: 'error',
      message: r.errors.join('; '),
    });
  }
  let processed = invalidRows.length;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  // Cria log inicial (status "em andamento") — UI pode listar enquanto roda
  const logId = await startImportLog({
    source: 'excel',
    filename: filename ?? null,
    total_rows: total,
  });

  // Atualiza log com erros já contabilizados (para UI realtime)
  if (logId && result.errors > 0) {
    await updateImportLog(logId, { error_count: result.errors });
  }

  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const batch = validRows.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (row) => {
      try {
        const dup = dupMap.get(row.rowIndex);
        if (dup && dup.strategy === 'skip') {
          result.skipped++;
          result.details.push({
            rowIndex: row.rowIndex, name: row.data.name, phone: row.data.phone,
            outcome: 'skipped', message: 'Duplicado — mantido como está',
          });
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
          result.details.push({
            rowIndex: row.rowIndex, name: row.data.name, phone: row.data.phone,
            outcome: 'updated', message: 'Lead atualizado',
          });
          return;
        }
        if (dup && dup.strategy === 'merge') {
          // Carrega lead atual para preencher só campos vazios
          const { data: existing } = await supabase.from('leads')
            .select('*').eq('id', dup.existing.id).maybeSingle();
          if (existing) {
            const patch: {
              phone?: string | null;
              origin?: string | null;
              product_interest?: string | null;
              next_contact_at?: string | null;
              notes?: string | null;
              updated_at?: string;
            } = {};
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
          result.details.push({
            rowIndex: row.rowIndex, name: row.data.name, phone: row.data.phone,
            outcome: 'updated', message: 'Mesclado com lead existente',
          });
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
        result.details.push({
          rowIndex: row.rowIndex, name: row.data.name, phone: row.data.phone,
          outcome: 'created',
        });
      } catch (e) {
        result.errors++;
        const msg = e instanceof Error ? e.message : 'Erro desconhecido';
        result.errorDetails.push({ rowIndex: row.rowIndex, message: msg });
        result.details.push({
          rowIndex: row.rowIndex, name: row.data.name, phone: row.data.phone,
          outcome: 'error', message: msg,
        });
      } finally {
        processed++;
        onProgress?.({ processed, total });
      }
    }));

    // Atualiza log a cada lote concluído (alimenta realtime/banner)
    if (logId) {
      await updateImportLog(logId, {
        created_count: result.created,
        updated_count: result.updated,
        skipped_count: result.skipped,
        error_count: result.errors,
      });
    }
  }

  // Finaliza log de importação (atualiza linha existente)
  if (logId) {
    await finishImportLog(logId, {
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
    });
  }

  return result;
}
