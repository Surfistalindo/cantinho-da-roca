

## Problem Analysis

From image-24, the current cards show a gray/blank area at the top where the shader should be — the `<Warp />` component requires WebGL which may not be available in the sandbox preview, resulting in empty shader areas. The current layout uses a "shader stripe at top + white content below" pattern.

From image-25 (the reference), the desired design has the **shader as the full card background** with text overlaid on top in white — a completely different layout than what's currently implemented.

## Plan

### 1. Rewrite BenefitsSection with CSS gradient fallbacks

Since WebGL shaders may fail silently in environments without GPU support, the cards need a **dual approach**:
- Keep `<Warp />` for browsers that support WebGL
- Add a CSS gradient background as a visible fallback behind the shader canvas
- Change earthy/warm color palettes for the rural theme

### 2. Restructure card layout to match reference (image-25)

Change from "shader stripe + white content" to **full shader background with overlaid content**:
- Shader fills the entire card (not just a top stripe)
- Icon, title, description, and "Saiba mais" link rendered on top in white text
- Semi-transparent dark overlay for text readability
- Earthy warm tones: browns, greens, warm golds

### 3. Add CSS gradient fallback colors

Each card gets a matching CSS gradient background that shows when WebGL is unavailable:
- Card 1 (Saúde): Deep green gradient
- Card 2 (Qualidade): Warm brown/amber gradient  
- Card 3 (Resultados): Forest green gradient
- Card 4 (Entrega): Earth brown gradient

### 4. Mobile responsiveness

- Single column on mobile (`grid-cols-1`), 2 columns on `sm:` breakpoint
- Reduce card min-height on mobile
- Adjust padding and font sizes for small screens
- Ensure shader canvas has proper dimensions with `style={{ width: '100%', height: '100%', position: 'absolute' }}`

### Files Modified
- `src/components/landing/BenefitsSection.tsx` — Full rewrite of card structure

