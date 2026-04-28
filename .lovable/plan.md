## Ajustar wheel no topo da tela de Leads + testar

Fazer a região superior da tela de Leads encaminhar o wheel do mouse para a tabela visível quando a visualização estiver em Tabela, sem mexer no restante do comportamento de scroll. Depois validar no preview em /admin/leads.

## Mudança

Em `src/pages/admin/LeadsPage.tsx`:

- adicionar refs para os containers scrolláveis dos grupos da tabela;
- detectar o grupo visível;
- encaminhar o `onWheel` do cabeçalho para esse container;
- manter o scroll interno original da tabela.

## Verificação no preview

1. Abrir `/admin/leads`.
2. Posicionar o mouse na faixa superior do cabeçalho/ações.
3. Rolar com o wheel e confirmar que a lista da tabela desce/sobe.
4. Confirmar que o comportamento continua restrito à view Tabela.

## Arquivos alterados

- `src/pages/admin/LeadsPage.tsx`
