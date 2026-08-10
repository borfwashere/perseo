# MEDUSA

Herramientas de manipulación visual. Tres aplicaciones web para cortar, reordenar y multiplicar imágenes, cada una explorando una forma distinta de deconstruir lo visual.

## Herramientas

| Herramienta | Descripción |
|---|---|
| [mind](mindcut/) | Corta una imagen en tiras, separa pares e impares y estira cada grupo para crear copias múltiples (proceso "Top Breeder" de Kensuke Koike). |
| [cut](cut/) | Fragmenta una imagen en celdas irregulares y las recompone en una composición nueva, reproducible por semilla. |
| [scanner](scanner/) | Simula un escáner: una línea recorre la imagen y revela el resultado tira a tira, con capas, efectos y grabación de video. |

## Estructura

```
MEDUSA/
├── index.html        Landing page
├── mindcut/          Herramienta "mind" (Top Breeder)
├── cut/              Herramienta "cut" (fragmentación por semilla)
└── scanner/          Herramienta "scanner" (simulador de escáner)
```

Cada herramienta es autónoma: `index.html` + `style.css` + `app.js` (o `scanner.js`), con su propia documentación (`INFO.md` / `PLAN.md`).

## Uso

Abrir `index.html` en un navegador. No requiere servidor ni build step: todo el procesamiento ocurre en el cliente sobre Canvas 2D.

## Stack

- HTML5 + CSS3 + JavaScript puro (vanilla)
- Canvas 2D API
- Sin dependencias externas
- Tipografías: Playfair Display + Inter

## Licencia

© 2026 MEDUSA