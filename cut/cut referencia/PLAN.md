# PLAN — Cut

Plan de implementación de la herramienta de fragmentación y recomposición de imágenes.

## Objetivo

Deconstruir una imagen en celdas irregulares y recomponerlas en una composición nueva, reproducible por semilla, con estética B&W minimalista.

## Pasos

### 1. Estructura del proyecto
- [x] Crear carpeta `cut/`
- [x] Crear `INFO.md` (documentación técnica)
- [x] Crear `PLAN.md` (este archivo)

### 2. Interfaz (`index.html`)
- [x] Header con nav MEDUSA + controles (file, cut, paper, view)
- [x] Tab bar source/result con tools por tab
- [x] Paneles de canvas + modales (preview, sheet)
- [x] Toast para feedback

### 3. Estilos (`style.css`)
- [x] Fondo blanco, texto negro, tipografías Playfair Display + Inter
- [x] Controles inline con subrayado (estilo autocutter)
- [x] Responsive con canvas que se adapta al viewport

### 4. Lógica (`app.js`)
- [x] Upload + drag & drop
- [x] Generación de grilla por subdivisión de área
- [x] Placement en espiral con RNG sembrado
- [x] Semilla reproducible (6 caracteres)
- [x] Modo aware (corte por bordes fuertes)
- [x] Rotación aleatoria por pieza
- [x] Aspect ratio (none / a4 / 4:5)
- [x] Paper: bg, padding, title band
- [x] Efectos: none, b&w, threshold, posterize, dither
- [x] Grid overlay + stroke toggle
- [x] Crop marks + bleed
- [x] Sheet view (todas las celdas en hoja A4)
- [x] Preview modal + save PNG

### 5. Verificación
- [x] Probar con imagen local
- [x] Probar semillas reproducibles
- [x] Verificar descarga PNG

## Dependencias

- Paso 4 depende de 2 y 3 (estructura y estilos listos).
- El algoritmo de grid/placement es independiente de la UI.

## Estimación

| Fase | Esfuerzo |
|---|---|
| Estructura + docs | Bajo |
| Interfaz + estilos | Medio |
| Lógica Canvas | Alto |
| Verificación | Bajo |

## Riesgos

- Imágenes muy grandes → el canvas de resultado puede consumir memoria; se escala la fuente a 1000px.
- El placement en espiral puede producir composiciones muy alargadas → se compensa con aspect ratio o padding.
- `getImageData` en modo aware es costoso → se muestrea una sola línea por celda.