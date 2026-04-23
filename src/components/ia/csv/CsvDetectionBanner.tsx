import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faFileCsv } from '@fortawesome/free-solid-svg-icons';

interface CsvDetectionBannerProps {
  delimiterLabel: string;
  encoding: string;
  filename?: string;
  totalRows: number;
}

export default function CsvDetectionBanner({
  delimiterLabel, encoding, filename, totalRows,
}: CsvDetectionBannerProps) {
  return (
    <div className="rounded-xl border border-info/30 bg-info-soft/40 px-4 py-3 mb-4 flex items-start gap-3">
      <span className="h-8 w-8 rounded-lg bg-info/15 text-info flex items-center justify-center shrink-0">
        <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-foreground">
          Arquivo CSV interpretado pela IA
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground">
          {filename && (
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <FontAwesomeIcon icon={faFileCsv} className="h-3 w-3 text-info shrink-0" />
              <span className="truncate font-mono">{filename}</span>
            </span>
          )}
          <span>
            Delimitador: <strong className="text-foreground font-medium">{delimiterLabel}</strong>
          </span>
          <span>
            Codificação: <strong className="text-foreground font-medium uppercase">{encoding}</strong>
          </span>
          <span>
            Linhas: <strong className="text-foreground font-medium tabular-nums">{totalRows}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
