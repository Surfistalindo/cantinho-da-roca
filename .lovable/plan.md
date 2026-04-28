
# WhatsApp Studio — reformulação completa da tela

A tela atual funciona mas parece um painel técnico (4 abas paralelas, jargão "cadência", "régua", "Z-API", "Instance ID"). Vou substituí-la por uma experiência **central na conversa** no estilo do WhatsApp Business / Front / Intercom — uma interface única onde o operador vê **conversas reais com leads**, e as automações ficam visíveis em linguagem humana.

Nada do backend muda — `wa-send`, `wa-cadence-tick`, `wa-config-save` e as 3 tabelas continuam intactos.

---

## 1. Nova arquitetura de tela: Inbox + Studio

Substitui as 4 abas por **uma tela com 3 colunas** (responsiva → 1 coluna no mobile, com drawer), no padrão de qualquer app de mensagens moderno:

```text
┌───────────────────────────────────────────────────────────────────┐
│ WhatsApp Studio                          [● Conectado]  [⚙ Setup] │
├──────────────┬────────────────────────────────┬───────────────────┤
│ CONVERSAS    │  CONVERSA ATIVA                │  CONTEXTO DO LEAD │
│              │                                │                   │
│ 🔍 Buscar    │  Maria Silva  · 71 99102-6884  │  Maria Silva      │
│              │  ─────────────────────────────  │  Status: Em contato│
│ ▼ Filtros    │                                │  Origem: Site     │
│  • Todas (24)│  ┌─ Sistema · 14:02 ────────┐ │  ─────────────    │
│  • Não lidas │  │ 🤖 Automação enviou:    │ │  ⚡ AUTOMAÇÃO      │
│  • Em cadên. │  │ "Boas-vindas" (etapa 1) │ │  Etapa 2 de 3     │
│  • Pausadas  │  └──────────────────────────┘ │  Próximo envio:   │
│              │                                │  amanhã 09:00     │
│ ┌──────────┐ │   Boa tarde, Maria! Vi seu... │  [⏸ Pausar régua] │
│ │ M Maria  │ │                          14:02│                   │
│ │ Olá! Me..│ │                                │  ─────────────    │
│ │ 14:23 ●  │ │       Olá! Tô interessada... │  📋 ÚLTIMAS AÇÕES │
│ ├──────────┤ │                          14:23│  • Lead criado    │
│ │ J João   │ │                                │  • Msg enviada    │
│ │ Você: O..│ │  ╔════════════════════════╗  │  • Resposta rec.  │
│ │ ontem    │ │  ║ Digite uma mensagem... ║  │                   │
│ └──────────┘ │  ║ [📎][📷][⚡][😊]   [➤]║  │  ✨ AÇÕES RÁPIDAS │
│              │  ╚════════════════════════╝  │  [📦 Catálogo]    │
│              │  💡 Resposta sugerida pela IA │  [🎁 Cupom 10%]   │
│              │  [Usar sugestão]              │  [📅 Agendar]     │
└──────────────┴────────────────────────────────┴───────────────────┘
```

### O que cada zona faz

**Coluna 1 — Lista de conversas** (agrupa `whatsapp_messages` por `lead_id`):
- Avatar com inicial em cor gerada por hash (consistência com CRM)
- Última mensagem em preview, timestamp relativo
- Badge não lidas (mensagens `direction='in'` sem visualização)
- Ícone discreto se o lead está em cadência ativa (🤖 com tooltip "Automação ativa")
- Filtros chip-style: Todas · Não lidas · Em automação · Pausadas · Sem resposta

**Coluna 2 — Thread da conversa** (cara de WhatsApp de verdade):
- Bolhas alinhadas: cinza-claro à esquerda (recebidas), verde-clay à direita (enviadas)
- Bolhas de **automação** com estilo distinto (fundo honey/10, ícone 🤖, label "Enviado pela automação · etapa X")
- Status de entrega: ⏱ enviando · ✓ enviado · ✗ falhou (com tooltip do erro)
- Imagens renderizadas inline com lightbox
- Composer fixo embaixo: textarea auto-resize + botões para imagem (URL + preview), templates (atalho ⚡), emoji, e o botão verde de envio
- Banner sutil quando o número não tem WhatsApp configurado, com CTA "Configurar"

