# Plano: Atualizar vídeo da hero com novo upload

## Objetivo
Substituir o arquivo de vídeo atual da hero (`public/hero-cantim-scroll.mp4`) pelo novo vídeo enviado (`Video_cantim_da_roça_original.mp4`), mantendo todo o comportamento de scroll-scrubbing já implementado em `ScrollVideoHero.tsx`.

## O que muda
- Apenas o arquivo de vídeo. A lógica de scroll, sticky, animação do texto e CTAs permanecem iguais.
- O texto continua aparecendo conforme o usuário rola: headline entre 15%–45% do progresso e botões entre 35%–65%.

## Passos de implementação

1. **Copiar o novo vídeo** para `public/hero-cantim-scroll.mp4` (sobrescrevendo o atual).

2. **Re-encodar com ffmpeg** para garantir scrubbing fluido frame-a-frame:
   - GOP curto (`-g 8`, `-keyint_min 1`, `-sc_threshold 0`) para seek preciso
   - `-movflags +faststart` para começar a tocar rápido
   - H.264 `yuv420p`, CRF ~23, `-an` (sem áudio)
   - Largura máxima 1920px, mantendo proporção

3. **Regenerar o poster** `public/hero-cantim-poster.webp` a partir do primeiro frame do novo vídeo (fallback caso o vídeo falhe ao carregar).

4. **QA visual**: extrair 3 frames (início, meio, fim) do vídeo processado para confirmar que o conteúdo está correto antes de entregar.

## O que NÃO muda
- `src/components/landing/ScrollVideoHero.tsx` (lógica já está correta)
- `src/pages/Index.tsx`
- Posicionamento de logo, título e CTAs
- Altura do wrapper (250vh) e comportamento sticky

## Resultado esperado
A hero exibe o novo vídeo, e ao rolar o mouse os frames avançam/retornam suavemente. O headline e os botões aparecem progressivamente sobre o vídeo conforme o scroll, e após o vídeo terminar o restante da página rola normalmente.
