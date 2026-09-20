# MindCut

Web tool that replicates Kensuke Koike's "Top Breeder" process: slicing an image into strips and rearranging them to multiply it. Inspired by the [autocutter](https://stihilus.github.io/autocutter/) interface.

## Concept

Kensuke Koike (b. 1980, Venice) is a Japanese artist whose philosophy is **"no more, no less"**: he adds or removes nothing from the original image, only rearranges what already exists. In his work *Top Breeder* (2018) he uses a manual pasta machine to cut a photo of a dog into strips, separate them into odd/even groups, and rebuild them stretched to produce **2 copies**, then repeats the process vertically to obtain **4 copies**.

MindCut digitizes that process with HTML5 Canvas.

## Stack

- HTML5 + CSS3 + vanilla JavaScript
- Canvas 2D API (`drawImage` with source/destination cropping)
- No external dependencies or build step
- Fonts: Sigurd Variable (display) + Courier Prime (mono) + Rules Variable

## Structure

```
mindcut/
├── index.html   Structure: top bar + toolbar + workspace
├── style.css    SISIFO-blue styles
├── app.js       Logic: upload, slicing, effects, save
├── INFO.md      This document
└── PLAN.md      Implementation plan
```

## Top Breeder Algorithm

Given an image of width `W` and height `H`, and a number of slices `N`:

### Step 1 — Horizontal cut
The image is divided into `N` horizontal strips of height `H/N`.

### Step 2 — Odd/even separation
The strips are grouped into two stacks:
- Stack A: even-indexed strips (0, 2, 4, ...)
- Stack B: odd-indexed strips (1, 3, 5, ...)

### Step 3 — Reconstruction (2 copies)
Each stack is reassembled into a full-size `W x H` image. Each strip is **stretched** to fill its slot (`H / count`), producing the characteristic mosaic/pixelated effect. Result: **2 copies**.

### Step 4 — Vertical cut (4 copies)
Each copy is cut vertically into `N` strips, separated into odd/even, and reassembled stretching each strip to its slot width. Result: **4 copies** arranged in a 2x2 grid.

### Stretch formula
```
slot = total_dimension / count
source_strip = (idx * strip, strip)
dest_strip = (i * slot, slot)
```

## Modes

### Top Breeder (automatic)
Applies the full algorithm: 1 photo → 4 copies in a 2x2 grid.

### Manual (free)
Cuts into strips and shuffles them randomly, with control over:
- Direction (horizontal / vertical)
- Number of slices
- Gap between strips

## Effects

- `none` — no filter
- `b&w` — grayscale (`ctx.filter = grayscale(1)`)
- `threshold` — binary threshold (pixel manipulation)
- `invert` — negative (`ctx.filter = invert(1)`)

## Controls

| Control | Description |
|---|---|
| `upload` | Load a local image |
| `cut` | Run the cut |
| `slices` | Number of strips (2–50) |
| `mode` | Top Breeder / Manual |
| `direction` | Horizontal / Vertical (manual only) |
| `effect` | Filter applied to the result |
| `gap` | Gap between strips (manual only) |
| `save` | Download result as PNG |

## Technical notes

- The result canvas in Top Breeder mode measures `2W x 2H`.
- Filters are applied to the result canvas before display.
- Drag & drop accepts any image file supported by the browser.
- All processing happens client-side; nothing is uploaded to any server.