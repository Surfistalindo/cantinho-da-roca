import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ImportResult } from './importExecutor';

export interface ReportMeta {
  filename?: string;
  startedAt?: string;
  finishedAt?: string;
  user?: string;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(v: string | number | null | undefined): string {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const OUTCOME_LABEL: Record<string, string> = {
  created: 'Criado',
  updated: 'Atualizado',
  skipped: 'Ignorado',
  error: 'Erro',
};

export function exportToCsv(result: ImportResult, meta: ReportMeta = {}): void {
  const lines: string[] = [];
  lines.push('Relatório de importação');
  if (meta.filename) lines.push(`Arquivo;${csvEscape(meta.filename)}`);
  if (meta.finishedAt) lines.push(`Concluído em;${csvEscape(meta.finishedAt)}`);
  if (meta.user) lines.push(`Usuário;${csvEscape(meta.user)}`);
  lines.push('');
  lines.push('Resumo');
  lines.push(`Criados;${result.created}`);
  lines.push(`Atualizados;${result.updated}`);
  lines.push(`Ignorados;${result.skipped}`);
  lines.push(`Erros;${result.errors}`);
  lines.push('');
  lines.push('Detalhamento');
  lines.push(['Linha', 'Nome', 'Telefone', 'Resultado', 'Mensagem'].join(';'));
  for (const d of result.details ?? []) {
    lines.push([
      csvEscape(d.rowIndex + 2),
      csvEscape(d.name),
      csvEscape(d.phone),
      csvEscape(OUTCOME_LABEL[d.outcome] ?? d.outcome),
      csvEscape(d.message ?? ''),
    ].join(';'));
  }
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const base = (meta.filename ?? 'importacao').replace(/\.[^.]+$/, '');
  triggerDownload(blob, `relatorio-${base}-${Date.now()}.csv`);
}

export function exportToPdf(result: ImportResult, meta: ReportMeta = {}): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(95, 75, 50);
  doc.rect(0, 0, pageW, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('Relatório de Importação', 40, 30);
  doc.setFontSize(10);
  doc.text('Central de IA · Cantinho da Roça', 40, 48);

  // Meta
  doc.setTextColor(40, 40, 40);
  let y = 90;
  doc.setFontSize(10);
  if (meta.filename) { doc.text(`Arquivo: ${meta.filename}`, 40, y); y += 14; }
  if (meta.finishedAt) {
    doc.text(`Concluído em: ${new Date(meta.finishedAt).toLocaleString('pt-BR')}`, 40, y); y += 14;
  }
  if (meta.user) { doc.text(`Usuário: ${meta.user}`, 40, y); y += 14; }
  y += 6;

  // KPIs table
  autoTable(doc, {
    startY: y,
    head: [['Criados', 'Atualizados', 'Ignorados', 'Erros']],
    body: [[
      String(result.created), String(result.updated),
      String(result.skipped), String(result.errors),
    ]],
    theme: 'grid',
    headStyles: { fillColor: [95, 75, 50], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { halign: 'center', fontSize: 14, fontStyle: 'bold' },
    styles: { cellPadding: 8 },
  });

  // Details
  const details = result.details ?? [];
  if (details.length > 0) {
    autoTable(doc, {
      // @ts-expect-error - jspdf-autotable adds lastAutoTable
      startY: (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20,
      head: [['Linha', 'Nome', 'Telefone', 'Resultado', 'Mensagem']],
      body: details.map((d) => [
        String(d.rowIndex + 2),
        d.name ?? '—',
        d.phone ?? '—',
        OUTCOME_LABEL[d.outcome] ?? d.outcome,
        d.message ?? '',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [95, 75, 50], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 40, halign: 'center' },
        4: { cellWidth: 'auto' },
      },
    });
  }

  const base = (meta.filename ?? 'importacao').replace(/\.[^.]+$/, '');
  doc.save(`relatorio-${base}-${Date.now()}.pdf`);
}
