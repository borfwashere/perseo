# PERSEO

Visual manipulation tools. Three web apps to cut, rearrange and multiply images, each exploring a different way of deconstructing the visual.

## Tools

| Tool | Description |
|---|---|
| [mind](mindcut/) | Slices an image into strips, separates odd and even, then stretches each group to create multiple copies (Kensuke Koike's "Top Breeder" process). |
| [cut](cut/) | Shatters an image into irregular cells and recomposes them into a new composition, reproducible by seed. |
| [scanner](scanner/) | Simulates a scanner: a line sweeps across the image, revealing the result strip by strip, with layers, effects and video recording. |

## Structure

```
PERSEO/
├── index.html        Landing page
├── fonts/            SISIFO typefaces (Sigurd, Courier Prime, Rules)
├── mindcut/          "mind" tool (Top Breeder)
├── cut/              "cut" tool (seed-based fragmentation)
└── scanner/          "scanner" tool (scanner simulator)
```

Each tool is self-contained: `index.html` + `style.css` + `app.js` (or `scanner.js`), with its own documentation (`INFO.md` / `PLAN.md`).

## Usage

Open `index.html` in a browser. No server or build step required: all processing happens client-side on Canvas 2D.

## Stack

- HTML5 + CSS3 + vanilla JavaScript
- Canvas 2D API
- No external dependencies
- Fonts: Sigurd Variable + Courier Prime + Rules Variable (SISIFO identity)

## License

© 2026 PERSEO