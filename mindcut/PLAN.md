# PLAN — MindCut

Plan de implementación de la herramienta de duplicación de imágenes por slicing.

## Objetivo

Replicar el proceso "Top Breeder" de Kensuke Koike en el navegador, con una interfaz similar a autocutter y estética B&W minimalista.

## Pasos

### 1. Estructura del proyecto
- [x] Crear carpeta `mindcut/`
- [x] Crear `INFO.md` (documentación técnica)
- [x] Crear `PLAN.md` (este archivo)

### 2. Interfaz (`index.html`)
- [ ] Hero: título "mindcut", subtítulo, meta (técnica, filosofía)
- [ ] Toolbar: upload, cut, slices, mode, direction, effect, gap, save
- [ ] Workspace: panel source + panel result
- [ ] Footer con créditos

### 3. Estilos (`style.css`)
- [ ] Fondo blanco, texto negro, grises secundarios
- [ ] Tipografías Playfair Display + Inter
- [ ] Toolbar fija estilo autocutter
- [ ] Responsive (1024px, 600px)

### 4. Lógica (`app.js`)
- [ ] Upload + drag & drop
- [ ] Render de imagen fuente en canvas
- [ ] Algoritmo `drawStrips` (corte + separación + estirado)
- [ ] Modo Top Breeder (1 → 2 → 4 copias)
- [ ] Modo Manual (barajado + gap)
- [ ] Efectos: none, b&w, threshold, invert
- [ ] Save PNG

### 5. Verificación
- [ ] Probar con imagen local
- [ ] Probar ambos modos y efectos
- [ ] Verificar descarga PNG

## Dependencias

- Paso 4 depende de 2 y 3 (estructura y estilos listos).
- El algoritmo de slicing es independiente de la UI.

## Estimación

| Fase | Esfuerzo |
|---|---|
| Estructura + docs | Bajo |
| Interfaz + estilos | Medio |
| Lógica Canvas | Alto |
| Verificación | Bajo |

## Riesgos

- `ctx.filter` no soportado en navegadores muy antiguos → fallback con pixel manipulation.
- Imágenes muy grandes → el canvas 2x puede consumir memoria; se limita el tamaño máximo de render.
- El estirado de tiras produce distorsión horizontal/vertical (efecto buscado, no es bug).