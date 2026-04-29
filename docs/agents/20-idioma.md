# 20 — Idioma (Inglés vs Español)

> **Identificadores en inglés, texto al usuario en español.** La separación es estricta.

---

## 1. Resumen Rápido

| Elemento | Idioma | Ejemplo |
|----------|--------|---------|
| Código (variables, funciones, clases) | Inglés ASCII | `addTable`, `AwsService` |
| Nombres de archivos | Inglés ASCII | `add-table.ts`, `column-row.tsx` |
| Branches | Inglés ASCII | `feat/42-add-column` |
| Texto de UI | Español con tildes | "Añadir tabla", "¿Eliminar?" |
| Mensajes de error al usuario | Español | "No se encontró la tabla" |
| Descripción de tools MCP | Español | El LLM y el usuario las leen |
| Commits | Español | `feat(erd): añadir validación` |
| Documentación | Español | ADRs, README |
| Logs internos | Inglés corto | `logger.info('canvas created')` |

---

## 2. Identificadores (Inglés ASCII)

### Qué Incluye

- Nombres de packages
- Nombres de archivos y carpetas
- Clases, tipos, interfaces
- Funciones y métodos
- Variables y constantes
- Branches y tags

### Reglas

- **Solo caracteres ASCII** (a-z, A-Z, 0-9, _, -)
- **Prohibido**: `ñ`, tildes, caracteres especiales

### Por Qué

- npm no maneja bien caracteres no-ASCII
- PATH en Windows puede romper con tildes
- Imports y búsquedas funcionan mejor con ASCII

### Ejemplos

| ✅ Correcto | ❌ Prohibido |
|-------------|-------------|
| `addTable` | `añadirTabla` |
| `AwsService` | `ServicioAws` |
| `design-canvas` | `diseño-canvas` |
| `user-id` | `usuario-id` |
| `feat/42-add-column` | `feat/42-añadir-columna` |

---

## 3. Texto Visible al Usuario (Español)

### Qué Incluye

- Textos de la UI (botones, labels, tooltips)
- Mensajes de error mostrados al usuario
- `description` de tools MCP
- Placeholders de formularios

### Reglas

- **Español correcto** con ñ, tildes, ¿¡
- Ortografía cuidada

### Ejemplos

```tsx
// UI
<Button>Añadir tabla</Button>
<Label>Nombre de la columna</Label>
<span>¿Eliminar este nodo?</span>
```

```typescript
// Tool MCP description
export const description = `
Añade una nueva tabla al diagrama ERD del canvas activo.
Usa esta tool cuando el usuario quiera crear una entidad.
`;
```

```typescript
// Mensaje de error
throw new McpError(
  ErrorCode.InvalidRequest,
  'No se encontró la tabla solicitada.'
);
```

---

## 4. Logs Internos (Inglés Corto)

### Qué Incluye

- Logs del server (pino)
- Mensajes de debug
- Stack traces internos

### Por Qué Inglés

- Grep-friendly
- Neutral para cualquier desarrollador
- Consistente con stack traces de librerías

### Ejemplos

```typescript
// Bien
logger.info({ canvasId }, 'canvas created');
logger.error({ tableId, error }, 'failed to save table');
logger.debug('ws connection established');

// Mal (español en logs)
logger.info({ canvasId }, 'canvas creado');
```

---

## 5. Commits y Documentación (Español)

### Commits

```
feat(erd): añadir validación de relaciones
fix(ui): corregir contraste en tema oscuro
```

### ADRs

`docs/adr/001-arquitectura-monorepo.md` — contenido en español

### README

Español para la audiencia principal del proyecto.

---

## 6. Errores Tipados

Los errores tienen **código en inglés** (programación) y **mensaje en español** (usuario):

```typescript
// El código es estable y grepeable
// El mensaje puede ajustarse sin romper nada
throw new McpError(
  'TABLE_NOT_FOUND',           // Código: inglés
  'No se encontró la tabla solicitada.'  // Mensaje: español
);
```

### Uso

```typescript
// En el handler
try {
  // ...
} catch (error) {
  if (error.code === 'TABLE_NOT_FOUND') {
    // Programación usa el código
  }
  // UI muestra el mensaje
  showError(error.message);
}
```

---

## 7. Zod Error Messages

Los mensajes de error de Zod deben ser en español:

```typescript
const ColumnSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre no puede estar vacío')
    .max(255, 'El nombre es demasiado largo'),
  type: z.enum(['varchar', 'int', 'boolean'], {
    errorMap: () => ({ message: 'Tipo de columna inválido' }),
  }),
});
```

---

## 8. Checklist de Idioma

Antes de commit, verifica:

| Elemento | Idioma Correcto |
|----------|----------------|
| Nombres de variables | ✅ Inglés |
| Nombres de archivos | ✅ Inglés |
| Nombre de rama | ✅ Inglés |
| Texto de UI | ✅ Español |
| Mensajes de error | ✅ Español |
| Descripción de tools | ✅ Español |
| Logs internos | ✅ Inglés |
| Mensaje de commit | ✅ Español |
| Comentarios en código | ✅ Inglés (si hay) |

---

## 9. Casos Especiales

### Términos Técnicos sin Traducción

Algunos términos se usan en inglés porque no tienen traducción estándar:

- "tool" (no "herramienta" en contexto MCP)
- "canvas" (no "lienzo" en contexto de React Flow)
- "store" (no "almacén")
- "schema" (no "esquema")
- "handler" (no "manejador")

### Mezcla Aceptable en UI

```tsx
// OK: términos técnicos reconocibles
<Tooltip>Abre el canvas de Flow</Tooltip>
<Label>Schema Zod</Label>
```

---

## 10. Resumen Visual

```
┌─────────────────────────────────────────────────────────┐
│                    IDIOMA                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  INGLÉS ASCII          │  ESPAÑOL con tildes            │
│  ──────────────        │  ──────────────────            │
│  • Código              │  • Texto UI                    │
│  • Archivos            │  • Errores al usuario          │
│  • Branches            │  • Descripción tools           │
│  • Logs internos       │  • Commits                     │
│                        │  • Documentación               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```
