## Nova Hero com vídeo controlado pelo scroll

Substituir apenas a `HeroSection` atual por um novo componente `ScrollVideoHero`, mantendo todo o resto do site (Navbar, Benefits, Products, Testimonials, LeadForm, Footer) intacto.

### Comportamento

- Wrapper externo com altura ~250vh para criar “distância” de scroll.
- Dentro dele, container `sticky top-0 h-screen` que segura a hero travada na viewport enquanto o vídeo avança.
- Vídeo único MP4 como background, `muted`, `playsInline`, `preload="auto"`, `disableRemotePlayback`, sem controles, sem autoplay tradicional.
- `requestAnimationFrame` calcula `progress` (0–1) baseado em `getBoundingClientRect()` do wrapper e aplica `video.currentTime = video.duration * progress`.
- Ao final do progresso, a hero deixa de ser sticky e a página rola normalmente para a próxima seção (Benefits).
- Fallback: imagem poster `hero-cantim-poster.webp` exibida via `poster` do `<video>` e como `<img>` de fallback se `canplay` não disparar em ~3s ou se `prefers-reduced-motion` estiver ativo. Em mobile (`matchMedia('(max-width: 640px)')` + checagem de `connection.saveData`), usar somente o poster estático sem o vídeo.

### Estrutura visual

- Vídeo `absolute inset-0 w-full h-full object-cover`.
- Overlay marrom/escuro suave: gradiente `from-black/55 via-black/35 to-black/65` + leve tom da paleta marca (`bg-[hsl(var(--primary))]/10` em mix mode).
- Logo `cantim-logo.png` no topo-esquerdo (com fallback centralizado em mobile), tamanho ~140–160px.
- Headline grande centralizada: “Produtos naturais selecionados para cuidar de você” (Playfair Display, branco, drop-shadow sutil).
- Dois botões abaixo: “Conhecer produtos” (primário) e “Falar no WhatsApp” (outline claro com ícone).
- Sem grid background, sem orbit leaves, sem shaders — visual limpo focado no vídeo.

### Animações de UI dirigidas pelo scroll

Mesmo `progress` 0–1 já calculado é usado para animar:

- `0.00–0.15`: apenas vídeo + logo visíveis (logo com leve fade-in nos primeiros 200ms ao montar).
- `0.15–0.45`: headline aparece — `opacity 0 → 1`, `translateY 24px → 0`.
- `0.35–0.65`: botões aparecem — `opacity 0 → 1`, `translateY 16px → 0`, com pequeno stagger entre os dois.
- `> 0.85`: leve fade-out opcional do overlay de texto para entregar suavemente à próxima seção.

Tudo aplicado via `style` inline (transform/opacity) calculado no mesmo rAF — sem GSAP, sem dependências novas.

### Performance

- Sem novas libs.
- Um único `requestAnimationFrame` loop, cancelado no unmount; listener de scroll passivo apenas para agendar o frame.
- `will-change: transform, opacity` apenas nos elementos animados.
- Em mobile/`saveData`/`prefers-reduced-motion`: render apenas do poster + textos estáticos, sem montar `<video>` nem rAF.
- Vídeo carregado com `preload="auto"` e `playsInline`; nunca chamamos `.play()`.

### Assets

- Copiar o upload para `public/hero/hero-cantim-scroll.mp4` (servido estático, com suporte a HTTP range para o seek por scroll funcionar bem).
- Gerar `public/hero/hero-cantim-poster.webp` extraindo o primeiro frame do vídeo via ffmpeg + cwebp (qualidade ~78, largura 1920).

### Arquivos

**Novos**
- `src/components/landing/ScrollVideoHero.tsx` — componente da hero.
- `public/hero/hero-cantim-scroll.mp4` — vídeo (cópia do upload).
- `public/hero/hero-cantim-poster.webp` — poster gerado do 1º frame.

**Modificado**
- `src/pages/Index.tsx` — trocar `<HeroSection scrollY={scrollY} />` por `<ScrollVideoHero />`. Nenhuma outra seção é alterada.

**Não alterado**
- `HeroSection.tsx` permanece no repositório (não removido) caso o usuário queira voltar atrás; apenas deixa de ser importado.

### Detalhes técnicos chave

```text
<section> wrapper: position relative; height: 250vh
  └── <div sticky top-0 h-screen overflow-hidden>
        ├── <video|img poster> absolute inset-0 object-cover
        ├── overlay gradiente
        └── <div content> flex col, logo + headline + CTAs
                (opacity/translateY calculados via progress)
```

Cálculo de progresso:
```ts
const rect = wrapperRef.current.getBoundingClientRect();
const total = rect.height - window.innerHeight;
const progress = clamp(-rect.top / total, 0, 1);
if (video.duration) video.currentTime = video.duration * progress;
```

CTAs reaproveitam o `Button` shadcn já usado e fazem scroll para `#produtos` e link `https://wa.me/...` (mantendo o número do WhatsApp já configurado em `src/config/app.ts` se existir; caso contrário, usar o mesmo destino do `WhatsAppFloat` atual).