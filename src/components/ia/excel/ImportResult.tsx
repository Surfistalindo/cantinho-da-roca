import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck, faRotateLeft, faUsers, faFilePdf, faFileCsv,
  faUserPlus, faArrowRightArrowLeft, faXmark, faTriangleExclamation,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { exportToCsv, exportToPdf } from '@/services/ia/reportExporter';
import type { ImportResult } from '@/services/ia/importExecutor';
import { cn } from '@/lib/utils';

interface ImportResultProps {
  result: ImportResult;
  filename?: string;
  onRestart: () => void;
}

const OUTCOME_LABEL = {
  created: 'Criado',
  updated: 'Atualizado',
  skipped: 'Ignorado',
  error: 'Erro',
} as const;

const OUTCOME_TONE = {
  created: 'text-success bg-success-soft',
  updated: 'text-info bg-info-soft',
  skipped: 'text-muted-foreground bg-muted',
  error: 'text-destructive bg-destructive/10',
} as const;

export default function ImportResultView({ result, filename, onRestart }: ImportResultProps) {
  const [showDetails, setShowDetails] = useState(false);
  const meta = { filename, finishedAt: new Date().toISOString() };

  const errorRows = (result.details ?? []).filter((d) => d.outcome === 'error');
  const errorGroups = groupErrors(errorRows);
  const hasErrors = errorRows.length > 0;

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="rounded-2xl border bg-card p-6 sm:p-8 text-center">
        <div className={cn(
          'mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-3',
          hasErrors ? 'bg-destructive/10 text-destructive' : 'bg-success-soft text-success',
        )}>
          <FontAwesomeIcon icon={hasErrors ? faTriangleExclamation : faCircleCheck} className="h-7 w-7" />
        </div>
        <h3 className="text-[18px] font-semibold text-foreground mb-1">
          {hasErrors ? 'Importação concluída com erros' : 'Importação concluída'}
        </h3>
        <p className="text-[13px] text-muted-foreground">
          {hasErrors
            ? `${errorRows.length} ${errorRows.length === 1 ? 'linha não foi importada' : 'linhas não foram importadas'}. Veja abaixo o que aconteceu e como corrigir.`
            : 'Sua planilha foi processada com sucesso.'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={faUserPlus} label="Criados" value={result.created} accent="text-success bg-success-soft" />
        <Kpi icon={faArrowRightArrowLeft} label="Atualizados" value={result.updated} accent="text-info bg-info-soft" />
        <Kpi icon={faXmark} label="Ignorados" value={result.skipped} accent="text-muted-foreground bg-muted" />
        <Kpi icon={faTriangleExclamation} label="Erros" value={result.errors} accent="text-destructive bg-destructive/10" />
      </div>

      {/* Resumo de erros com instruções */}
      {hasErrors && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-destructive/20 bg-destructive/10">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[13px] font-semibold text-destructive">
                {errorGroups.length} {errorGroups.length === 1 ? 'tipo de erro encontrado' : 'tipos de erro encontrados'}
              </span>
            </div>
          </div>
          <div className="divide-y divide-destructive/10">
            {errorGroups.map((g, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="text-[13px] font-semibold text-foreground">{g.title}</div>
                  <span className="text-[11px] font-mono text-destructive bg-destructive/10 px-2 py-0.5 rounded-md whitespace-nowrap">
                    {g.rows.length} {g.rows.length === 1 ? 'linha' : 'linhas'}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground mb-2">
                  <span className="font-semibold text-foreground">Como corrigir: </span>{g.fix}
                </p>
                <div className="flex flex-wrap gap-1">
                  {g.rows.slice(0, 8).map((r, ri) => (
                    <span key={ri} className="text-[10.5px] font-mono text-muted-foreground bg-background border rounded px-1.5 py-0.5">
                      Linha {r.rowIndex + 2}{r.name ? ` · ${r.name}` : ''}
                    </span>
                  ))}
                  {g.rows.length > 8 && (
                    <span className="text-[10.5px] text-muted-foreground px-1.5 py-0.5">
                      +{g.rows.length - 8} mais
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalhamento */}
      {result.details && result.details.length > 0 && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground">Detalhamento por linha</span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {result.details.length} {result.details.length === 1 ? 'linha' : 'linhas'}
              </span>
            </div>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={cn('h-3 w-3 text-muted-foreground transition-transform', showDetails && 'rotate-180')}
            />
          </button>
          {showDetails && (
            <div className="border-t max-h-[360px] overflow-y-auto">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-card border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground text-[10.5px] uppercase tracking-wider w-14">Linha</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground text-[10.5px] uppercase tracking-wider">Nome</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground text-[10.5px] uppercase tracking-wider">Telefone</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground text-[10.5px] uppercase tracking-wider w-28">Resultado</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground text-[10.5px] uppercase tracking-wider">Mensagem</th>
                  </tr>
                </thead>
                <tbody>
                  {result.details.map((d, i) => (
                    <tr key={`${d.rowIndex}-${i}`} className="border-b last:border-b-0">
                      <td className="px-3 py-2 font-mono text-muted-foreground">{d.rowIndex + 2}</td>
                      <td className="px-3 py-2 text-foreground">{d.name ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{d.phone ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold', OUTCOME_TONE[d.outcome])}>
                          {OUTCOME_LABEL[d.outcome]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{d.message ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Downloads + actions */}
      <div className="rounded-2xl border bg-card p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => exportToCsv(result, meta)} className="gap-1.5">
            <FontAwesomeIcon icon={faFileCsv} className="h-3.5 w-3.5" />
            Baixar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToPdf(result, meta)} className="gap-1.5">
            <FontAwesomeIcon icon={faFilePdf} className="h-3.5 w-3.5" />
            Baixar PDF
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={onRestart} className="gap-1.5">
            <FontAwesomeIcon icon={faRotateLeft} className="h-3 w-3" />
            Importar outra
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/leads">
              <FontAwesomeIcon icon={faUsers} className="h-3.5 w-3.5 mr-1.5" />
              Ver leads
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: IconDefinition; label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center mb-2', accent)}>
        <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
      </div>
      <div className="text-[24px] font-semibold text-foreground font-mono leading-none">{value}</div>
      <div className="text-[11.5px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

interface ErrorGroup {
  title: string;
  fix: string;
  rows: Array<{ rowIndex: number; name?: string | null }>;
}

function groupErrors(rows: ImportResult['details']): ErrorGroup[] {
  const groups = new Map<string, ErrorGroup>();
  const add = (key: string, title: string, fix: string, row: { rowIndex: number; name?: string | null }) => {
    const g = groups.get(key) ?? { title, fix, rows: [] };
    g.rows.push(row);
    groups.set(key, g);
  };
  for (const d of rows ?? []) {
    const msg = (d.message ?? '').toLowerCase();
    const row = { rowIndex: d.rowIndex, name: d.name };
    if (msg.includes('nome')) {
      add('name', 'Nome obrigatório ausente', 'Preencha a coluna mapeada como "Nome" — linhas sem nome não podem virar leads.', row);
    } else if (msg.includes('telefone') || msg.includes('phone')) {
      add('phone', 'Telefone inválido', 'Use formato com DDD (ex: 11 99999-9999) ou +55 11 99999-9999. Remova letras e símbolos extras.', row);
    } else if (msg.includes('data') || msg.includes('date')) {
      add('date', 'Data inválida', 'Use formatos como dd/mm/aaaa, aaaa-mm-dd ou deixe a célula como data no Excel. Remova textos extras.', row);
    } else if (msg.includes('duplic')) {
      add('dup', 'Lead duplicado', 'Já existe um lead com este telefone. Use a estratégia "Atualizar" ou remova a duplicata da planilha.', row);
    } else if (msg.includes('rls') || msg.includes('permiss') || msg.includes('policy')) {
      add('rls', 'Permissão negada', 'Faça login novamente. Se o erro persistir, sua sessão pode ter expirado.', row);
    } else {
      add('other:' + (d.message ?? 'desconhecido'), d.message ?? 'Erro desconhecido', 'Verifique os dados desta linha na planilha original e tente reimportar.', row);
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.rows.length - a.rows.length);
}
