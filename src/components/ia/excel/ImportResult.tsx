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

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="rounded-2xl border bg-card p-6 sm:p-8 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-success-soft text-success flex items-center justify-center mb-3">
          <FontAwesomeIcon icon={faCircleCheck} className="h-7 w-7" />
        </div>
        <h3 className="text-[18px] font-semibold text-foreground mb-1">Importação concluída</h3>
        <p className="text-[13px] text-muted-foreground">
          Sua planilha foi processada com sucesso.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={faUserPlus} label="Criados" value={result.created} accent="text-success bg-success-soft" />
        <Kpi icon={faArrowRightArrowLeft} label="Atualizados" value={result.updated} accent="text-info bg-info-soft" />
        <Kpi icon={faXmark} label="Ignorados" value={result.skipped} accent="text-muted-foreground bg-muted" />
        <Kpi icon={faTriangleExclamation} label="Erros" value={result.errors} accent="text-destructive bg-destructive/10" />
      </div>

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
