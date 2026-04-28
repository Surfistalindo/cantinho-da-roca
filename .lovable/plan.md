## Problema

Em alguns passos do tutorial a seta direcional não aparece (ex.: passo "Criar novo lead" e "Tabela ou Kanban" nos screenshots), enquanto em outros aparece. O usuário quer consistência: **sempre que o passo apontar para um elemento da tela, a seta deve estar visível**.

## Causa

O `TourPopover` calcula a posição da seta no corpo do componente lendo `cardRef.current?.offsetHeight ?? 0`. No primeiro render essa leitura retorna `0`:

- Para `placement: bottom/top` a seta usa apenas `targetCenterX - pos.left`, então funciona depois que `pos` se estabiliza.
- Para `placement: left/right` o cálculo precisa de `cardHeight` (`localY = clamp(targetCenterY - pos.top - ARROW/2, 16, ch - 16 - ARROW)`). Com `ch = 0`, o clamp fica negativo e a seta vai parar no canto superior, frequentemente fora da viewport ou tapada por overflow.
- Além disso, quando o popover é clampado nas bordas da tela (alvos no canto, como o botão "+ Novo"), a seta atual (losango com bordas) tem cor `bg-popover` (mesma do card) com bordas finas — e contra o overlay escuro do tutorial fica praticamente invisível, dando a impressão de "não tem seta".

## Correção

Em `src/components/tutorial/TourPopover.tsx`:

1. **Medir altura do card via estado**, com `ResizeObserver`, para que mudanças (ex.: clicar em "explica melhor") reposicionem a seta corretamente.
2. **Trocar a seta por um triângulo SVG sólido** preenchido com `hsl(var(--primary))` — sempre visível contra qualquer fundo, sem depender de bordas. Mantém o pulso suave existente.
3. **Garantir que a seta sempre seja desenhada quando há `targetRect`** (não-viewport): se `placement === 'auto'` ainda não foi resolvido, usar fallback `bottom`. Isso elimina o caso "passo tem alvo mas seta não aparece".
4. Continuar **sem seta** apenas para passos `target: '__viewport__'` (intro/centralizado) — comportamento correto.

```tsx
// estado para altura
const [cardHeight, setCardHeight] = useState(0);
useLayoutEffect(() => {
  const el = cardRef.current;
  if (!el) return;
  const update = () => setCardHeight(el.offsetHeight);
  update();
  const ro = new ResizeObserver(update);
  ro.observe(el);
  return () => ro.disconnect();
}, []);

// Renderização (substituir o <span> atual por SVG com triângulo)
{targetRect && resolvedPlacement !== 'auto' && (
  <ArrowIndicator
    placement={resolvedPlacement}
    targetRect={targetRect}
    popoverPos={pos}
    cardHeight={cardHeight}
  />
)}
```

O componente `ArrowIndicator` (interno) renderiza um SVG 16x16 com `<polygon>` apontando na direção certa, posicionado em coordenadas absolutas dentro do card (com clamp para sempre cair no eixo do alvo, mas dentro do limite visual do popover). Cor `fill="hsl(var(--primary))"` + drop-shadow primary/40 para o glow pulsante.

## Verificação após o fix

- Passos com alvo lateral (`leads-view-toggle`, `leads-new`, `excel-history`, etc.): seta verde visível apontando para o alvo.
- Passos `__viewport__` (intros centralizadas): sem seta — esperado.
- Trocar entre passos: seta acompanha sem "pular" para o canto.
- Abrir/fechar "Não entendi, explica melhor": seta reposiciona suavemente.

## Arquivos alterados

- `src/components/tutorial/TourPopover.tsx`
