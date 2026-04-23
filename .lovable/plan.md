

## Plano: Módulo "IA" — Central Inteligente do CRM (com submódulo Excel)

Criar uma **área nova e independente** dentro do CRM, arquitetada como produto premium com espaço para crescer. Primeira feature funcional: **importação inteligente de planilhas Excel/CSV** com IA.

---

### 1. Rotas e estrutura de navegação

Adicionar 2 rotas em `src/App.tsx` (sem mexer nas existentes):

```
/admin/ia            → IAHomePage         (central / hub)
/admin/ia/excel      → IAExcelImportPage  (feature ativa)
```

Adicionar item **"IA"** na sidebar (`AdminSidebar.tsx`) com ícone `faWandMagicSparkles`, posicionado depois de "Clientes". Usa `NavLink` com `end={false}` para destacar tanto a home quanto subrotas.

### 2. Estrutura de arquivos (modular e escalável)

```text
src/
├── pages/admin/ia/
│   ├── IAHomePage.tsx            ← hub com cards de features
│   └── IAExcelImportPage.tsx     ← orquestrador do fluxo Excel
│
├── components/ia/
│   ├── IAFeatureCard.tsx         ← card reutilizável (ativo / em breve)
│   ├── IAPageShell.tsx           ← header + breadcrumb da área IA
│   └── excel/
│       ├── ExcelDropzone.tsx     ← upload drag-and-drop
│       ├── ExcelPreviewTable.tsx ← preview das primeiras N linhas
│       ├── ColumnMapper.tsx      ← mapeamento coluna→campo CRM
│       ├── ImportSummary.tsx     ← resumo pré-confirmação
│       ├── DuplicateResolver.tsx ← decidir ignorar/atualizar/mesclar
│       ├── ImportProgress.tsx    ← barra + estado de processamento
│       └── ImportResult.tsx      ← feedback final
│
├── hooks/
│   └── useExcelImport.ts         ← state machine do fluxo (idle→parsing→mapping→preview→importing→done)
│
├── services/ia/
│   ├── excelParser.ts            ← lê .xlsx/.xls/.csv via SheetJS (xlsx)
│   ├── columnMapper.ts           ← heurística + chamada IA p/ sugerir mapeamento
│   ├── leadNormalizer.ts         ← normaliza telefone/data/status/texto
│   ├── duplicateDetector.ts      ← detecta duplicados por phone/name+phone
│   └── importExecutor.ts         ← executa INSERT/UPDATE/MERGE no Supabase
│
├── lib/ia/
│   ├── fieldDictionary.ts        ← sinônimos por campo (nome/cliente/contato…)
│   ├── statusInference.ts        ← mapeia "fechado","novo","aguardando" → LeadStatus
│   └── phoneFormat.ts            ← normaliza para padrão BR
│
└── supabase/functions/ia-suggest-mapping/index.ts
                                  ← edge function: usa Lovable AI Gateway
                                    para sugerir mapeamento quando heurística falhar
```

### 3. Tela hub `/admin/ia` — IAHomePage

Layout premium com:

- **Hero compacto**: título "Central de Inteligência", subtítulo explicando o módulo, badge "Beta" sutil.
- **Grid de FeatureCards** (3 colunas no desktop, 1 no mobile):
  - **Excel** — ícone `faFileExcel`, status `disponível`, CTA "Abrir" → `/admin/ia/excel`
  - **CSV** — ícone `faFileCsv`, status `em breve`
  - **Texto colado** — ícone `faClipboard`, status `em breve`
  - **Lista do WhatsApp** — ícone `faWhatsapp` (brands), status `em breve`
  - **Duplicados inteligentes** — ícone `faClone`, status `em breve`
  - **Sugestão de status** — ícone `faTag`, status `em breve`
  - **Score automático** — ícone `faChartSimple`, status `em breve`
  - **Follow-up automático** — ícone `faRobot`, status `em breve`
  - **Assistente comercial** — ícone `faComments`, status `em breve`
  - **Insights de leads** — ícone `faLightbulb`, status `em breve`
- Cards "em breve" ficam com opacity reduzida + badge "Em breve" — não clicáveis.
- Card ativo tem hover sutil, borda de destaque e CTA visível.
- Seção inferior **"Como funciona"** com 3 passos curtos (Envie → IA interpreta → Você confirma).

### 4. Tela `/admin/ia/excel` — fluxo de importação (state machine)

Estados sequenciais controlados por `useExcelImport`:

