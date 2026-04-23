

## Importação Excel: suportar planilhas reais e multi-formato

### Diagnóstico (planilha enviada)

A planilha `PROSPECÇÃO_DE_CLIENTES_ONLINE.xlsx` quebra a importação atual por 5 motivos combinados:

1. **Abas com layouts totalmente diferentes** — uma aba tem `CLIENTE / CONTATO / ÚLTIMO CONTATO / LOJA / PRODUTOS / MARCA`; outra (ABRIL/2026) tem `NICHO / ÚLTIMO CONTATO / LOJA / Veículo / PROCESSO DE VENDA / PRÓXIMO CONTATO / TICKET / VENDEDOR` — sem coluna "nome".
2. **Cabeçalho não está na linha 1** — algumas abas têm um título mesclado em A1 ("MARCADORES DE DESEMPENHO…") e o cabeçalho real só na linha 2. O parser atual pega a 1ª linha não-vazia → captura o título e descarta tudo.
3. **Dicionário pobre** — não reconhece `nicho`, `loja`, `veiculo`, `processo de venda`, `próximo contato`, `ticket`, `vendedor`, `marca`, `produtos bio klein …`.
4. **Datas em formatos sujos** — `04/11//25` (barra dupla), `02.03.26`, `7198421-8820` em telefone, etc.
5. **Linha sem nome é rejeitada** — várias linhas têm telefone+produto mas nome em branco; viram erro e somem.

Resultado prático: só 40 linhas chegam no painel (apenas a primeira aba "limpa" passa).

### Correções

**1. Detecção inteligente de cabeçalho (`excelParser.ts`)**

- Trocar "primeira linha não vazia" por heurística: das 5 primeiras linhas com conteúdo, escolher a que tem mais células curtas tipo cabeçalho (≤3 palavras, sem números longos, sem dígitos puros) **e** que casa com pelo menos 1 termo do dicionário expandido. Isso pula o título mesclado.
- Fallback: se nenhuma linha bater, usa a primeira não-vazia (comportamento atual).

**2. Multi-aba com mapeamento independente por aba**

Hoje todas as abas são unificadas pela união de colunas — gera linhas semanticamente incompatíveis. Mudar para:

- Cada aba é parseada separadamente (header próprio + rows próprios).
- Cada aba recebe seu próprio mapeamento heurístico/IA.
- O resultado é a **soma** das linhas normalizadas de todas as abas (não a união de colunas).
- Banner de pré-visualização mostra cabeçalho de cada aba e o mapeamento aplicado, com possibilidade de ajustar por aba.
- `__sheet` continua viajando como metadado e vira fallback de **origem** quando a aba não tem coluna explícita.

**3. Dicionário ampliado (`fieldDictionary.ts`)**

Adicionar termos reais encontrados na planilha:
- `name`: + `clientes`, `responsavel`, `nomedocliente`
- `phone`: + `contato`, `whats`, `numerodecontato` (com desempate: se há `cliente` + `contato`, "cliente" → name, "contato" → phone; se só "contato" existe, vira name **a menos** que os valores sejam predominantemente numéricos → então phone).
- `origin`: + `loja`, `veiculo`, `canal`, `midia`, `marca` (loja/veículo são canais de prospecção aqui).
- `product_interest`: + `produtos`, `produto`, `nicho`, `marca`, `pedido`, `ticket` (ticket-tamanho de venda também conta como interesse comercial).
- `status`: + `processodevenda`, `processo`, `etapa`, `situacaodavenda`.
- `next_contact_at`: + `proximocontato`, `proximocontata`, `proximacontata` (typo da planilha), `retornoem`.
- `notes`: + `vendedor`, `observacoesvendedor`.

**Heurística de desempate por conteúdo**: quando o cabeçalho é ambíguo (`CONTATO` pode ser nome ou telefone), inspecionar 3-5 valores de amostra. Se ≥60% são dígitos/parênteses/traços → phone. Senão → name.

**4. Inferência de status estendida (`statusInference.ts`)**

Adicionar palavras-chave reais da coluna PROCESSO DE VENDA:
- `semresposta`, `peengajamento`, `reengajamento` → `lost` ou novo status `re-engajamento` (mapeio para `contacting` por enquanto, com warning).
- `vendaconcluida`, `concluida`, `vendido` → `won` (já cobre "vendido"; adicionar "concluida").
- `vaipassarnaloja`, `vaipassar`, `presencial`, `agendado` → `negotiating`.
- `entraremcontato` → `contacting`.

