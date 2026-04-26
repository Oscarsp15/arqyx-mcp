# 10 — Design System y Tema Visual

> **Tokens primero, consistencia siempre.** Todo color es una variable CSS.

---

## 1. Principio Fundamental

- **Todo color** usado en la UI vive primero como variable CSS en `globals.css`
- Cada variable tiene variante **clara y oscura** definidas en el mismo commit
- Las clases Tailwind resuelven a estos tokens
- **Prohibido** hardcodear colores (`bg-blue-500`, `#fff`, `rgb(...)`)

---

## 2. Design Tokens

### Dónde Viven

```
packages/ui/src/styles/globals.css
```

### Estructura

```css
/* Tema claro (por defecto) */
:root {
  /* Colores base */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;

  /* Superficies */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;

  /* Bordes */
  --border: 214 32% 91%;

  /* Interactivos */
  --primary: 222 47% 11%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;

  /* Estados */
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;

  /* Anillo de foco */
  --ring: 222 47% 11%;
}

/* Tema oscuro */
[data-theme='dark'] {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;

  --card: 222 47% 11%;
  --card-foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;

  --border: 217 33% 17%;

  --primary: 210 40% 98%;
  --primary-foreground: 222 47% 11%;
  --secondary: 217 33% 17%;
  --secondary-foreground: 210 40% 98%;

  --destructive: 0 62% 30%;
  --destructive-foreground: 210 40% 98%;

  --ring: 212 33% 89%;
}
```

---

## 3. Uso de Tokens en Componentes

### Clases Tailwind Correctas

```tsx
// BIEN: usa tokens del design system
<div className="bg-background text-foreground border-border">
  <p className="text-muted-foreground">Texto secundario</p>
  <button className="bg-primary text-primary-foreground">Acción</button>
</div>
```

### Prohibido

```tsx
// MAL: colores hardcodeados
<div className="bg-white text-black border-gray-200">
<div className="bg-blue-500 text-white">
<div style={{ backgroundColor: '#fff' }}>
```

### Excepción Permitida

Paletas semáforo cuando el significado es intrínseco:
- Verde éxito
- Amber advertencia
- Rojo error

Aun así, **deben probarse en ambos temas**.

---

## 4. Contrato Claro/Oscuro

### Regla Dura

> Ningún componente puede asumir el color de fondo.

Si defines un color de texto, también garantizas que contrasta con el fondo **en los dos temas**.

### Al Añadir una Variable

```css
/* SIEMPRE ambas variantes en el mismo commit */
:root {
  --nuevo-color: 210 50% 40%;
}

[data-theme='dark'] {
  --nuevo-color: 210 50% 70%;
}
```

### Contraste Mínimo

- **AA normal** (4.5:1) para texto normal
- **AA large** (3:1) para texto grande (≥ 18px o ≥ 14px bold)

Verifica con DevTools → Lighthouse o un checker online.

---

## 5. Iconografía

### Única Librería Permitida: Lucide

```tsx
import { Plus, Trash2, Settings } from 'lucide-react';

<Button>
  <Plus className="h-4 w-4" />
  Añadir
</Button>
```

### Tamaños Consistentes

| Contexto | Clase | Texto |
|----------|-------|-------|
| Texto pequeño | `h-3 w-3` | `text-xs` |
| Texto normal | `h-4 w-4` | `text-sm`, `text-base` |
| Texto grande | `h-5 w-5` | `text-lg`+ |

### Color

- Siempre `currentColor` (heredado del texto)
- **No** hardcodear color en el SVG

### Accesibilidad

```tsx
// Icono decorativo (junto a texto)
<Button>
  <Plus className="h-4 w-4" aria-hidden="true" />
  Añadir tabla
</Button>

// Icono interactivo (botón solo icono)
<button aria-label="Eliminar tabla">
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</button>

// Icono con significado único (sin texto)
<span aria-label="Clave primaria">
  <Key className="h-4 w-4" aria-hidden="true" />
</span>
```

---

## 6. Estados de Componentes Async

Todo componente que obtiene datos externos tiene **4 estados**:

### 1. Loading

```tsx
<div className="animate-pulse bg-muted h-8 rounded" />
// O spinner con texto
<div className="flex items-center gap-2">
  <Loader2 className="h-4 w-4 animate-spin" />
  <span>Cargando...</span>
</div>
```

