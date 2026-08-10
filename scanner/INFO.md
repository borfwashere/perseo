# Scanner

Herramienta web que simula un escáner: una línea recorre la imagen fuente y revela el resultado tira a tira en un panel contiguo.

## Concepto

Scanner digitaliza el gesto físico de escanear: la imagen se posiciona en el panel fuente (arrastrar mueve, click derecho rota, rueda hace zoom) y al iniciar el escaneo una línea vertical barre el panel copiando tiras de píxeles al panel resultado. El resultado se acumula en capas con modos de fusión, efectos y grabación de video.

## Stack

- HTML5 + CSS3 + JavaScript puro (vanilla)
- Canvas 2D API + `MediaRecorder` para video
- Sin dependencias externas ni build step
- Fuentes: Playfair Display (títulos) + Inter (texto)

## Estructura

```
scanner/
├── index.html   Estructura: toolbar + paneles source/result + modal de efectos
├── scanner.js   Lógica: clase ScannerApp (layout, scan, capas, efectos, export)
└── INFO.md      Este documento
```

## Pipeline

### 1. Layout
`computeLayout()` calcula el tamaño de los dos paneles según el viewport y el formato elegido (free, 16:9, 4:5, 1:1, A4). Ambos canvas comparten dimensiones.

### 2. Posicionamiento
La imagen se ajusta al panel (`fitImage`) y puede moverse, rotarse y escalarse con mouse o touch (drag, right-click rotate, wheel zoom, pinch).

### 3. Escaneo
En cada frame mientras `scanning`, la posición avanza según la velocidad (`slow` 25, `normal` 50, `fast` 75 px/seg). La tira barrida se copia del canvas fuente al layer activo:

```
scanPos = min(panelW, scanPos + speed * dt)
act.drawImage(srcCanvas, prev, 0, cur - prev, panelH, prev, 0, cur - prev, panelH)
```

### 4. Capas
Cada escaneo completo se commitea como una capa con su modo de fusión (normal, multiply, screen). El resultado compone todas las capas en orden.

### 5. Efectos
Se aplican sobre el canvas de resultado: b&w, threshold, invert, posterize, noise y dither (Floyd–Steinberg). El modal de efectos muestra un preview en vivo.

## Controles

| Control | Descripción |
|---|---|
| `Load Image` | Cargar imagen local (o drag & drop) |
| `Start Scan` | Iniciar el barrido |
| `Stop` | Detener el escaneo |
| `Undo` | Deshacer la última capa |
| `Effects` | Abrir modal de efectos |
| `Ghost` | Mostrar la fuente fantasma en el resultado |
| `Blend` | Modo de fusión de la capa activa |
| `Format` | Aspect ratio de los paneles |
| `Speed` | Velocidad de escaneo |
| `REC` | Armar grabación de video (inicia con el scan) |
| `Save PNG` | Exportar resultado |
| `Save WebM` | Exportar grabación |

## Notas técnicas

- El undo mantiene un stack de hasta 20 snapshots de capas.
- La grabación usa `canvas.captureStream(30)` + `MediaRecorder` con codec VP9 si está disponible.
- Los efectos se aplican por píxel sobre `ImageData`; el dither usa el algoritmo de Floyd–Steinberg.
- Todo el procesamiento ocurre en el cliente; no se sube nada a ningún servidor.