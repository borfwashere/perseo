# PLAN — Cut

Implementation plan for the image fragmentation and recomposition tool.

## Objective

Deconstruct an image into irregular cells and recompose them into a new composition, reproducible by seed, with a minimalist B&W aesthetic.

## Steps

### 1. Project structure
- [x] Create `cut/` folder
- [x] Create `INFO.md` (technical documentation)
- [x] Create `PLAN.md` (this file)

### 2. Interface (`index.html`)
- [x] Header with MEDUSA nav + controls (file, cut, paper, view)
- [x] Source/result tab bar with per-tab tools
- [x] Canvas panels + modals (preview, sheet)
- [x] Toast for feedback

### 3. Styles (`style.css`)
- [x] White background, black text, Playfair Display + Inter typography
- [x] Inline underlined controls (autocutter style)
- [x] Responsive with canvas adapting to the viewport

### 4. Logic (`app.js`)
- [x] Upload + drag & drop
- [x] Grid generation by area subdivision
- [x] Spiral placement with seeded RNG
- [x] Reproducible seed (6 characters)
- [x] Aware mode (cut by strong edges)
- [x] Random rotation per piece
- [x] Aspect ratio (none / a4 / 4:5)
- [x] Paper: bg, padding, title band
- [x] Effects: none, b&w, threshold, posterize, dither
- [x] Grid overlay + stroke toggle
- [x] Crop marks + bleed
- [x] Sheet view (all cells on an A4 sheet)
- [x] Preview modal + save PNG

### 5. Verification
- [x] Test with local image
- [x] Test reproducible seeds
- [x] Verify PNG download

## Dependencies

- Step 4 depends on 2 and 3 (structure and styles ready).
- The grid/placement algorithm is independent of the UI.

## Estimation

| Phase | Effort |
|---|---|
| Structure + docs | Low |
| Interface + styles | Medium |
| Canvas logic | High |
| Verification | Low |

## Risks

- Very large images → the result canvas can consume memory; the source is scaled to 1000px.
- Spiral placement can produce very elongated compositions → compensated with aspect ratio or padding.
- `getImageData` in aware mode is expensive → a single line per cell is sampled.