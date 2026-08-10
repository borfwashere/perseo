# MindCut

Herramienta web que replica el proceso "Top Breeder" de Kensuke Koike: cortar una imagen en tiras y reorganizarlas para multiplicarla. Inspirada en la interfaz de [autocutter](https://stihilus.github.io/autocutter/).

## Concepto

Kensuke Koike (b. 1980, Venecia) es un artista japonés cuya filosofía es **"no more, no less"**: no agrega ni remueve nada de la imagen original, solo reorganiza lo que ya existe. En su obra *Top Breeder* (2018) usa una máquina de pasta manual para cortar una foto de un perro en tiras, separarlas en grupos pares/impares, y reconstruirlas estiradas para producir **2 copias**, y luego repite el proceso en vertical para obtener **4 copias**.

MindCut digitaliza ese proceso con HTML5 Canvas.

## Stack

- HTML5 + CSS3 + JavaScript puro (vanilla)
- Canvas 2D API (`drawImage` con recorte fuente/destino)
- Sin dependencias externas ni build step
- Fuentes: Playfair Display (títulos) + Inter (texto)

## Estructura

```
mindcut/
├── index.html   Estructura: hero + toolbar + workspace
├── style.css    Estilos B&W minimalistas
├── app.js       Lógica: upload, slicing, efectos, save
├── INFO.md      Este documento
└── PLAN.md      Plan de implementación
```

## Algoritmo Top Breeder

Dada una imagen de ancho `W` y alto `H`, y un número de cortes `N`:

### Paso 1 — Corte horizontal
La imagen se divide en `N` tiras horizontales de alto `H/N`.

### Paso 2 — Separación pares/impares
Las tiras se agrupan en dos pilas:
- Pila A: tiras de índice par (0, 2, 4, ...)
- Pila B: tiras de índice impar (1, 3, 5, ...)

### Paso 3 — Reconstrucción (2 copias)
Cada pila se reensambla en una imagen de tamaño completo `W x H`. Cada tira se **estira** para llenar su ranura (`H / count`), produciendo el efecto mosaico/pixelado característico. Resultado: **2 copias**.

### Paso 4 — Corte vertical (4 copias)
Cada copia se corta verticalmente en `N` tiras, se separan pares/impares, y se reensamblan estirando cada tira al ancho de su ranura. Resultado: **4 copias** dispuestas en una grilla 2x2.

### Fórmula de estirado
```
slot = dimension_total / count
tira_fuente = (idx * strip, strip)
tira_destino = (i * slot, slot)
```

## Modos

### Top Breeder (automático)
Aplica el algoritmo completo: 1 foto → 4 copias en grilla 2x2.

### Manual (libre)
Corta en tiras y las baraja aleatoriamente, con control de:
- Dirección (horizontal / vertical)
- Número de cortes
- Separación (gap) entre tiras

## Efectos

- `none` — sin filtro
- `b&w` — escala de grises (`ctx.filter = grayscale(1)`)
- `threshold` — umbral binario (pixel manipulation)
- `invert` — negativo (`ctx.filter = invert(1)`)

## Controles

| Control | Descripción |
|---|---|
| `upload` | Cargar imagen local |
| `cut` | Ejecutar el corte |
| `slices` | Número de tiras (2–50) |
| `mode` | Top Breeder / Manual |
| `direction` | Horizontal / Vertical (solo manual) |
| `effect` | Filtro aplicado al resultado |
| `gap` | Separación entre tiras (solo manual) |
| `save` | Descargar resultado como PNG |

## Notas técnicas

- El canvas de resultado en modo Top Breeder mide `2W x 2H`.
- Los filtros se aplican sobre el canvas de resultado antes de mostrarlo.
- El drag & drop acepta cualquier archivo de imagen soportado por el navegador.
- Todo el procesamiento ocurre en el cliente; no se sube nada a ningún servidor.