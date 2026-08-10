# Cut

Herramienta web que fragmenta una imagen en celdas irregulares y las recompone en una composición nueva, reproducible mediante una semilla de 6 caracteres.

## Concepto

Cut deconstruye una imagen en una grilla de celdas de tamaños variables y las reubica en una composición espiral. Cada resultado queda codificado por una **semilla** (`seed`): la misma imagen + la misma semilla producen siempre el mismo resultado. Esto convierte el azar en un lenguaje reproducible.

## Stack

- HTML5 + CSS3 + JavaScript puro (vanilla)
- Canvas 2D API (`drawImage` con recorte fuente/destino)
- Sin dependencias externas ni build step
- Fuentes: Playfair Display (títulos) + Inter (texto)

## Estructura

```
cut/
├── index.html   Estructura: header + toolbar + tabs source/result
├── style.css    Estilos B&W minimalistas
├── app.js       Lógica: grid, placement, efectos, export
└── INFO.md      Este documento
```

## Algoritmo

### 1. Generación de grilla
La imagen se escala a un target de 1000px en su dimensión mayor. Se parte de una celda única y se subdivide iterativamente la celda de mayor área hasta alcanzar el número de cortes deseado. Cada corte es vertical u horizontal según el azar (o según bordes fuertes si `aware` está activo).

### 2. Placement
Las celdas se barajan con un RNG sembrado y se colocan en espiral: cada pieza se ubica a la derecha, abajo, izquierda o arriba de la anterior, sin volver sobre la dirección opuesta. Con `rotate` activo, cada pieza rota 0/90/180/270°.

### 3. Composición
Las piezas se dibujan sobre un "papel" con color de fondo, padding y banda de título configurables. El resultado puede forzarse a un aspect ratio (A4, 4:5) o quedar libre.

## Controles

| Control | Descripción |
|---|---|
| `upload` | Cargar imagen local |
| `cut` | Reconstruir con nueva semilla |
| `cuts` | Número de celdas (2–200) |
| `aware` | Cortar a lo largo de bordes fuertes |
| `rotate` | Rotación aleatoria por pieza |
| `ar` | Forzar aspect ratio del resultado (none / a4 / 4:5) |
| `bg` | Color de fondo del papel |
| `pad` | Padding interior del papel |
| `title` | Altura de la banda de título |
| `crop` | Marcas de corte + bleed al guardar |
| `effect` | Filtro aplicado a todos los renders |
| `seed` | Semilla para reproducir un resultado |
| `grid` | Overlay de grilla fantasma |
| `stroke` | Trazo alrededor de cada pieza |
| `sheet` | Ver todas las celdas en una hoja |
| `save` | Descargar resultado como PNG |

## Notas técnicas

- El RNG es `mulberry32`, sembrado con el hash de la semilla + un salt por fase (grid, placement, rotación).
- `aware` analiza el gradiente de luminancia en la línea media de la celda para elegir el corte con mayor diferencia.
- El modo `sheet` compone todas las celdas en una hoja A4 con captions de número y resolución original.
- Todo el procesamiento ocurre en el cliente; no se sube nada a ningún servidor.