**Coluna 3 — Painel de contexto do lead**:
- Dados do lead (nome, telefone clicável, origem, status)
- **Cartão "Automação"** explicado em português claro:
  > "Esta pessoa está recebendo a sequência **Boas-vindas**. Já foi a etapa **2 de 3**. A próxima mensagem sairá automaticamente **amanhã às 09:00**."
  > [⏸ Pausar automação] [↻ Reiniciar] [✕ Encerrar]
- Linha do tempo das últimas 5 ações (criado, mensagens, status muda)
- Atalhos para enviar templates específicos (catálogo, cupom, etc.)

---

## 2. Novo cabeçalho — status e ajustes

Substitui o `<TabsList>` por uma barra fina com:
- **Status da conexão**: pílula verde "● Conectado · @cantimdaroca" ou vermelha "● Desconectado · Configurar agora"
- **Métricas do dia** (3 mini-pills em monoespaço): "12 enviadas · 8 respondidas · 2 falharam"
- **Botão `⚙ Configurar`**: abre um Dialog (não uma aba inteira) com Setup Z-API explicado passo a passo
- **Botão `🤖 Automações`**: abre Dialog com gerenciamento das 3 mensagens da régua (editar texto, ver delays, ativar/desativar)

Ambos viram **Dialogs sobrepostos** — não tira o operador do contexto da conversa.

---

## 3. Setup Z-API — explicado em 3 passos visuais

Hoje a aba "Configuração" é um formulário cru. Substituir por um **Stepper** dentro do Dialog:

```text
PASSO 1 — Crie sua instância       PASSO 2 — Conecte o WhatsApp     PASSO 3 — Cole o Instance ID
[ilustração / link app.z-api.io]   [ilustração QR Code + celular]   [campo + botão Salvar]
                                                                     ↓
                                                                     Banner verde "Conectado!"
```

Cada passo com texto curto (1 frase) + tooltip "Por quê?" explicando o motivo. Sem termos como "Bearer", "token", "JWT".

---

## 4. Automações — central de explicação humana

O Dialog `🤖 Automações` mostra os 3 templates da régua como **cards em sequência conectada por linha vertical** (timeline de etapas):

```text
┌── ETAPA 1 · imediato ──────────────┐
│ Boas-vindas                        │
│ "Olá {{nome}}! Vi seu interesse..."│
│ [✏ Editar texto]    [👁 Pré-visualizar]│
└────────────────────────────────────┘
              │ +24h
┌── ETAPA 2 · 1 dia depois ──────────┐
│ Lembrete suave                     │
│ "Oi {{nome}}, ainda dá pra..."     │
└────────────────────────────────────┘
              │ +48h
┌── ETAPA 3 · 3 dias depois ─────────┐
│ Última tentativa                   │
│ "{{nome}}, vou te deixar tranquila"│
└────────────────────────────────────┘

ℹ️ Após a etapa 3 sem resposta, a automação encerra sozinha.
   O lead recebe a tag "Régua esgotada" e volta para a fila manual.
```

Cada card editável inline (textarea + botão salvar). Variáveis disponíveis listadas com exemplo: `{{nome}} → Maria`.

---

## 5. Responsividade

- **Desktop (≥1024px)**: 3 colunas como acima (320px / 1fr / 360px)
- **Tablet (768–1023px)**: 2 colunas — lista + thread; painel de contexto vira botão "Detalhes" no topo direito que abre um Sheet à direita
- **Mobile (<768px)**: 1 coluna — lista por padrão; ao tocar numa conversa, navega para a thread em tela cheia com botão "← Voltar"; painel de contexto e Automações viram Sheets de baixo para cima

