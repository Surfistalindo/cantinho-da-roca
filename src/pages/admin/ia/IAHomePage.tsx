import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileExcel, faFileCsv, faClipboard, faClone, faTag, faChartSimple,
  faRobot, faComments, faLightbulb, faUpload, faWandMagicSparkles, faCircleCheck,
  faArrowRight, faBolt, faShieldHalved, faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';
import IAFeatureCard from '@/components/ia/IAFeatureCard';
import IAPageShell from '@/components/ia/IAPageShell';
import { Button } from '@/components/ui/button';

export default function IAHomePage() {
  return (
    <IAPageShell
      title="Central de Inteligência"
      subtitle="A camada inteligente do CRM. Importe, normalize, deduplique e descubra insights — com a IA fazendo o trabalho pesado por você."
      actions={
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ia-chip-shimmer text-primary text-[10.5px] font-bold uppercase tracking-[0.12em]">
          <FontAwesomeIcon icon={faWandMagicSparkles} className="h-2.5 w-2.5" />
          IA · Beta
        </span>
      }
    >
      <div className="space-y-10">
        {/* ============== HERO / SPOTLIGHT ============== */}
        <section className="relative overflow-hidden rounded-3xl ia-hero-card p-6 sm:p-8 md:p-10">
          <div className="absolute inset-0 ia-grid-bg pointer-events-none" aria-hidden />
          <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-success-soft text-success text-[10.5px] font-semibold uppercase tracking-[0.1em]">
                <span className="h-1.5 w-1.5 rounded-full bg-success ia-dot-live" />
                Recurso ativo
              </span>
              <div className="space-y-3">
                <h2 className="text-[26px] sm:text-[30px] md:text-[34px] font-semibold tracking-tight text-foreground leading-[1.1]">
                  Importação inteligente de planilhas com{' '}
                  <span className="bg-gradient-to-r from-primary via-primary to-info bg-clip-text text-transparent">
                    Excel + IA
                  </span>
                </h2>
                <p className="text-[13.5px] sm:text-[14px] text-muted-foreground leading-relaxed max-w-xl">
                  Envie um arquivo, deixe a IA mapear as colunas, normalizar telefones, detectar duplicados
                  e preparar tudo. Você só confirma.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap pt-1">
                <Button asChild size="lg" className="group h-11 px-5 rounded-xl">
                  <Link to="/admin/ia/excel">
                    <FontAwesomeIcon icon={faFileExcel} className="h-4 w-4 mr-2" />
                    Abrir Importação Excel
                    <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
                <span className="text-[11.5px] text-muted-foreground inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faShieldHalved} className="h-3 w-3" />
                  Seus dados nunca saem do CRM
                </span>
              </div>
            </div>

            {/* Spotlight panel */}
            <div className="relative">
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-5 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-success/20 to-success/5 text-success flex items-center justify-center ring-1 ring-success/20">
                    <FontAwesomeIcon icon={faFileExcel} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-semibold text-foreground">Excel · CSV</p>
                    <p className="text-[11px] text-muted-foreground">Pronto para usar agora</p>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {[
                    { icon: faBolt, label: 'Mapeamento automático de colunas' },
                    { icon: faLayerGroup, label: 'Normalização de telefone, datas e status' },
                    { icon: faClone, label: 'Detecção e fusão de duplicados' },
                    { icon: faCircleCheck, label: 'Importação revisável em 1 clique' },
                  ].map((f) => (
                    <li key={f.label} className="flex items-center gap-2.5 text-[12.5px] text-foreground/85">
                      <span className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FontAwesomeIcon icon={f.icon} className="h-3 w-3" />
                      </span>
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ============== IMPORTAÇÃO ============== */}
        <section>
          <SectionHeader
            eyebrow="01 · Importação"
            title="Traga seus dados para dentro"
            description="Diferentes origens, mesmo fluxo inteligente. A IA entende o formato e prepara tudo."
          />
          <div className="ia-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <IAFeatureCard
              icon={faFileExcel}
              title="Excel"
              description="Envie planilhas .xlsx ou .xls. A IA mapeia colunas, normaliza dados e detecta duplicados antes de importar."
              status="available"
              to="/admin/ia/excel"
              accentClass="from-success/20 to-success/5 text-success"
              tag="Inteligente"
            />
            <IAFeatureCard
              icon={faFileCsv}
              title="CSV avançado"
              description="Importação otimizada de arquivos CSV grandes com detecção automática de delimitador e codificação."
              status="soon"
              accentClass="from-info/20 to-info/5 text-info"
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

        {/* ============== INTELIGÊNCIA ============== */}
        <section>
          <SectionHeader
            eyebrow="02 · Inteligência comercial"
            title="A IA trabalhando no seu funil"
            description="Camadas de automação que vão entrar em ação assim que estiverem prontas."
          />
          <div className="ia-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <IAFeatureCard
              icon={faClone}
              title="Duplicados inteligentes"
              description="Identifique e mescle leads duplicados em todo o CRM com critérios fuzzy (nome + telefone + e-mail)."
              status="soon"
            />
            <IAFeatureCard
              icon={faTag}
              title="Sugestão de status"
              description="A IA analisa o histórico do lead e sugere automaticamente o estágio correto no funil."
              status="soon"
            />
            <IAFeatureCard
              icon={faChartSimple}
              title="Score automático"
              description="Pontuação dinâmica baseada em interações, recência e padrões reais de conversão da sua base."
              status="soon"
              accentClass="from-warning/20 to-warning/5 text-warning"
            />
            <IAFeatureCard
              icon={faRobot}
              title="Follow-up automático"
              description="Mensagens personalizadas geradas com IA para reengajar leads parados no funil."
              status="soon"
              accentClass="from-info/20 to-info/5 text-info"
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
              description="Resumos automáticos do histórico de cada lead e sugestão dos próximos passos comerciais."
              status="soon"
              accentClass="from-warning/20 to-warning/5 text-warning"
            />
          </div>
        </section>

        {/* ============== COMO FUNCIONA ============== */}
        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/[0.04] via-card to-card p-6 md:p-10">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="relative">
            <SectionHeader
              eyebrow="Como funciona"
              title="Três passos. Zero fricção."
              description="Do upload à confirmação, o fluxo foi desenhado para ser previsível e rápido."
            />
            <div className="grid gap-5 md:grid-cols-3 mt-2">
              <Step n={1} icon={faUpload} title="Você envia" desc="Faça upload da planilha ou cole uma lista. Aceitamos .xlsx, .xls e .csv." />
              <Step n={2} icon={faWandMagicSparkles} title="A IA interpreta" desc="Colunas mapeadas, dados normalizados, duplicados detectados — automaticamente." />
              <Step n={3} icon={faCircleCheck} title="Você confirma" desc="Revise o resumo, ajuste o que precisar e importe tudo com 1 clique." />
            </div>
          </div>
        </section>

        {/* ============== ROADMAP ============== */}
        <section className="rounded-3xl border bg-card p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
                Roadmap
              </p>
              <h3 className="text-[18px] font-semibold tracking-tight text-foreground">Para onde a Central vai</h3>
              <p className="text-[12.5px] text-muted-foreground mt-1 max-w-xl">
                A IA do CRM evolui em ondas. Cada release adiciona uma nova camada de automação ao seu funil.
              </p>
            </div>
          </div>

          <ol className="relative border-l-2 border-dashed border-border/80 ml-2 space-y-5 pl-6">
            <RoadmapItem
              status="now"
              title="Importação Excel + IA"
              desc="Mapeamento automático, normalização e dedup com fluxo revisável."
            />
            <RoadmapItem
              status="next"
              title="CSV avançado e texto colado"
              desc="Mais origens com a mesma camada de inteligência."
            />
            <RoadmapItem
              status="planned"
              title="Sugestões automáticas no funil"
              desc="Status, score e próximos passos sugeridos por IA, lead a lead."
            />
            <RoadmapItem
              status="planned"
              title="Assistente comercial conversacional"
              desc="Chat IA para revisar abordagens, gerar follow-ups e analisar a base."
            />
          </ol>
        </section>
      </div>
    </IAPageShell>
  );
}

/* ----------- helpers ----------- */

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary/80 mb-1.5">
        {eyebrow}
      </p>
      <h2 className="text-[18px] sm:text-[19px] font-semibold tracking-tight text-foreground">{title}</h2>
      {description && (
        <p className="text-[12.5px] text-muted-foreground mt-1 max-w-2xl leading-relaxed">{description}</p>
      )}
    </div>
  );
}

