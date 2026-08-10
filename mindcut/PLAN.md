# PLAN — MindCut

Implementation plan for the image duplication tool by slicing.

## Objective

Replicate Kensuke Koike's "Top Breeder" process in the browser, with an interface similar to autocutter and a minimalist B&W aesthetic.

## Steps

### 1. Project structure
- [x] Create `mindcut/` folder
- [x] Create `INFO.md` (technical documentation)
- [x] Create `PLAN.md` (this file)

### 2. Interface (`index.html`)
- [x] Hero: title "mindcut", subtitle, meta (technique, philosophy)
- [x] Toolbar: upload, cut, slices, mode, direction, effect, gap, save
- [x] Workspace: source panel + result panel
- [x] Footer with credits

### 3. Styles (`style.css`)
- [x] White background, black text, secondary grays
- [x] Playfair Display + Inter typography
- [x] Fixed toolbar in autocutter style
- [x] Responsive (1024px, 600px)

### 4. Logic (`app.js`)
- [x] Upload + drag & drop
- [x] Source image render on canvas
- [x] `drawStrips` algorithm (cut + separation + stretch)
- [x] Top Breeder mode (1 → 2 → 4 copies)
- [x] Manual mode (shuffle + gap)
- [x] Effects: none, b&w, threshold, invert
- [x] Save PNG

### 5. Verification
- [x] Test with local image
- [x] Test both modes and effects
- [x] Verify PNG download

## Dependencies

- Step 4 depends on 2 and 3 (structure and styles ready).
- The slicing algorithm is independent of the UI.

## Estimation

| Phase | Effort |
|---|---|
| Structure + docs | Low |
| Interface + styles | Medium |
| Canvas logic | High |
| Verification | Low |

## Risks

- `ctx.filter` not supported in very old browsers → fallback with pixel manipulation.
- Very large images → the 2x canvas can consume memory; the maximum render size is limited.
- Strip stretching produces horizontal/vertical distortion (intended effect, not a bug).