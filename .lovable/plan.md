
# Mapeamento autoexplicativo — Importação Excel

Objetivo: qualquer usuário (mesmo sem treino) deve entender, só de olhar a tela, **o que cada coluna significa, por que a IA sugeriu aquele campo e o que vai acontecer ao clicar em "Definir estratégia"**. Sem precisar perguntar nada.

## O que muda

### 1. Cabeçalho do painel "Mapeamento de colunas" (mais informativo)
- Título mantido, mas com **ícone de info** ao lado abrindo tooltip explicando: "Cada linha representa uma coluna da sua planilha. Escolha qual campo do CRM ela vai preencher."
- Substituir "11 m" truncado por **chip claro**: `11/12 mapeadas` + tooltip "1 coluna será ignorada na importação".
- Adicionar **mini-legenda** logo abaixo do subtítulo (uma linha, ícones pequenos):
  - 🟢 Auto ≥ 85% — alta confiança
  - 🔵 Auto 60–84% — confira
  - 🟡 Auto < 60% — revise
  - ✦ IA — sugerido pelo modelo
  - ✱ Obrigatório — necessário para importar

### 2. Cada linha de coluna (CLIENTE, CONTATO, LOJA…) ganha:
- **Amostra de valores reais** (até 3 exemplos da planilha) em fonte mono cinza, logo abaixo do nome da coluna. Ex.: `"João Silva", "Maria Costa", "Pedro Lima"`. É o que mais ajuda a entender de relance.
- **Tooltip ao passar o mouse no badge de confiança** explicando *por que* aquele percentual: "Header 'CLIENTE' bate com sinônimos de Nome (cliente, lead, comprador). Conteúdo confirma: textos com nomes próprios."
- **Tooltip ao passar o mouse no campo destino (Select)** explicando o campo escolhido: ex. `Nome` → "Nome principal do lead. Aparece no card e no WhatsApp."
- **Badge "IA" vs "Auto"** com tooltip: Auto = casamento por dicionário; IA = sugerido pelo modelo Lovable AI analisando os valores.
- Linhas **ignoradas** ganham texto cinza explicativo: "Esta coluna não será importada" + link "Mapear mesmo assim".

### 3. Tooltips nos itens do Select de destino
Cada `SelectItem` (Nome, Telefone, Origem, Produto/Interesse, Status, Próximo contato, Observações, Ignorar) com micro-descrição cinza abaixo do label dentro do menu:
- **Nome** — Nome do lead/cliente
- **Telefone** — WhatsApp ou celular (será normalizado para +55)
- **Origem** — Canal de captação (loja, marca, campanha)
- **Produto / Interesse** — O que o lead quer comprar
- **Status** — Etapa do funil (novo, negociação, vendido…)
- **Próximo contato** — Data de retorno/follow-up
- **Observações** — Notas livres do vendedor
- **Ignorar** — Não importar esta coluna

### 4. Botão "Definir estratégia" autoexplicativo
- Adicionar **subtítulo** abaixo do botão (ou tooltip): "Próximo passo: escolher o que fazer com leads duplicados (telefone repetido)."
- Quando desabilitado por falta de Nome, **tooltip explica o motivo** ao passar o mouse no botão.

### 5. Stepper no topo (já existe) ganha tooltips
Cada item do stepper (Upload, Preview, Mapeamento, Estratégia, Revisão, Duplicados, Resultado) com tooltip de 1 linha descrevendo o que acontece naquela etapa. Útil para o usuário saber o que vem depois.

### 6. Painel lateral "Ajustar mapeamento" (InlineMappingPanel)
Mesmas melhorias: amostras de valores + tooltips nos campos, para manter consistência quando o usuário reabre na revisão.

## Arquivos afetados

- `src/components/ia/excel/ColumnMapper.tsx` — cabeçalho, legenda, amostras por linha, tooltips de confiança e destino, tratamento visual de "ignorar"
- `src/components/ia/excel/InlineMappingPanel.tsx` — mesmas amostras + tooltips
- `src/pages/admin/ia/IAExcelImportPage.tsx` — tooltips no stepper, subtítulo/tooltip no botão "Definir estratégia"
- `src/lib/ia/fieldDictionary.ts` — adicionar `CRM_FIELD_DESCRIPTIONS` (mapa de descrições curtas usadas nos tooltips e itens do Select)
- `src/hooks/useExcelImport.ts` — expor `samplesByHeader` (já é montado internamente para a heurística) para o `ColumnMapper` consumir

## Detalhes técnicos

- Usar `<Tooltip>` do `@/components/ui/tooltip` (já presente no projeto). Wrapper único em volta do painel para evitar múltiplos providers.
- `samplesByHeader` já é construído por `buildSamplesByHeader` em `columnMapper.ts`. Persistir em `state.samplesByHeader` no hook e passar ao `ColumnMapper` como prop opcional. Fallback: derivar on-demand de `state.parsed.rows`.
- Descrições centralizadas:
  ```ts
  export const CRM_FIELD_DESCRIPTIONS: Record<CrmFieldKey, string> = {
    name: 'Nome do lead/cliente',
    phone: 'WhatsApp ou celular (normalizado para +55)',
    origin: 'Canal de captação (loja, marca, campanha)',
    product_interest: 'O que o lead quer comprar',
    status: 'Etapa do funil (novo, negociação, vendido…)',
    next_contact_at: 'Data de retorno/follow-up',
    notes: 'Notas livres do vendedor',
    ignore: 'Não importar esta coluna',
  };
  ```
- Geração da explicação do badge de confiança:
  - Se `suggestedBy === 'heuristic'`: "Casou com sinônimos de **{Campo}** no dicionário."
  - Se `suggestedBy === 'ai'`: "Sugerido pela IA analisando o conteúdo."
  - Se `suggestedBy === 'manual'`: "Definido manualmente."
- Amostras: pegar até 3 valores não vazios, truncar cada um em 28 chars com `…`.
- Sem novas dependências. Sem mudanças no backend.

## Layout (linha de mapeamento, depois)

```text
┌──────────────────────────────────────────────────────────────┐
│ CLIENTE                                    [Auto · 100% ⓘ]  │
│ "João Silva", "Maria Costa", "Pedro Lima"   [✱ Obrigatório] │
│                                            ┌──────────────┐ │
│                                            │ Nome      ⓘ │ │
│                                            └──────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Fora de escopo
- Não alterar a heurística nem o edge function `ia-suggest-mapping`.
- Não mudar o fluxo de etapas nem o visual do stepper além dos tooltips.
- Sem mudanças nas demais telas do CRM.
