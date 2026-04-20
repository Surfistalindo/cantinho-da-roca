

## Plano: Padronização única de status do lead

Reforçar a lógica de status para que **todas as telas leiam, exibam e atualizem do mesmo lugar**, e o banco mantenha `updated_at` sincronizado automaticamente.

### 1. Fonte única já existe — reforçar uso

`APP_CONFIG.leadStatuses` em `src/config/app.ts` já é a fonte única (5 status: `new`, `contacting`, `negotiating`, `won`, `lost`). Os componentes `LeadStatusBadge`, `LeadStatusSelect`, `LeadFilters`, `NewLeadDialog` e `PipelineColumn` já leem de lá. **Nenhuma alteração de config necessária.**

Para evitar regressão futura, criar um helper utilitário central:

- **Criar `src/lib/leadStatus.ts`** com:
  - `getLeadStatusConfig(status)` — retorna `{ value, label, color }` do `APP_CONFIG`, com fallback seguro.
  - `LEAD_STATUS_VALUES` — array tipado dos valores (`['new','contacting','negotiating','won','lost']`) para uso em filtros/contadores tipados.
  - `isClosedStatus(status)` — `won` ou `lost` (usado em follow-up e em conversões).

Refatorar (sem mudar comportamento) para usar o helper:
- `LeadStatusBadge.tsx` → `getLeadStatusConfig`
- `followUpService.ts` → `isClosedStatus`
- `DashboardPage.tsx` → trocar strings literais (`'won'`, `'new'`, etc.) por constantes do helper, mantendo os mesmos contadores.

### 2. Mudança de status no detalhe do lead

Hoje `LeadDetailSheet` mostra o status apenas como badge — **não dá pra mudar dali**. Adicionar:

- Logo abaixo do título do sheet, um bloco compacto com label "Status atual" + `<LeadStatusSelect />` reaproveitado (já existe), gravando direto via `supabase.from('leads').update({ status })` e disparando `onUpdated`.
- Remover a linha duplicada "Status" da grade de campos (evita exibir duas vezes).
- O badge antigo permanece no header do sheet ao lado do nome para feedback visual imediato.

Isso completa as 3 superfícies de mudança de status:
- ✅ Listagem (`LeadStatusSelect` na coluna)
- ✅ Detalhe do lead (novo bloco no sheet)
- ✅ Pipeline drag-and-drop (`PipelineBoard`)

Todas chamam o **mesmo update** em `leads.status`, e o realtime (`useRealtimeTable`) propaga para Dashboard, Leads e Pipeline simultaneamente.

### 3. `updated_at` automático no banco

A coluna `updated_at` existe em `leads` e a função `update_updated_at_column()` já está criada, mas **não há trigger ligando as duas**. Migration:

```sql
CREATE TRIGGER set_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

Resultado: qualquer mudança de status (vindo da listagem, sheet ou pipeline) atualiza `updated_at` automaticamente, sem código no frontend. O sheet já exibe "Atualizado em" — vai refletir automaticamente.

### 4. Dashboard reflete tudo

`DashboardPage` já assina `useRealtimeTable('leads')`. Após refator usando o helper, os cards de "Novos", "Em contato", "Negociação", "Cliente", "Perdido" e a taxa de conversão (`won / total`) continuam corretos e em tempo real.

### Arquivos tocados

- **Criar:** `src/lib/leadStatus.ts` (helper central)
- **Migration:** trigger `set_leads_updated_at` em `leads`
- **Editar:** `src/components/admin/LeadDetailSheet.tsx` (adicionar `LeadStatusSelect` no topo, remover linha duplicada)
- **Editar:** `src/components/admin/LeadStatusBadge.tsx` (usar helper)
- **Editar:** `src/services/followUpService.ts` (`isClosedStatus`)
- **Editar:** `src/pages/admin/DashboardPage.tsx` (constantes do helper)

### Garantias finais

- Mesmo label/cor em listagem, pipeline, detalhe, dashboard e modal de novo contato (todos via `APP_CONFIG`).
- Mudança de status em qualquer tela → update na mesma coluna → trigger atualiza `updated_at` → realtime propaga para todas as outras telas.
- Zero fluxo paralelo: helper único + tabela única + canal realtime único.

