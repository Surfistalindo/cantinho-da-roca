import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileExcel, faFileCsv, faClipboard, faClone, faTag, faChartSimple,
  faRobot, faComments, faLightbulb, faUpload, faWandMagicSparkles, faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import IAFeatureCard from '@/components/ia/IAFeatureCard';
import IAPageShell from '@/components/ia/IAPageShell';

export default function IAHomePage() {
  return (
    <IAPageShell
      title="Central de Inteligência"
      subtitle="Recursos com IA para acelerar seu trabalho comercial. Importe, normalize, deduplique e descubra insights automaticamente."
      actions={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10.5px] font-medium uppercase tracking-wider">
          <FontAwesomeIcon icon={faWandMagicSparkles} className="h-2.5 w-2.5" />
          Beta
        </span>
      }
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">Importação</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <IAFeatureCard
              icon={faFileExcel}
              title="Excel"
              description="Envie planilhas .xlsx, .xls ou .csv. A IA mapeia colunas, normaliza dados e detecta duplicados antes de importar."
              status="available"
              to="/admin/ia/excel"
              accentClass="from-success/20 to-success/5 text-success"
            />
            <IAFeatureCard
              icon={faFileCsv}
              title="CSV avançado"
              description="Importação otimizada de arquivos CSV grandes com detecção de delimitador e codificação."
              status="soon"
            />
            <IAFeatureCard
              icon={faClipboard}
              title="Texto colado"
              description="Cole uma lista de contatos direto do bloco de notas e a IA extrai os leads automaticamente."
              status="soon"
            />
            <IAFeatureCard
              icon={faWhatsapp}
              title="Lista do WhatsApp"
              description="Importe contatos copiados de conversas e grupos do WhatsApp diretamente para o CRM."
              status="soon"
              accentClass="from-success/20 to-success/5 text-success"
            />
          </div>
        </section>

        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">Inteligência comercial</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <IAFeatureCard
              icon={faClone}
              title="Duplicados inteligentes"
              description="Identifique e mescle leads duplicados em todo o CRM com critérios fuzzy (nome + telefone + e-mail)."
              status="soon"
            />
            <IAFeatureCard
              icon={faTag}
              title="Sugestão de status"
              description="A IA analisa o histórico do lead e sugere o estágio correto no funil."
              status="soon"
            />
            <IAFeatureCard
              icon={faChartSimple}
              title="Score automático"
              description="Pontuação dinâmica baseada em interações, recência e padrões de conversão."
              status="soon"
            />
            <IAFeatureCard
              icon={faRobot}
              title="Follow-up automático"
              description="Mensagens personalizadas geradas com IA para reengajar leads parados."
              status="soon"
            />
            <IAFeatureCard
              icon={faComments}
              title="Assistente comercial"
              description="Chat com IA para responder dúvidas sobre seus leads, sugerir abordagens e revisar mensagens."
              status="soon"
            />
            <IAFeatureCard
              icon={faLightbulb}
              title="Insights de leads"
              description="Resumos automáticos do histórico e próximos passos sugeridos para cada lead."
              status="soon"
            />
          </div>
        </section>

        <section className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
          <h3 className="text-[15px] font-semibold text-foreground mb-1">Como funciona</h3>
          <p className="text-[13px] text-muted-foreground mb-6">Três passos simples para transformar dados brutos em ações comerciais.</p>
          <div className="grid gap-5 md:grid-cols-3">
            <Step n={1} icon={faUpload} title="Envie" desc="Faça upload da sua planilha ou cole uma lista." />
            <Step n={2} icon={faWandMagicSparkles} title="IA interpreta" desc="Colunas mapeadas, dados normalizados, duplicados detectados." />
            <Step n={3} icon={faCircleCheck} title="Você confirma" desc="Revise o resumo, ajuste o que precisar e importe com 1 clique." />
          </div>
        </section>
      </div>
    </IAPageShell>
  );
}

function Step({ n, icon, title, desc }: { n: number; icon: typeof faUpload; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <FontAwesomeIcon icon={icon} className="h-4 w-4" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-mono text-muted-foreground">0{n}</span>
          <h4 className="text-[13.5px] font-semibold text-foreground">{title}</h4>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
