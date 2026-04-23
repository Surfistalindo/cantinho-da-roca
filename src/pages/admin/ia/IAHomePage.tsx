import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileExcel, faFileCsv, faClipboard, faClone, faTag, faChartSimple,
  faRobot, faComments, faLightbulb, faUpload, faWandMagicSparkles, faCircleCheck,
  faArrowRight, faBolt, faShieldHalved, faLayerGroup, faBroom, faSitemap,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Link } from 'react-router-dom';
import IAFeatureCard from '@/components/ia/IAFeatureCard';
import IAPageShell from '@/components/ia/IAPageShell';
import ImportHistoryCard from '@/components/ia/excel/ImportHistoryCard';
import { Button } from '@/components/ui/button';

interface CapabilitySection {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: IconDefinition;
  features: Array<{
    icon: IconDefinition;
    title: string;
    description: string;
    status: 'available' | 'soon';
    to?: string;
    accentClass?: string;
    tag?: string;
  }>;
}

const CAPABILITIES: CapabilitySection[] = [
  {
    id: 'importacao',
    eyebrow: '01 · Capacidade',
    title: 'Importação Inteligente',
    description: 'Diferentes origens, mesmo fluxo guiado. A IA entende o formato e prepara tudo.',
    icon: faUpload,
    features: [
      {
        icon: faFileExcel,
        title: 'Excel',
        description: 'Envie planilhas .xlsx ou .xls. A IA mapeia colunas, normaliza dados e detecta duplicados antes de importar.',
        status: 'available',
        to: '/admin/ia/excel',
        accentClass: 'from-success/20 to-success/5 text-success',
        tag: 'Inteligente',
      },
      {
        icon: faFileCsv,
        title: 'CSV avançado',
        description: 'Importação otimizada de arquivos CSV grandes com detecção automática de delimitador e codificação.',
        status: 'soon',
        accentClass: 'from-info/20 to-info/5 text-info',
      },
      {
        icon: faClipboard,
        title: 'Texto colado',
        description: 'Cole uma lista de contatos direto do bloco de notas e a IA extrai os leads automaticamente.',
        status: 'soon',
      },
      {
        icon: faWhatsapp,
        title: 'Lista do WhatsApp',
        description: 'Importe contatos copiados de conversas e grupos do WhatsApp diretamente para o CRM.',
        status: 'soon',
        accentClass: 'from-success/20 to-success/5 text-success',
      },
    ],
  },
  {
    id: 'tratamento',
    eyebrow: '02 · Capacidade',
    title: 'Tratamento de Dados',
    description: 'Limpeza e padronização automática para que sua base entre no CRM já organizada.',
    icon: faBroom,
    features: [
      {
        icon: faLayerGroup,
        title: 'Normalização de campos',
        description: 'Telefone, datas, status e texto padronizados em formato consistente, sem ruído.',
        status: 'available',
        to: '/admin/ia/excel',
        accentClass: 'from-primary/20 to-primary/5 text-primary',
        tag: 'Ativo',
      },
      {
        icon: faShieldHalved,
        title: 'Validação preventiva',
        description: 'A IA destaca linhas com problemas antes de salvar — você decide o que fazer com cada uma.',
        status: 'available',
        to: '/admin/ia/excel',
        accentClass: 'from-warning/20 to-warning/5 text-warning',
      },
    ],
  },
  {
    id: 'duplicados',
    eyebrow: '03 · Capacidade',
    title: 'Duplicados',
    description: 'Identifique e resolva sobreposições entre planilha e base existente.',
    icon: faClone,
    features: [
      {
        icon: faClone,
        title: 'Detecção por telefone e nome',
        description: 'A IA confronta cada linha com a base atual e propõe ignorar, atualizar ou mesclar.',
        status: 'available',
        to: '/admin/ia/excel',
        accentClass: 'from-warning/20 to-warning/5 text-warning',
        tag: 'Ativo',
      },
      {
        icon: faSitemap,
        title: 'Duplicados em todo o CRM',
        description: 'Varredura completa da base para encontrar e mesclar leads duplicados existentes.',
        status: 'soon',
      },
    ],
  },
  {
    id: 'classificacao',
    eyebrow: '04 · Capacidade',
    title: 'Classificação Assistida',
    description: 'A IA interpreta intenção, estágio e prioridade do lead.',
    icon: faTag,
    features: [
      {
        icon: faTag,
        title: 'Sugestão de status',
        description: 'A IA analisa o histórico do lead e sugere automaticamente o estágio correto no funil.',
        status: 'soon',
      },
      {
        icon: faChartSimple,
        title: 'Score automático',
        description: 'Pontuação dinâmica baseada em interações, recência e padrões reais de conversão da base.',
        status: 'soon',
        accentClass: 'from-warning/20 to-warning/5 text-warning',
      },
    ],
  },
  {
    id: 'automacao',
    eyebrow: '05 · Capacidade',
    title: 'Automação Comercial',
    description: 'Ações sugeridas e mensagens prontas para você só revisar e enviar.',
    icon: faRobot,
    features: [
      {
        icon: faRobot,
        title: 'Follow-up automático',
        description: 'Mensagens personalizadas geradas com IA para reengajar leads parados no funil.',
        status: 'soon',
        accentClass: 'from-info/20 to-info/5 text-info',
      },
      {
        icon: faComments,
        title: 'Assistente comercial',
        description: 'Chat com IA para responder dúvidas sobre seus leads, sugerir abordagens e revisar mensagens.',
        status: 'soon',
      },
    ],
  },
  {
    id: 'insights',
    eyebrow: '06 · Capacidade',
    title: 'Insights Futuros',
    description: 'Resumos, padrões e descobertas geradas a partir da sua própria base.',
    icon: faLightbulb,
    features: [
      {
        icon: faLightbulb,
        title: 'Resumos de leads',
        description: 'Resumos automáticos do histórico de cada lead e sugestão dos próximos passos comerciais.',
        status: 'soon',
        accentClass: 'from-warning/20 to-warning/5 text-warning',
      },
    ],
  },
];

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

        {/* ============== CAPACIDADES ============== */}
        {CAPABILITIES.map((cap) => (
          <section key={cap.id}>
            <SectionHeader eyebrow={cap.eyebrow} title={cap.title} description={cap.description} icon={cap.icon} />
            <div className="ia-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cap.features.map((f) => (
                <IAFeatureCard
                  key={f.title}
                  icon={f.icon}
                  title={f.title}
                  description={f.description}
                  status={f.status}
                  to={f.to}
                  accentClass={f.accentClass}
                  tag={f.tag}
                />
              ))}
            </div>
          </section>
        ))}

        {/* ============== HISTÓRICO ============== */}
        <section>
          <SectionHeader
            eyebrow="Atividade recente"
            title="Histórico de operações"
            description="Tudo que a Central de IA executou aparece aqui — auditável e rastreável."
          />
          <ImportHistoryCard limit={5} />
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
      </div>
    </IAPageShell>
  );
}

/* ----------- helpers ----------- */

function SectionHeader({
  eyebrow, title, description, icon,
}: { eyebrow: string; title: string; description?: string; icon?: IconDefinition }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {icon && (
        <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary/80 mb-1">
          {eyebrow}
        </p>
        <h2 className="text-[18px] sm:text-[19px] font-semibold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="text-[12.5px] text-muted-foreground mt-1 max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}

function Step({ n, icon, title, desc }: { n: number; icon: IconDefinition; title: string; desc: string }) {
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
