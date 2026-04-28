
# Paginação em Leads + audit de performance do site

Duas frentes integradas: (1) **paginação eficiente na página de Leads** (hoje carrega tudo), (2) **limpeza de gargalos reais** detectados via profile.

---

## Parte 1 — Paginação na página de Leads

### Diagnóstico
- `LeadsPage` faz `supabase.from('leads').select('*').order('created_at')` **sem `range`/`limit`** — Supabase corta em 1000 silenciosamente, e o cliente filtra/agrupa tudo em memória.
- A view tabela atual já agrupa por `STATUS_GROUPS`. Paginar globalmente quebraria esse agrupamento. **Solução**: paginar **dentro de cada grupo** + um seletor global de tamanho de página.

### Implementação
1. **Hook novo** `src/hooks/useLeadsPaged.ts`:
   - Mantém `pageSize` (25 / 50 / 100, default 50) e por-grupo `currentPage`.
   - **Não** quebra o fetch; ele continua trazendo até 1000 leads (próximo passo é mover pra fetch paginado quando passar disso).
   - Expõe `paginate(items, groupKey)` → `{ pageItems, totalPages, page, setPage }`.
2. **Componente** `src/components/admin/leads/LeadsPagination.tsx`:
   - Compacto, estilo Monday: `‹ 1 … 4 5 6 … 12 ›`, contador `51–100 de 312`, seletor de page size.
   - Aparece **só quando `total > pageSize`** dentro de um grupo.
3. **Integração em `LeadsPage.tsx`**:
   - No `renderGroup(items)`: aplicar `paginate(items, groupKey)` antes de `renderRows`, e renderizar `<LeadsPagination>` no rodapé do grupo.
   - Reset de página ao mudar filtros/busca (já dá pra ouvir as deps de `filtered`).
   - Persistir `pageSize` em `localStorage` (`leads:pageSize`).
4. **Mobile (cards)**: aplicar mesma paginação ao bloco mobile (1 grupo só).
5. **Atalhos**: `[` página anterior, `]` próxima — coerente com os atalhos existentes (1/2/3 para views).

### Por dentro do grupo, não global — porquê?
- O agrupamento por status é parte da identidade Monday do CRM (rejeitar isso seria mexer em decisão visual). 
- Pagina-se dentro do grupo, que costuma ser o que tem volume real (ex.: "Em contato" com 200 leads).
- Quando passarmos da casa dos milhares totais, evoluímos para **fetch paginado server-side** com `range()` + cursor por `created_at`, mantendo a mesma UI.

---

## Parte 2 — Audit & correções de performance

### Achados do profile (medidos agora em `/admin/leads`)

| Métrica | Valor | Veredito |
|---|---|---|
| First Paint | **8.18s** | crítico |
| DOM Content Loaded | **8.19s** | crítico |
| 246 scripts carregados | 2.8MB | aceitável em dev |
| FontAwesome solid+brands | 290KB + 225KB | ícones não usados sendo enviados |
| Material Symbols (eixos completos) | 1KB CSS / fonte gigante | over-fetching |
| 3 stylesheets de fontes render-blocking | ~605ms | maior gargalo |
| `select('*')` em leads | sem limit | risco em escala |

### Correções (ordem de impacto)

**A. Limpeza de fontes não usadas — ganho imediato visível** (~−400ms render-blocking)
- Remover do `index.html` o link de `Be Vietnam Pro / Public Sans / Epilogue / Caveat` — **0 referências no código**. Caveat já vem no `@import` do CRM.
- Reduzir Material Symbols para **um único eixo fixo**: `opsz,wght,FILL,GRAD@24,400,0,0` em vez do range completo (era 50–200 axes!). Economiza fonte enorme.
- Remover do `@import` do `index.css` as famílias **Oswald, Josefin Sans** — sem refs.
- Manter: Inter (CRM), JetBrains Mono (CRM), Caveat (acento), Satisfy + DM Sans (landing hero), Recoleta + General Sans (landing/whatsapp).

**B. FontAwesome — substituir os ~3 ícones de marca pelos do Lucide quando possível**
- Hoje `@fortawesome/free-brands-svg-icons` (225KB) é importado por causa de `faWhatsapp`, `faGoogle`. Substituir por SVGs inline ou ícones Lucide elimina **225KB**.
- `free-solid-svg-icons` (290KB) é amplamente usado — manter por enquanto, mas migrar para `import { faX } from '@fortawesome/free-solid-svg-icons/faX'` (named imports diretos por arquivo) já reduz tree-shaking. **Fora do escopo agora** — efeito real só em prod build.

**C. `useInteractionCounts(leads.map(l => l.id))` em LeadsPage**
- `leads.map` dentro do JSX cria array novo a cada render → o hook refaz tudo. Memoizar:
  ```ts
  const leadIds = useMemo(() => leads.map(l => l.id), [leads]);
  const interactionCounts = useInteractionCounts(leadIds);
  ```

**D. `fetchLeads` como dependência de `useEffect`**
- Hoje: `useEffect(() => { fetchLeads(); }, [fetchLeads])` + `useRealtimeTable('leads', fetchLeads)`. Como `fetchLeads` está em `useCallback([])` está estável — mas as **mutações inline** (mudar status, deletar) chamam `fetchLeads()` *manualmente* além do realtime, fazendo dois fetches consecutivos. **Fix**: confiar no realtime e remover o `fetchLeads()` dessas mutações (ou debounce 200ms no refetch).

**E. `renderRows` cria função nova a cada render**
- Não é re-renderizada a árvore inteira porque está em IIFE, mas o `Table` interno re-renderiza para cada update de `selected`. Memoizar `renderRows` é overkill; o real ganho é manter o **número de linhas baixo via paginação** (Parte 1).

**F. `select('*')` virar `select(...colunas que usamos)`**
- Hoje pega `notes`, `ai_summary`, `ai_score_reason`, etc. — colunas grandes não usadas no listing. Selecionar só o necessário corta payload em ~40%:
  ```ts
  .select('id,name,phone,status,origin,product_interest,last_contact_at,next_contact_at,created_at,updated_at,ai_score,ai_priority')
  ```
  O `LeadDetailSheet` continua chamando `select('*').eq('id', ...)` quando abre.

**G. Preconnect em `unpkg`/`fontshare`** já existe; tudo certo aí.

### O que NÃO vou fazer
- **Virtualização de lista** (react-window) — paginação + grupos resolve sem complicar.
- **Migrar tudo para React Query** — fetch atual funciona; risco/escopo grande.
- **Mexer em CSS warm farmstand** ou na decisão de tipografia.
- **Otimizar bundle prod** (code-splitting de rotas) — projeto Vite já faz por rota; build prod terá outros números, sem necessidade agora.

---

## Checagem final

Após aplicar:
- Repetir `browser--performance_profile` na rota `/admin/leads` e comparar **First Paint** e **render-blocking duration**.
- Validar que paginação funciona: filtrar, mudar página, mudar `pageSize`, mudar de view (table/kanban/cards), reset ao buscar.

## Arquivos a criar
- `src/hooks/useLeadsPaged.ts`
- `src/components/admin/leads/LeadsPagination.tsx`

## Arquivos a editar
- `index.html` — remover Google Fonts não usados; reduzir eixo do Material Symbols.
- `src/index.css` — remover Oswald/Josefin do `@import`.
- `src/pages/admin/LeadsPage.tsx` — `select` enxuto, `useMemo` em `leadIds`, integração da paginação por grupo, remover refetches duplicados.
- `src/hooks/useInteractionCounts.ts` — sanity check de memoização interna (sem mudança se já for OK).
