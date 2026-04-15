

## Plan: Optimize Performance and Mobile Responsiveness

### Problem Analysis

The main performance bottleneck is the **Warp WebGL shader** from `@paper-design/shaders-react`. There are **9 active WebGL shader instances** (6 in BenefitsSection + 3 in ProductsSection), each running continuous GPU-heavy animations. This is the primary cause of lag.

Secondary issues: leaf orbit animation needs `will-change` for GPU compositing, and several sections have layout issues on mobile.

---

### Changes

#### 1. Remove Warp Shaders from BenefitsSection and ProductsSection
- Replace the heavy WebGL `<Warp>` backgrounds with lightweight **CSS gradient backgrounds** that match the current color schemes
- Remove the `@paper-design/shaders-react` import from both files
- Keep the 3D tilt hover effect on cards (CSS-only, not heavy)

#### 2. Optimize Leaf Orbit Animation
- Add `will-change: transform` to promote leaves to GPU layers
- Reduce from 6 to 4 leaves for less paint work
- Keep the 30s duration (already slow enough)

#### 3. Fix "SUPLEMENTOS NATURAIS" Text Clipping
- The container uses `items-end` and fixed widths causing overflow
- Add proper responsive padding and ensure `<br />` between "SUPLEMENTOS" and "NATURAIS" renders correctly on all breakpoints
- Adjust the services container to not clip on narrow screens

#### 4. Mobile Responsiveness Pass
- **HeroSection**: Scale down title font, adjust logo watermark size, fix image overlap on small screens
- **BenefitsSection**: Ensure single-column cards have proper spacing on mobile
- **ProductsSection**: Stack cards vertically with proper gaps
- **LeadFormSection**: Already responsive, minor padding tweaks
- **Footer**: Already uses responsive grid, verify on small screens
- **Navbar**: Already responsive with mobile menu

#### 5. General Optimizations
- Add `loading="lazy"` to hero product image (below fold on mobile)
- Use `contain: layout style` on animated sections to limit repaints

---

### Files to Edit
- `src/components/landing/BenefitsSection.tsx` — remove Warp, use CSS gradients
- `src/components/landing/ProductsSection.tsx` — remove Warp, use CSS gradients
- `src/components/landing/HeroSection.tsx` — fix text clipping, optimize leaves, mobile fixes
- `tailwind.config.ts` — minor animation tweaks

### Expected Result
- Dramatic performance improvement (removing 9 WebGL contexts)
- Smooth 60fps scrolling on mobile and desktop
- All text visible without clipping
- Fully responsive layout across all breakpoints