```text
idle ──▶ parsing ──▶ mapping ──▶ reviewing ──▶ resolving_duplicates ──▶ importing ──▶ done
                                       │
                                       └──▶ error
```

**Layout:**
- `IAPageShell` com breadcrumb `IA › Excel` + botão "voltar".
- Stepper visual no topo (4 passos: Upload · Mapeamento · Revisão · Confirmação).
- Conteúdo principal troca conforme estado.

**Estado `idle`:** `ExcelDropzone` ocupando área central — drag-and-drop + botão "Selecionar arquivo". Aceita `.xlsx`, `.xls`, `.csv`. Mostra dicas: tamanho máximo, formatos aceitos, link para baixar template-exemplo.

**Estado `parsing`:** loading com `faSpinner` + mensagem "Lendo planilha…".

**Estado `mapping`:** 2 colunas:
- Esquerda: `ExcelPreviewTable` (primeiras 10 linhas, colunas detectadas).
- Direita: `ColumnMapper` — lista cada coluna da planilha com `Select` para mapear ao campo CRM (`name`, `phone`, `origin`, `product_interest`, `status`, `next_contact_at`, `notes`, `ignore`). Mapeamento sugerido pré-preenchido (heurística + IA). Badge "🪄 Sugerido pela IA" nos auto-mapeados.

**Estado `reviewing`:** `ImportSummary` mostrando:
- Total de linhas válidas / inválidas / a ignorar
- Total novos vs. possíveis duplicados
- Contagem por status inferido
- Tabela colapsável com erros de validação por linha.

**Estado `resolving_duplicates`:** `DuplicateResolver` — para cada duplicado detectado, escolher **ignorar / atualizar / mesclar**. Ação em lote: "Aplicar a todos".

**Estado `importing`:** `ImportProgress` — barra com `X de Y processados`.

**Estado `done`:** `ImportResult` — cartão de sucesso com `faCircleCheck`, números (criados / atualizados / ignorados / erros), CTAs "Ver leads importados" (vai para `/admin/leads`) e "Importar outra planilha" (reseta).

### 5. Camada de IA — interpretação de colunas

**Heurística primeiro (`columnMapper.ts`):**
- Normaliza header (lowercase, sem acentos, sem espaços).
- Match direto via `fieldDictionary.ts`:

```ts
{
  name:             ['nome','cliente','contato','lead','razao social'],
  phone:            ['telefone','celular','whatsapp','fone','tel','contato'],
  origin:           ['origem','fonte','canal','campanha','origem do lead'],
  product_interest: ['produto','interesse','item','servico','o que quer'],
  status:           ['status','etapa','situacao','fase'],
  next_contact_at:  ['retorno','follow up','followup','proximo contato','proxima data'],
  notes:            ['observacoes','notas','obs','comentarios','historico'],
}
```

**Fallback IA (`ia-suggest-mapping` edge function):**
- Quando ≥1 coluna não casa por heurística, manda os headers + 3 linhas de amostra para Lovable AI Gateway (`google/gemini-3-flash-preview`).
- Usa **tool calling** com schema estruturado retornando `{ mappings: [{ source: string, target: FieldKey | 'ignore', confidence: number }] }`.
- Prompt no backend (nunca client-side).
- Edge function pública (sem JWT) por simplicidade — apenas processamento de strings, sem leitura de DB.

### 6. Normalização inteligente (`leadNormalizer.ts` + helpers)

- **Telefone**: remove tudo que não é dígito; adiciona `55` se BR sem DDI; rejeita se < 10 dígitos.
- **Data** (`next_contact_at`): tenta `dd/mm/yyyy`, `yyyy-mm-dd`, `dd/mm`, ISO; usa `date-fns`.
- **Status** (`statusInference.ts`):
  - "novo", "lead novo", "recebido" → `new`
  - "em contato", "contatando", "abordagem" → `contacting`
  - "negociação", "aguardando", "proposta", "orçamento" → `negotiating`
  - "cliente", "fechado", "comprou", "ganho", "vendido" → `won`
  - "perdido", "não respondeu", "sem resposta", "desistiu" → `lost`
  - Desconhecido → `new` + flag de aviso.
- **Texto**: trim, colapsa espaços múltiplos, remove caracteres invisíveis.
- **Vazios**: convertidos para `null`, exceto campos obrigatórios (gera erro de validação).

### 7. Deduplicação (`duplicateDetector.ts`)