Sem `bg-fixed`, sem scroll horizontal, áreas de toque ≥44px.

---

## 6. Aderência ao design system

- Tokens existentes: `bg-card`, `bg-muted/30`, `text-foreground`, `border-border`, `bg-success`, `bg-destructive`, `bg-honey`, `bg-clay`
- Tipografia: títulos em `font-display-warm`, números/timestamps em monoespaço (já temos `JetBrains Mono`)
- Bolhas enviadas usam `bg-[hsl(var(--moss)/0.18)]` com `border-moss/30` (verde quente farmstand, não o verde puro do WhatsApp — coerente com a paleta do projeto)
- Bolhas de automação: `bg-honey/15` + `border-honey/40` + ícone 🤖 — **automação sempre visualmente distinta**
- Sem glassmorphism, sem gradientes roxos, sem cursor custom (regras de memória respeitadas)

---

## 7. Estrutura de arquivos

Quebrar o `WhatsAppPage.tsx` (461 linhas, monolítico) em componentes coesos:

```text
src/pages/admin/WhatsAppPage.tsx                       ← shell + layout 3 colunas
src/components/whatsapp/
  ├── ConnectionStatusPill.tsx                          ← status + métricas do dia
  ├── ConversationList.tsx                              ← coluna 1 + filtros
  ├── ConversationListItem.tsx
  ├── ConversationThread.tsx                            ← coluna 2 (bolhas + composer)
  ├── MessageBubble.tsx                                 ← variantes: in/out/automation
  ├── MessageComposer.tsx                               ← textarea + imagem + templates + envio
  ├── LeadContextPanel.tsx                              ← coluna 3
  ├── AutomationStatusCard.tsx                          ← card "esta pessoa está recebendo..."
  ├── SetupDialog.tsx                                   ← stepper Z-API 3 passos
  ├── AutomationsDialog.tsx                             ← timeline editável dos 3 templates
  └── useWhatsAppData.ts                                ← hook: conversas, mensagens, realtime
```

### Realtime
Usar `supabase.channel` em `whatsapp_messages` (já está no `supabase_realtime`) para que mensagens novas apareçam ao vivo na thread aberta e na lista, sem refresh.

### Dados derivados
- "Conversas" = `SELECT DISTINCT lead_id` agrupando `whatsapp_messages`, com JOIN em `leads` para nome/phone/status/cadence_*. Query simples, ordenada por `MAX(created_at)`.
- "Não lidas" = mensagens `direction='in'` mais novas que o último `direction='out'` do mesmo lead. Cliente-side, sem schema novo.

### Pequena migração opcional (só se aprovar)
Adicionar `last_read_at TIMESTAMPTZ` em `whatsapp_messages` ou em `leads` para marcar leitura. **Vou pular nesta entrega** para manter escopo enxuto — "não lidas" é calculado no cliente.

---

## 8. O que NÃO muda

- Edge functions (`wa-send`, `wa-cadence-tick`, `wa-config-save`) — interface idêntica, só consumida diferente
- Schema das 3 tabelas WhatsApp
- Cron de cadência a cada 5 min
- Regras de RLS

---

## 9. QA depois de implementar

- Abrir a tela em desktop, tablet (768) e mobile (375)
- Validar: enviar texto, enviar imagem com preview, ver mensagem da automação aparecer com estilo distinto, abrir setup dialog, abrir automações dialog e editar uma mensagem
- Realtime: enviar mensagem em outra aba e ver aparecer na thread sem refresh
- Sem erros no console, sem scroll horizontal em nenhum breakpoint

---

## Resumo para você decidir

Mantenho 100% do backend que já fizemos. **Substituo a interface inteira** por uma tela única de Inbox — conversas no centro, automações explicadas em linguagem humana, configuração escondida em dialog, responsiva de verdade. Visualmente coerente com o resto do CRM warm farmstand.

Posso começar?