**Prohibido**: renderizar `null` silenciosamente.

### 2. Empty

```tsx
<div className="text-center py-8">
  <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground" />
  <p className="mt-2 text-muted-foreground">No hay lienzos todavía</p>
  <p className="text-sm text-muted-foreground">
    Pídele a Claude que cree uno con <code>create_canvas</code>
  </p>
</div>
```

Siempre incluir **CTA claro en español**.

### 3. Error

```tsx
<div className="rounded border border-destructive bg-destructive/10 p-4">
  <p className="text-destructive">No se pudo cargar el canvas</p>
  <p className="text-sm text-muted-foreground">Código: CANVAS_NOT_FOUND</p>
  <Button variant="outline" onClick={retry} className="mt-2">
    Reintentar
  </Button>
</div>
```

Incluir: mensaje en español, código de error, botón de reintentar si aplica.

### 4. Success

El happy path con los datos renderizados.

---

## 7. Jerarquía Visual vs Legibilidad

### Señales Permitidas para "Secundario"

- Tamaño de fuente menor (`text-xs` vs `text-sm`)
- Sin borde cuando el primario tiene borde
- Transparencia de fondo (`bg-muted/90`, nunca < 0.7)
- Tipografía menos pesada (`font-normal` vs `font-medium`)
- Esquinas redondeadas diferentes

### Señales Prohibidas

- Bajar contraste de texto por debajo de 4.5:1
- Usar `text-muted-foreground` para texto que el usuario necesita leer rápido
- Opacidad < 0.7 que dificulte lectura

### Criterio

> Si necesitas acercarte a la pantalla para leer el texto secundario, la jerarquía está mal.

---

## 8. Librerías Externas

Toda librería que inyecte CSS propio (React Flow, Radix, etc.) debe mapearse a los tokens:

### React Flow

```css
/* globals.css */

/* React Flow - fondo del canvas */
.react-flow__background {
  background-color: hsl(var(--background));
}

/* React Flow - nodos */
.react-flow__node {
  background-color: hsl(var(--card));
  border-color: hsl(var(--border));
  color: hsl(var(--card-foreground));
}

/* React Flow - edges */
.react-flow__edge-path {
  stroke: hsl(var(--border));
}

/* React Flow - controles */
.react-flow__controls button {
  background-color: hsl(var(--card));
  border-color: hsl(var(--border));
  color: hsl(var(--card-foreground));
}
```

### Regla

- Mapear en `globals.css`, no disperso por componentes
- Ambas variantes (claro/oscuro) en el mismo commit
- Documentar con comentario qué librería/elemento cubre

---

## 9. Primitivas Nativas Prohibidas

### `window.alert()`, `window.confirm()`, `window.prompt()`

**Reemplazo**: componente `ConfirmDialog` con:
- Overlay semi-transparente
- Caja centrada con título, mensaje, botones
- Botón destructivo en rojo
- Soporte de ambos temas
- Escape para cancelar

### `<select>` Nativo Sin Estilar

Los `<option>` no respetan tema oscuro.

**Alternativas**:
1. `<select>` con clases explícitas Tailwind
2. Componente dropdown custom con `<button>` + `<ul>`

---

## 10. Revisión Visual Obligatoria

Todo PR que toque UI debe incluir en el body:

```markdown
- [ ] He abierto el componente en el navegador con tema claro Y oscuro
      y confirmé que el contraste es suficiente y no hay texto invisible
```

Si el PR no tiene impacto visual:

```markdown
- [x] No aplica, PR sin impacto visual
```

---

## 11. Consistencia de Interacciones Destructivas

Toda acción destructiva (eliminar tabla, columna, canvas) usa el **mismo componente de confirmación**:

```tsx
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string; // default "Eliminar"
  variant?: 'destructive' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}
```

Esto evita que cada agente implemente su propia versión con estilos distintos.

---

## 12. Accesibilidad (No Negociable)

| Elemento | Requisito |
|----------|-----------|
| Interactivo | `<button>`, `<a>`, o input real (no `<div onClick>`) |
| Botón icon-only | `aria-label` en español |
| Input | `<label>` asociado o `aria-label` |
| Contraste | AA mínimo en ambos temas |
| Foco | Visible (no remover `outline` sin reemplazo) |
| Navegación | Todo usable solo con teclado |