**5. Parsing de data resiliente (`leadNormalizer.ts`)**

- Pré-limpar string: colapsar `//` para `/`, remover espaços internos, trocar `.` por `/` quando padrão for `dd.MM.yy`.
- Já temos suporte a serial Excel e ambíguo BR/US — manter.
- Aceitar `dd/MM/yy` com ano de 2 dígitos (já tem `normalizeYear`).

**6. Aceitar linha sem nome quando há telefone + produto**

- Se `name` está vazio mas há `phone` válido OU `product_interest` preenchido, gerar nome sintético: `"Lead s/ nome (DDD final-fone)"` ou `"Lead — <produto>"`. Adicionar warning, não erro.
- Mantém a regra de erro se não houver **nada** identificável (sem nome, sem telefone, sem produto).

**7. Edge function `ia-suggest-mapping` — prompt mais forte**

Atualizar o system prompt para:
- Listar exemplos reais de cabeçalhos brasileiros (nicho, loja, veículo, processo de venda, ticket, vendedor).
- Instruir o modelo a inferir tipo do **conteúdo das amostras**, não só do header.
- Permitir mapear "loja" e "veículo" como `origin`.
- Devolver mapeamentos com confiança ≥ 0.5 mesmo sem header óbvio.

**8. UI: banner por aba no preview (`ExcelPreviewTable.tsx` / `InlineMappingPanel.tsx`)**

- Mostrar tabs (uma por aba detectada) com sua contagem, header detectado e mapeamento atual.
- Permitir mudar mapeamento por aba.
- Indicar abas ignoradas com motivo claro ("sem cabeçalho reconhecível", "vazia", "header detectado: <linha>").

### Arquivos modificados

- `src/services/ia/excelParser.ts` — detecção de header inteligente; retornar `sheets[]` com `headers/rows/sample` por aba (não unificar).
- `src/services/ia/leadNormalizer.ts` — pré-limpeza de datas; nome sintético quando há phone/produto.
- `src/services/ia/columnMapper.ts` — heurística de desempate por conteúdo das amostras; mapeamento por aba.
- `src/lib/ia/fieldDictionary.ts` — termos brasileiros reais.
- `src/lib/ia/statusInference.ts` — palavras de "processo de venda".
- `src/hooks/useExcelImport.ts` — orquestrar mapeamento por aba e somar resultados.
- `src/components/ia/excel/ExcelPreviewTable.tsx` + `InlineMappingPanel.tsx` — tabs por aba.
- `supabase/functions/ia-suggest-mapping/index.ts` — prompt reforçado.

### Sem mudanças

- RLS, auth, schema das tabelas, módulos CSV/WhatsApp/Paste/Assistente, layout/visual fora do fluxo Excel.

### Validação

1. Reimportar a `PROSPECÇÃO_DE_CLIENTES_ONLINE.xlsx` enviada.
2. Conferir banner: deve listar **todas as abas** com contagem real (>40 linhas no total).
3. Conferir mapeamento automático: `CLIENTE→name`, `CONTATO→phone`, `ÚLTIMO CONTATO→ignore` ou `notes`, `LOJA→origin`, `PRODUTOS…→product_interest`, `MARCA→notes`. Para ABRIL/2026: `NICHO→product_interest`, `VENDEDOR→notes`, `PROCESSO DE VENDA→status`, `PRÓXIMO CONTATO→next_contact_at`.
4. Conferir que datas `04/11//25`, `02.03.26`, `7/14/21` aparecem **sem** badge "Data inválida".
5. Conferir que linhas com telefone mas sem nome viram leads com nome sintético, não erros.
6. Status "VENDA CONCLUÍDA" → `won`; "SEM RESPOSTA - PEENGAJAMENTO" → `contacting` (warning); "Vai passar na loja" → `negotiating`.

### Resultado esperado

A planilha real do usuário importa **todas as linhas de todas as abas** (centenas, não 40), com mapeamento automático correto para os layouts encontrados, datas reconhecidas mesmo em formatos sujos, e status inferido a partir da coluna PROCESSO DE VENDA. Nada quebra para CSV/WhatsApp/Paste.

