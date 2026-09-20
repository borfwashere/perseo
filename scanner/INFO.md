# Scanner

Web tool that simulates a scanner: a line sweeps across the source image, revealing the result strip by strip in an adjacent panel.

## Concept

Scanner digitizes the physical gesture of scanning: the image is positioned in the source panel (drag to move, right-click to rotate, wheel to zoom) and when scanning starts a vertical line sweeps the panel, copying strips of pixels to the result panel. The result accumulates in layers with blend modes, effects and video recording.

## Stack

- HTML5 + CSS3 + vanilla JavaScript
- Canvas 2D API + `MediaRecorder` for video
- No external dependencies or build step
- Fonts: Sigurd Variable (display) + Courier Prime (mono) + Rules Variable

## Structure

```
scanner/
├── index.html   Structure: toolbar + source/result panels + effects modal
├── scanner.js   Logic: ScannerApp class (layout, scan, layers, effects, export)
└── INFO.md      This document
```

## Pipeline

### 1. Layout
`computeLayout()` calculates the size of both panels based on the viewport and the chosen format (free, 16:9, 4:5, 1:1, A4). Both canvases share dimensions.

### 2. Positioning
The image is fitted to the panel (`fitImage`) and can be moved, rotated and scaled with mouse or touch (drag, right-click rotate, wheel zoom, pinch).

### 3. Scanning
On each frame while `scanning`, the position advances according to the speed (`slow` 25, `normal` 50, `fast` 75 px/sec). The swept strip is copied from the source canvas to the active layer:

```
scanPos = min(panelW, scanPos + speed * dt)
act.drawImage(srcCanvas, prev, 0, cur - prev, panelH, prev, 0, cur - prev, panelH)
```

### 4. Layers
Each completed scan is committed as a layer with its blend mode (normal, multiply, screen). The result composites all layers in order.

### 5. Effects
Applied to the result canvas: b&w, threshold, invert, posterize, noise and dither (Floyd–Steinberg). The effects modal shows a live preview.

## Controls

| Control | Description |
|---|---|
| `Load Image` | Load a local image (or drag & drop) |
| `Start Scan` | Start the sweep |
| `Stop` | Stop the scan |
| `Undo` | Undo the last layer |
| `Effects` | Open the effects modal |
| `Ghost` | Show the ghost source in the result |
| `Blend` | Blend mode of the active layer |
| `Format` | Aspect ratio of the panels |
| `Speed` | Scan speed |
| `REC` | Arm video recording (starts with the scan) |
| `Save PNG` | Export result |
| `Save WebM` | Export recording |

## Technical notes

- Undo keeps a stack of up to 20 layer snapshots.
- Recording uses `canvas.captureStream(30)` + `MediaRecorder` with VP9 codec when available.
- Effects are applied per pixel on `ImageData`; dither uses the Floyd–Steinberg algorithm.
- All processing happens client-side; nothing is uploaded to any server.