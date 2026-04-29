## Objetivo

A tela `/admin/whatsapp` hoje já tem muita coisa boa (inbox 3 colunas, automações, status, templates), mas o usuário precisa **adivinhar** o que cada coisa faz. O plano é deixar tudo **autoexplicativo** — com onboarding, dicas inline, legenda dos ícones, painel de ajuda — e adicionar funcionalidades pequenas que tornam a tela realmente útil no dia a dia.

Sem mexer em backend / edge functions / banco. Tudo é UI + 2 melhorias de composer.

---

## 1. Banner de boas-vindas (primeira visita)

Acima da `ConnectionStatusBar`, mostrar um card colapsável "Bem-vindo ao WhatsApp Studio" só quando o usuário **nunca dispensou** (flag em `localStorage`).

Conteúdo:
- O que é a tela ("inbox unificada do CRM com WhatsApp")
- 4 mini-cards com ícone: **Conversar**, **Templates rápidos**, **Régua automática**, **Status em tempo real**
- Botão "Entendi, não mostrar mais" e "Abrir tour guiado" (dispara o tour existente)

Arquivo novo: `src/components/whatsapp/WelcomeBanner.tsx`.

## 2. Tour guiado dedicado (substitui o atual mínimo)

`src/components/tutorial/tours/whatsapp.ts` hoje só tem 1 step genérico. Reescrever com **8 passos com `data-tour`**:

1. `wa-status-bar` — "Aqui você vê se o WhatsApp está conectado e quantas mensagens foram enviadas hoje"
2. `wa-conv-search` — busca por nome/telefone
3. `wa-conv-filters` — filtros (Todas, Não lidas, Em automação…)
4. `wa-conv-item` — cada conversa, com explicação dos badges (🤖 = automação rodando, número = não lidas)
5. `wa-thread` — histórico agrupado por dia
6. `wa-composer-templates` — botão de raio insere mensagem pronta
7. `wa-composer-image` — anexar imagem por URL
8. `wa-context-panel` — automação/timeline/stats à direita

Adicionar atributos `data-tour="..."` nos componentes correspondentes.

## 3. Legenda de ícones (popover "?")

Na `ConversationList`, ao lado do contador `12/40`, um botão "?" pequeno abre popover **"Como ler esta lista"**:
- 🤖 honey → automação ativa
- Badge laranja com número → mensagens não respondidas
- "Você: ..." → última mensagem foi enviada por você
- 🖼 Imagem → mídia
- Cinza/itálico → sem mensagens ainda

## 4. Empty states ricos

### Quando não há conversa selecionada (já existe, melhorar):
Hoje só diz "Selecione uma conversa". Trocar por:
- Heading "Comece uma conversa"
- 3 atalhos clicáveis: **"Ver leads sem resposta"** (filtra `no_reply`), **"Abrir automação"**, **"Configurar templates"**
- Lista de **3 atalhos de teclado** já disponíveis (`Enter` envia, `Shift+Enter` nova linha, `↑/↓` navega — esse último vamos adicionar, ver §7)

### Quando inbox está vazia (zero conversas no total):
Atualmente cai num "Nenhuma conversa encontrada". Detectar `totalCount === 0` e mostrar:
- Ilustração + texto "Nenhum lead com WhatsApp ainda"
- CTA "Importar contatos" → `/admin/ia/whatsapp` e "Cadastrar lead manualmente" → abre `NewLeadDialog`

## 5. Composer mais explicativo + funcionalidades novas

`MessageComposer.tsx`:

**a) Tooltips em todos os botões** (anexar imagem, templates, enviar) — usar `Tooltip` do shadcn em vez de `title=""`.

**b) Contador de caracteres** abaixo do textarea (`{n} caracteres`), virando warning acima de 1000 (limite WhatsApp ~4096, mas mensagens longas costumam dar problema).

**c) Suporte a variáveis nos templates**: ao inserir um template com `{{nome}}`, substituir automaticamente pelo `lead.name`. Mostrar chip "Variáveis substituídas: nome" por 3s.

**d) Botão "Ver preview"** quando o texto contém `*negrito*`, `_itálico_`, `~tachado~` ou `\`mono\`` — abre popover com a renderização estilo WhatsApp.

**e) Persistir rascunho por lead em `localStorage`** (`wa-draft-{leadId}`) — restaura ao reabrir a conversa. Mostrar um badge "Rascunho salvo" discreto.

