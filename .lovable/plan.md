

## Plan: Add 4 WebGL Shaders + Parallax Title + 3D Scroll Effects

### What we're building
1. **4 Warp WebGL shaders** — one on each of these sections: Hero, Benefits, Products, Testimonials (only 4, not 9 like before)
2. **Parallax effect on "Cantım da Roça"** — title moves at a different speed than the rest when scrolling
3. **3D scroll effects** — sections transform (rotate, scale, translate in Z) as the user scrolls into view

### Changes

#### 1. HeroSection — Parallax title + 1 Warp shader background
- Use the `scrollY` prop (already passed) to apply `translateY(scrollY * 0.4)` on the title for parallax
- Add a single `<Warp>` behind the hero with subtle green tones and low speed
- Keep leaves, shimmer, and existing layout intact

#### 2. BenefitsSection — 1 Warp shader + 3D scroll reveal
- Add a single `<Warp>` as the section background (green/earthy tones, low opacity)
- Add scroll-driven 3D transforms: cards rotate in from `rotateX(15deg)` as they enter viewport
- Use `useScrollAnimation` for trigger

#### 3. ProductsSection — 1 Warp shader + 3D scroll reveal
- Add a single `<Warp>` as section background (warm earthy tones)
- Cards scale up from `scale(0.8) translateZ(-50px)` on scroll entry

#### 4. TestimonialsSection — 1 Warp shader
- Need to check this file first, then add a subtle `<Warp>` background
- Keep existing content, just add the shader layer

#### 5. Index.tsx — Pass scrollY to more sections
- Pass `scrollY` to Benefits, Products, Testimonials for scroll-driven 3D effects

#### 6. Performance guardrails
- Only 4 shader instances (vs 9 before)
- Set `speed={0.3}` and low `scale` on all Warps to minimize GPU load
- Use `will-change: transform` on parallax elements
- Keep `@paper-design/shaders-react` (already in package.json)

### Files to edit
- `src/components/landing/HeroSection.tsx` — add Warp bg + parallax on title
- `src/components/landing/BenefitsSection.tsx` — add Warp bg + 3D scroll cards
- `src/components/landing/ProductsSection.tsx` — add Warp bg + 3D scroll cards
- `src/components/landing/TestimonialsSection.tsx` — add Warp bg
- `src/pages/Index.tsx` — pass scrollY to more components
- `src/index.css` — 3D scroll utility styles if needed

