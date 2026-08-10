# Cut

Web tool that shatters an image into irregular cells and recomposes them into a new composition, reproducible with a 6-character seed.

## Concept

Cut deconstructs an image into a grid of variable-size cells and relocates them into a spiral composition. Each result is encoded by a **seed**: the same image + the same seed always produce the same result. This turns randomness into a reproducible language.

## Stack

- HTML5 + CSS3 + vanilla JavaScript
- Canvas 2D API (`drawImage` with source/destination cropping)
- No external dependencies or build step
- Fonts: Playfair Display (titles) + Inter (text)

## Structure

```
cut/
├── index.html   Structure: header + toolbar + source/result tabs
├── style.css    Minimalist B&W styles
├── app.js       Logic: grid, placement, effects, export
└── INFO.md      This document
```

## Algorithm

### 1. Grid generation
The image is scaled to a 1000px target on its largest dimension. Starting from a single cell, the largest-area cell is iteratively subdivided until the desired number of cuts is reached. Each cut is vertical or horizontal based on randomness (or on strong edges if `aware` is active).

### 2. Placement
The cells are shuffled with a seeded RNG and placed in a spiral: each piece is positioned right, down, left or up of the previous one, never going back to the opposite direction. With `rotate` active, each piece rotates 0/90/180/270°.

### 3. Composition
The pieces are drawn on a "paper" with configurable background color, padding and title band. The result can be forced to an aspect ratio (A4, 4:5) or left free.

## Controls

| Control | Description |
|---|---|
| `upload` | Load a local image |
| `cut` | Rebuild with a new seed |
| `cuts` | Number of cells (2–200) |
| `aware` | Cut along strong edges |
| `rotate` | Random rotation per piece |
| `ar` | Force result aspect ratio (none / a4 / 4:5) |
| `bg` | Paper background color |
| `pad` | Inner paper padding |
| `title` | Title band height |
| `crop` | Crop marks + bleed when saving |
| `effect` | Filter applied to all renders |
| `seed` | Seed to reproduce a result |
| `grid` | Ghost grid overlay |
| `stroke` | Stroke around each piece |
| `sheet` | View all cells on a sheet |
| `save` | Download result as PNG |

## Technical notes

- The RNG is `mulberry32`, seeded with the seed hash + a salt per phase (grid, placement, rotation).
- `aware` analyzes the luminance gradient on the cell's midline to choose the cut with the greatest difference.
- `sheet` mode composes all cells on an A4 sheet with number captions and original resolution.
- All processing happens client-side; nothing is uploaded to any server.