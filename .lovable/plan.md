## Reposicionamento: de "cadastro" para "contato para comprar"

A pessoa que chega na landing quer **comprar o produto**, não se cadastrar pra newsletter. Vou reescrever os textos do CTA, navbar, hero, formulário e footer pra refletir isso. A lógica de salvar lead no banco continua igual (a tabela `leads` com origem "Site" segue sendo usada — agora representando um pedido de contato pra compra), só muda o discurso e a mensagem do WhatsApp.

### 1. Navbar (`src/components/landing/Navbar.tsx`)
- Botão "Cadastre-se" → **"Quero comprar"** (mantém `highlight: true` e âncora `#contato`).

### 2. Hero (`src/components/landing/StaticImageHero.tsx`)
- O hero atual já tem "Conhecer produtos" + "Falar conosco" — mantém. Sem mudança.

### 3. HeroSection antigo (`src/components/landing/HeroSection.tsx`)
- Não está sendo usado em `Index.tsx`, mas pra evitar texto inconsistente caso volte: trocar "Cadastre-se e receba dicas, novidades e ofertas" → "Fale com a gente pelo WhatsApp pra fazer seu pedido" e botão "Quero receber novidades" → "Quero comprar".

### 4. Formulário de contato (`src/components/landing/LeadFormSection.tsx`)
Mudanças de texto e UX (sem mudar a lógica de insert/honeypot/rate-limit):
- Sobretítulo (font-hand): "fica em contato" → **"vamos conversar"**
- Título: "Receba ofertas e novidades no WhatsApp" → **"Quer comprar? Fale com a gente"**
- Subtítulo: "Deixe seu nome e WhatsApp pra receber dicas, lançamentos e promoções..." → **"Deixe seu nome e WhatsApp que entramos em contato pra te atender e fechar seu pedido."**
- Botão submit: "Quero receber novidades 🌿" → **"Quero comprar 🌿"** (estado loading: "Enviando...")
- Microcopy abaixo do botão: "Não enviamos spam..." → **"Respondemos rapidinho pelo WhatsApp."**
- Toast de sucesso: "Cadastro realizado! 🎉" → **"Recebemos seu contato! 🎉"** com descrição "Abrindo o WhatsApp pra te atender."
- Toast de duplicado: "Você já está cadastrado!" → **"Já temos seu contato! 😊"** com descrição "Abrindo o WhatsApp pra continuar o atendimento."
- Toast de rate-limit: "Você já enviou um cadastro recentemente." → "Você já enviou um contato recentemente."
- Toast de erro: "Erro ao cadastrar" → "Erro ao enviar contato"
- Mensagem WhatsApp: `Olá! Acabei de me cadastrar pelo site, sou ${firstName} 🌿` → **`Olá! Quero comprar e deixei meu contato no site, sou ${firstName} 🌿`**
- Section id continua `#contato` (já é o nome certo). Comentários internos com "cadastro" também ajustados pra "contato".

### 5. Footer (`src/components/landing/Footer.tsx`)
- Link da seção "Empresa": "Cadastre-se" → **"Fale conosco"**.
- CTA grande verde: "Cadastre-se e receba novidades" → **"Quero comprar pelo WhatsApp"**.

### Resumo técnico
- 4 arquivos editados (Navbar, LeadFormSection, Footer, HeroSection legado).
- Zero mudança de schema, RLS, rota ou lógica de submit. Só copywriting + label do botão.
- Tabela `leads` continua recebendo os contatos com `origin: 'Site'` e `status: 'new'` — o admin continua atendendo do mesmo jeito no CRM.