**f) Atalho de toolbar de formatação**: 4 botões pequenos (B, I, S, mono) que envolvem a seleção com os marcadores do WhatsApp.

## 6. Cabeçalho da conversa mais útil (`ConversationThread`)

Adicionar à direita do nome:
- **Botão "Copiar número"** (clipboard + toast)
- **Botão "Abrir no WhatsApp Web"** (`https://wa.me/{phone}`) — fallback caso a API falhe
- **Menu "⋯"** com:
  - Marcar conversa como lida (zera o badge — flag local)
  - Pausar automação deste lead (toggle `cadence_state` via update simples)
  - Ir para o painel do lead (`/admin/leads?lead={id}`)

## 7. Atalhos de teclado globais na página

Adicionar listener em `WhatsAppPage`:
- `↑ / ↓` quando foco fora do composer → navegar entre conversas
- `Esc` no mobile → volta da thread pra lista
- `/` → foca a busca
- `?` → abre/fecha o painel de ajuda lateral (ver §8)

## 8. Painel "Ajuda & Glossário" (Sheet à direita)

Botão flutuante "?" no canto inferior direito da página (igual ao FAB tutorial, mas escopo só desta tela). Abre um Sheet com 4 abas:

- **Como usar** — passo a passo de 4 itens com prints/ícones
- **Glossário** — Conexão, Régua, Cadência, Opt-out, Template, Z-API, Status `sent/failed`
- **Atalhos** — todos os listados acima
- **Limites & boas práticas** — limite de envio Z-API, evitar números pessoais, horário comercial, evitar SPAM

Componente novo: `src/components/whatsapp/HelpPanel.tsx`.

## 9. Tooltips e microcopy na barra de status

`ConnectionStatusBar`:
- Cada métrica do dia (`enviadas`, `respondidas`, `falhas`) ganha tooltip explicando o que conta (ex.: "mensagens com status `sent` retornado pela Z-API hoje").
- Botão "Configurar" desabilitado para não-admin com tooltip "Apenas administradores".
- Botão "Automações" com tooltip "Editar a régua de mensagens automáticas".

## 10. Dica embutida no painel de contexto

Em `LeadContextPanel`, no card de Automação, se `cadence_state === 'idle'`, mostrar microcopy:
> "A régua começa quando o lead entrar em **Em contato** ou você enviar a primeira mensagem com template."

Se `cadence_exhausted`, mostrar:
> "Régua concluída sem resposta. Lead volta para a fila manual."

---

## Detalhes técnicos

**Arquivos novos:**
- `src/components/whatsapp/WelcomeBanner.tsx`
- `src/components/whatsapp/HelpPanel.tsx`
- `src/components/whatsapp/InboxLegend.tsx` (popover da legenda)
- `src/components/whatsapp/FormatToolbar.tsx` (B/I/S/mono)
- `src/components/whatsapp/ThreadHeaderMenu.tsx` (menu ⋯)

**Arquivos editados:**
- `src/pages/admin/WhatsAppPage.tsx` — banner, atalhos teclado, FAB ajuda
- `src/components/whatsapp/ConnectionStatusBar.tsx` — tooltips + `data-tour`
- `src/components/whatsapp/ConversationList.tsx` — botão legenda + `data-tour` + empty state rico
- `src/components/whatsapp/ConversationThread.tsx` — header com copiar/wa.me/menu + empty state rico
- `src/components/whatsapp/MessageComposer.tsx` — tooltips, contador, variáveis, preview, rascunho, format toolbar
- `src/components/whatsapp/LeadContextPanel.tsx` — microcopy contextual
- `src/components/tutorial/tours/whatsapp.ts` — tour de 8 passos
- `src/lib/whatsappTemplates.ts` (se existir helper de variável; senão criar pequena função util)

**Sem alterações:** banco, RLS, edge functions (`wa-send`, `wa-config-save`, `wa-cadence-tick`), tabela `whatsapp_*`.

**Persistência local apenas:**
- `wa-welcome-dismissed` (boolean) — banner de boas-vindas
- `wa-draft-{leadId}` (string) — rascunhos
- `wa-read-{leadId}` (timestamp) — marcar como lido manual

## Fora do escopo

- Importação de mídia direto do disco (continua URL apenas — exige bucket dedicado)
- Webhooks de leitura/entrega Z-API (já tratados em outra função)
- Áudio/vídeo
- Campanha em massa (será página separada futura)
