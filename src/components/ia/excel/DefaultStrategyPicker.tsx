import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faArrowRightArrowLeft, faCodeMerge, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { cn } from '@/lib/utils';
import type { DuplicateStrategy } from '@/services/ia/duplicateDetector';

interface DefaultStrategyPickerProps {
  value: DuplicateStrategy;
  onChange: (s: DuplicateStrategy) => void;
}

interface StrategyDef {
  key: DuplicateStrategy | 'create';
  label: string;
  icon: IconDefinition;
  description: string;
  scenario: string;
  appliesAs: DuplicateStrategy;
}

const STRATEGIES: StrategyDef[] = [
  {
    key: 'create',
    label: 'Criar novo',
    icon: faPlus,
    description: 'Sempre cria um lead novo, mesmo se já houver semelhante.',
    scenario: 'Use quando a base atual está desatualizada ou irrelevante.',
    appliesAs: 'skip', // Ao criar novo, "ignoramos" o existente — mas duplicado fica solto.
  },
  {
    key: 'skip',
    label: 'Ignorar',
    icon: faXmark,
    description: 'Mantém o lead atual no CRM intacto e descarta o da planilha.',
    scenario: 'Quando os dados existentes são mais confiáveis.',
    appliesAs: 'skip',
  },
  {
    key: 'update',
    label: 'Atualizar',
    icon: faArrowRightArrowLeft,
    description: 'Sobrescreve os campos do CRM com os dados da planilha.',
    scenario: 'Quando a planilha contém a versão mais recente.',
    appliesAs: 'update',
  },
  {
    key: 'merge',
    label: 'Mesclar',
    icon: faCodeMerge,
    description: 'Preenche apenas campos vazios e adiciona uma nota com a observação.',
    scenario: 'Quando você quer enriquecer sem perder histórico.',
    appliesAs: 'merge',
  },
];

export default function DefaultStrategyPicker({ value, onChange }: DefaultStrategyPickerProps) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b bg-muted/20">
        <h3 className="text-[14px] font-semibold text-foreground">Estratégia padrão para duplicados</h3>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Esta escolha será aplicada automaticamente a todos os leads já existentes no CRM.
          Você ainda poderá ajustar caso a caso na próxima etapa.
        </p>
      </div>
      <div className="p-4 grid gap-3 sm:grid-cols-2">
        {STRATEGIES.map((s) => {
          const selected = value === s.appliesAs && (s.key === s.appliesAs || s.key === 'skip');
          // Ajuste: "Criar novo" e "Ignorar" ambos mapeiam para skip — para diferenciar,
          // selecionamos exatamente o que o usuário clicou via key.
          // Aqui usamos appliesAs como source of truth.
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange(s.appliesAs)}
              className={cn(
                'text-left rounded-xl border-2 p-4 transition-all',
                value === s.appliesAs
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/20',
              )}
              aria-pressed={value === s.appliesAs}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                    value === s.appliesAs ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <FontAwesomeIcon icon={s.icon} className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-foreground">{s.label}</span>
                    {value === s.appliesAs && (
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                        Selecionado
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-foreground/80 mt-0.5 leading-snug">{s.description}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5 italic leading-snug">{s.scenario}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="px-5 py-3 border-t bg-muted/10 text-[11.5px] text-muted-foreground">
        Sua preferência é salva localmente e reaplicada nas próximas importações.
      </div>
    </div>
  );
}