- Carrega leads existentes (apenas `id`, `name`, `phone`) **uma vez** antes da importação.
- Match: telefone normalizado **idêntico** OU nome normalizado idêntico + telefone vazio em um dos lados.
- Para cada match, retorna `{ row, existingLead, strategy: 'skip' | 'update' | 'merge' }` (default `skip`).
- **Merge** = atualiza apenas campos vazios no lead existente + cria `lead_note` com payload da planilha.
- **Update** = sobrescreve campos não-vazios da planilha.

### 8. Execução da importação (`importExecutor.ts`)

- Processa em lotes de 50 com `Promise.allSettled`.
- Para cada linha válida:
  - **Novo** → `INSERT INTO leads`
  - **Update** → `UPDATE leads`
  - **Merge** → `UPDATE leads` (campos vazios) + `INSERT INTO lead_notes`
- Se `next_contact_at` presente → grava no lead.
- Se houver coluna mapeada como `notes` com conteúdo → cria `lead_note` adicional.
- Conta criados / atualizados / ignorados / erros e devolve `ImportResult`.
- **Não cria** nenhuma `interaction` automática (evita poluir histórico). `last_contact_at` permanece intocado.

### 9. Histórico de importações (preparado, ainda não implementado)

Migração nova (apenas estrutura, **não** consumida agora — reservada para evolução futura):

```sql
create table public.ia_import_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source text not null,             -- 'excel' | 'csv' | …
  filename text,
  total_rows int not null default 0,
  created_count int not null default 0,
  updated_count int not null default 0,
  skipped_count int not null default 0,
  error_count int not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
alter table public.ia_import_logs enable row level security;
create policy "auth read own logs"   on public.ia_import_logs for select to authenticated using (auth.uid() = user_id);
create policy "auth insert own logs" on public.ia_import_logs for insert to authenticated with check (auth.uid() = user_id);
```

Após cada importação Excel, gravar 1 registro nesta tabela. Tela de histórico fica para uma próxima iteração — a base já estará pronta.

### 10. Dependências novas

- **`xlsx`** (SheetJS, ~600KB) — parser robusto de `.xlsx/.xls/.csv` no client. Já é o padrão da indústria, sem alternativa equivalente leve.

Nenhuma outra dependência (Font Awesome, dnd-kit, sonner, date-fns já existem).

### 11. Edge function — `supabase/functions/ia-suggest-mapping/index.ts`

- POST: `{ headers: string[], samples: string[][] }` (3 linhas).
- Chama Lovable AI Gateway com `LOVABLE_API_KEY` (já provisionado).
- Tool calling para garantir JSON estruturado.
- Retorna `{ mappings: [...] }`.
- CORS aberto, validação Zod do body.
- Erros 429/402 propagados com toast amigável no front.

### 12. Design system & UX

- Tipografia `font-crm` (Josefin Sans) consistente com restante do CRM.
- Cards usam `rounded-xl`, `border`, `shadow-sm`, hover com `shadow-md`.
- Cores semânticas existentes (`success`, `warning`, `info`, `destructive`).
- **100% Font Awesome** para todos os ícones do módulo.
- Animações sutis (`animate-fade-in-up` já existente).
- Mobile-first: dropzone full-width, mapper vira accordion no mobile.
- Acessibilidade: labels nos selects, aria-live no progresso, foco visível.

### 13. Garantias

- **Zero alteração** em rotas/páginas/serviços existentes (Pipeline, Leads, Dashboard, Clientes, Auth, Landing).
- **Zero migração destrutiva** — apenas 1 tabela nova (`ia_import_logs`) sem FK em tabelas existentes.
- RLS estrito (logs só do próprio usuário; leads usam policies já existentes).
- IA é **opcional**: se a edge function falhar, heurística + mapeamento manual cobrem 100% do fluxo.
- Importação é **transacional por linha**: erro em uma linha não derruba o lote.
- Estrutura de pastas modular já abre espaço para CSV / Texto / WhatsApp sem refator.

### 14. Ordem de execução (1 mensagem, em sequência)

1. Migração `ia_import_logs` + RLS.
2. Edge function `ia-suggest-mapping`.
3. Instalar `xlsx`.
4. Libs e helpers (`fieldDictionary`, `statusInference`, `phoneFormat`).
5. Services (`excelParser`, `columnMapper`, `leadNormalizer`, `duplicateDetector`, `importExecutor`).
6. Hook `useExcelImport`.
7. Componentes Excel (Dropzone, Preview, Mapper, Summary, Duplicates, Progress, Result).
8. `IAPageShell` + `IAFeatureCard`.
9. `IAHomePage` + `IAExcelImportPage`.
10. Adicionar rotas em `App.tsx` e item na `AdminSidebar`.