function Step({ n, icon, title, desc }: { n: number; icon: typeof faUpload; title: string; desc: string }) {
  return (
    <div className="relative rounded-2xl border bg-card p-5 ia-card-lift">
      <div className="flex items-center justify-between mb-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </div>
        <span className="text-[10.5px] font-mono text-muted-foreground/80 tracking-wider">
          STEP 0{n}
        </span>
      </div>
      <h4 className="text-[14px] font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-[12px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function RoadmapItem({
  status,
  title,
  desc,
}: {
  status: 'now' | 'next' | 'planned';
  title: string;
  desc: string;
}) {
  const styles = {
    now: { dot: 'bg-success ring-success/30', label: 'Agora', cls: 'bg-success-soft text-success' },
    next: { dot: 'bg-info ring-info/30', label: 'Próximo', cls: 'bg-info-soft text-info' },
    planned: { dot: 'bg-muted-foreground/40 ring-border', label: 'Planejado', cls: 'bg-muted text-muted-foreground' },
  }[status];

  return (
    <li className="relative">
      <span
        className={`absolute -left-[33px] top-1.5 h-3 w-3 rounded-full ring-4 ${styles.dot} ${
          status === 'now' ? 'ia-dot-live' : ''
        }`}
      />
      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
        <h4 className="text-[13.5px] font-semibold text-foreground">{title}</h4>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-semibold uppercase tracking-wider ${styles.cls}`}>
          {styles.label}
        </span>
      </div>
      <p className="text-[12px] text-muted-foreground leading-relaxed">{desc}</p>
    </li>
  );
}
