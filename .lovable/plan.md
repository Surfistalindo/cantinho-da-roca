

## Plano: Visualização individual do lead reorganizada

O `LeadDetailSheet` já reúne todas as informações pedidas (dados, status, recência, edição, conversão, WhatsApp, timeline), mas está disposto como uma lista vertical sem hierarquia. Vou **reorganizar em blocos visuais claros**, destacar ações rápidas no topo e adicionar um atalho para registrar interação sem rolar — sem trocar a infraestrutura.

### 1. Estrutura por blocos (4 seções)

Reorganizar o conteúdo do sheet (mantendo `sm:max-w-md` → expandir para `sm:max-w-lg` para caber a estrutura mais respirada):

```text
┌─────────────────────────────────────────┐
│ HEADER                                  │
│  Nome do Lead        [badge status]     │
│  📞 +55 11 99999-9999 · 📅 há 3 dias    │
├─────────────────────────────────────────┤
│ AÇÕES RÁPIDAS (barra horizontal)        │
│  [WhatsApp] [+Interação] [Editar] [⋯]   │
├─────────────────────────────────────────┤
│ BLOCO 1 · Status & Acompanhamento       │
│  Status atual: [select]                 │
│  Último contato: [badge] · data         │
│  Próximo contato: data ou "—"           │
├─────────────────────────────────────────┤
│ BLOCO 2 · Dados do Contato              │
│  Origem · Interesse                     │
│  Entrou em · Atualizado em              │
├─────────────────────────────────────────┤
│ BLOCO 3 · Mensagem do formulário /      │
│            Observações internas         │
│  Texto completo, fundo destacado        │
├─────────────────────────────────────────┤
│ BLOCO 4 · Histórico de Interações       │
│  [+ Nova interação] (collapse opcional) │
│  Timeline vertical (já existe)          │
└─────────────────────────────────────────┘
```

Cada bloco vira uma seção visual com:
- Título pequeno em `text-xs font-semibold uppercase text-muted-foreground`
- Card com `rounded-lg border border-border bg-card` ou `bg-muted/20`
- Espaçamento `space-y-4` entre blocos

### 2. Header reformulado

Substituir o `SheetHeader` minimalista atual por um header denso e útil:
- **Linha 1**: Nome (heading) + `LeadStatusBadge` (já existe)
- **Linha 2**: Telefone formatado clicável (`tel:` ou WhatsApp) + `ContactRecencyBadge size="sm"` inline + tempo desde criação (ex.: "Lead há 12 dias")

### 3. Barra de ações rápidas (sticky logo abaixo do header)

Hoje as ações estão espalhadas (Editar/Converter/Excluir em cima, WhatsApp no meio, registrar interação só no fim da timeline). Consolidar em **uma única barra horizontal** logo abaixo do header:

| Ação | Variante | Ícone |
|---|---|---|
| Abrir WhatsApp | `default` (verde) | `faWhatsapp` |
| Registrar interação | `outline` | `faPlus` |
| Editar lead | `outline` | `faPenToSquare` |
| Converter em cliente | `outline` (escondido em menu se status=`won`) | `faUserCheck` |
| Excluir | `ghost` destrutivo (no menu `⋯`) | `faTrashCan` |

A ação **"Registrar interação"** abre um pequeno popover/inline expandido com o mesmo formulário do `InteractionTimeline`, **sem precisar rolar**. Para isso, expor um modo `compact` ou `defaultOpen` no `InteractionTimeline`, ou simplesmente fazer scroll suave para a seção de timeline + abrir o foco no textarea (mais simples, sem refator).

### 4. Bloco "Mensagem & Observações"

A "mensagem enviada no formulário" hoje é gravada no campo `notes` da tabela `leads` (vindo do `LeadFormSection` da landing page). Vou:
- Manter o campo `notes` como fonte (sem mudança de schema).
- Renderizar em **bloco próprio destacado**, com label "Mensagem do contato / Observações internas", fundo `bg-muted/30`, ícone de aspas e texto preservando quebras de linha (`whitespace-pre-wrap`).
- No modo edição, este bloco vira o `Textarea` único de observações (já existe).

### 5. Bloco "Dados do contato" em grid 2 colunas

Hoje cada campo é uma linha `flex justify-between`. Trocar por grid `grid-cols-2 gap-3` com cada par "label/valor" empilhado verticalmente, mais legível e compacto:

```text
ORIGEM               INTERESSE
Instagram            Café orgânico

ENTROU EM            ATUALIZADO EM
12/04 · 09:15        18/04 · 14:32
```

Campos vazios são omitidos (comportamento atual).

### 6. Modo de edição inline (in place no bloco, não substitui tudo)

Hoje, ao clicar em "Editar", **toda a área de informações some** e vira form. Manter a estrutura visual:
- Header e ações continuam visíveis.
- Os blocos "Dados do contato" e "Mensagem/Observações" trocam para inputs no mesmo lugar.
- Botões "Salvar / Cancelar" aparecem fixos no rodapé do sheet (`sticky bottom-0`).
- Histórico de interações continua acessível abaixo (não some).

### 7. Integração com listagem e pipeline

Sem mudanças de contrato: o sheet continua sendo aberto pelos mesmos pontos:
- `LeadsPage` → linha clicada
- `PipelineBoard` → card clicado (já passa o lead completo)

A prop `Lead` interface ganha apenas garantia de receber `notes` (já recebe). Realtime via `useRealtimeTable('leads')` já propaga edições.

### Arquivos tocados

- **Editar:** `src/components/admin/LeadDetailSheet.tsx` — reestruturar layout completo em blocos, header reformulado, barra de ações sticky, edição inline preservando estrutura, expandir largura para `sm:max-w-lg`.
- **(Opcional) Editar:** `src/components/admin/InteractionTimeline.tsx` — aceitar `ref` ou prop `autoFocus` opcional para foco programático no textarea quando o usuário clica em "Registrar interação" no header. Alternativa mais simples: usar `id="interaction-form"` no form e `scrollIntoView` + foco direto pelo DOM, sem alterar o componente.

### Garantias

- Zero mudança de schema, zero novo serviço, zero fluxo paralelo.
- Mesmas integrações de realtime (`leads` + `interactions`), mesmas RLS policies.
- Toda a operação por lead (ler dados, mudar status, registrar interação, contatar via WhatsApp, editar, converter, excluir) acessível **sem sair da tela**.
- Estilo orgânico preservado: bordas suaves, tokens semânticos, sem sombras pesadas, tipografia consistente com o resto do CRM.

