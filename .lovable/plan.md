

## Plan: More Leaves + Strategic Scatter + 3D Scroll Effects

### What changes

#### 1. Increase orbiting leaves around title (HeroSection)
- Go from 4 to **8 leaves** orbiting the full title width
- Make the orbit ellipse wider (450px x 80px) so they circle the entire "Cantım da Roça" text
- Vary leaf sizes (14-28px) and add slight rotation variation for organic feel
- Keep `will-change: transform` and CSS animation (no JS = no lag)

#### 2. Scattered decorative leaves throughout the hero
- Add **6 static/floating leaves** positioned absolutely around the hero section (corners, near CTA, near image)
- Use a gentle CSS `float` keyframe (subtle up/down 8px movement, 6-10s duration) — extremely lightweight
- Apply parallax via `scrollY` transform so they move at different speeds (0.1x, 0.15x, 0.25x) creating depth layers

#### 3. Scattered leaves on other sections
- **BenefitsSection**: 2 small leaves, one top-right, one bottom-left, with slow float animation
- **ProductsSection**: 2 leaves near section edges
- **TestimonialsSection**: 1 leaf accent
- All use the same `LeafSVG` component (extracted to shared file) with CSS-only float animation

#### 4. 3D scroll effects (low-lag approach)
- Use CSS `transform` driven by `useScrollAnimation` intersection observer (no scroll listener per-frame for these sections)
- **BenefitsSection cards**: Already have 3D rotateX entry — keep as-is
- **ProductsSection cards**: Already have 3D scale/rotateY entry — keep as-is  
- **Section dividers**: Add a subtle `translateZ` + `rotateX(2deg)` parallax on section headings using `scrollY` prop (pass from Index.tsx)
- All transforms use `will-change: transform` for GPU compositing

#### 5. New CSS keyframe: `leaf-float`
- Add to `tailwind.config.ts`:
```
"leaf-float": {
  "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
  "50%": { transform: "translateY(-8px) rotate(3deg)" }
}
```
- Duration: 6-10s, linear infinite — minimal GPU cost

#### 6. Extract LeafSVG to shared component
- Create `src/components/landing/LeafSVG.tsx` so it can be reused across Hero, Benefits, Products, Testimonials
- Add a `leafGrad` id suffix per instance to avoid SVG gradient ID conflicts

### Performance approach
- All new leaves are **CSS-only animations** (no JS timers, no requestAnimationFrame)
- Static positioned elements with `will-change: transform`
- No additional WebGL shaders — keep the existing 4 Warp instances
- Scattered leaves use `opacity: 0.15-0.3` so they're decorative, not distracting

### Files to edit
- `src/components/landing/LeafSVG.tsx` — new shared component
- `src/components/landing/HeroSection.tsx` — more orbit leaves + scattered hero leaves with parallax
- `src/components/landing/BenefitsSection.tsx` — 2 scattered leaves
- `src/components/landing/ProductsSection.tsx` — 2 scattered leaves  
- `src/components/landing/TestimonialsSection.tsx` — 1 scattered leaf
- `src/pages/Index.tsx` — pass `scrollY` to Benefits, Products, Testimonials
- `tailwind.config.ts` — add `leaf-float` keyframe

