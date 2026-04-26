# 07 — Herramientas MCP (Tools)

> **Una tool = una acción atómica.** Prohibidas las tools-dios.

---

## 1. Principio Fundamental

Cada tool MCP es **atómica**:
- Hace una cosa
- Con inputs mínimos
- Con responsabilidad clara
- En su propio archivo

---

## 2. Estructura de Archivos

```
packages/server/src/mcp/tools/
├── erd/
│   ├── add-table.ts
│   ├── delete-table.ts
│   ├── add-column.ts
│   ├── update-column.ts
│   └── add-relation.ts
├── aws/
│   ├── add-service.ts
│   ├── delete-service.ts
│   └── add-connection.ts
├── canvas/
│   ├── create-canvas.ts
│   ├── open-canvas.ts
│   └── list-canvases.ts
└── index.ts  ← solo reexporta
```

---

## 3. Anatomía de una Tool

Cada archivo exporta exactamente 4 cosas:

```typescript
// packages/server/src/mcp/tools/erd/add-table.ts
import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { store } from '../../state/store.js';

// 1. Nombre único
export const name = 'erd_add_table';

// 2. Descripción que explica CUÁNDO usarla (el LLM la lee)
export const description = `
Añade una nueva tabla al diagrama ERD del canvas activo.
Usa esta tool cuando el usuario quiera crear una entidad de base de datos.
Requiere un canvas ERD abierto previamente con open_canvas.
`;

// 3. Schema de input (Zod)
export const inputSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre de la tabla no puede estar vacío')
    .max(255, 'El nombre es demasiado largo')
    .regex(/^[a-z][a-z0-9_]*$/, 'Formato inválido: usa snake_case'),
  columns: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['varchar', 'int', 'boolean', 'timestamp', 'uuid']),
    isPrimaryKey: z.boolean().default(false),
    isNullable: z.boolean().default(true),
  })).optional().default([]),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

// 4. Handler
export const handler = async (
  input: z.infer<typeof inputSchema>
): Promise<{ tableId: string; message: string }> => {
  // Validación ya ocurrió via inputSchema

  const activeCanvas = store.getActiveCanvas();
  if (!activeCanvas) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      'No hay un canvas activo. Usa open_canvas primero.'
    );
  }

  if (activeCanvas.type !== 'erd') {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `El canvas activo es de tipo "${activeCanvas.type}", no "erd".`
    );
  }

  const table = store.addTable({
    name: input.name,
    columns: input.columns,
    position: input.position ?? { x: 100, y: 100 },
  });

  return {
    tableId: table.id,
    message: `Tabla "${input.name}" creada con ${input.columns.length} columnas.`,
  };
};
```

---

## 4. Naming de Tools

### Formato

```
<dominio>_<accion>_<objetivo>
```

### Ejemplos

| Tool | Descripción |
|------|-------------|
| `erd_add_table` | Añadir tabla al ERD |
| `erd_delete_table` | Eliminar tabla del ERD |
| `erd_add_column` | Añadir columna a tabla |
| `aws_add_service` | Añadir servicio AWS |
| `canvas_create` | Crear nuevo canvas |
| `canvas_open` | Abrir canvas existente |

### Verbos Comunes

| Verbo | Cuándo usar |
|-------|-------------|
| `add` | Crear algo nuevo |
| `delete` | Eliminar algo existente |
| `update` | Modificar propiedades |
| `list` | Obtener lista |
| `get` | Obtener uno específico |
| `move` | Cambiar posición |

---

## 5. Prohibiciones

### Tools-dios

```typescript
// MAL: tool que hace de todo
export const name = 'execute';
export const inputSchema = z.object({
  action: z.enum(['add', 'delete', 'update', 'list']),
  type: z.enum(['table', 'column', 'service']),
  data: z.any(),
});

// MAL: tool genérica
export const name = 'manage_entity';
export const inputSchema = z.object({
  entityType: z.string(),
  operation: z.string(),
  params: z.record(z.unknown()),
});
```

### Inputs Innecesarios

```typescript
// MAL: pide info que el sistema ya tiene
export const inputSchema = z.object({
  canvasId: z.string(), // Ya está en el store como activeCanvas
  tableName: z.string(),
});

// BIEN: solo lo necesario
export const inputSchema = z.object({
  tableName: z.string(),
});
```

---

## 6. Descripción para el LLM

La `description` es **crítica** — el LLM la lee para decidir cuándo usar la tool.

### Debe Incluir

1. **Qué hace** en una línea
2. **Cuándo usarla** (contexto del usuario)
3. **Precondiciones** (qué debe existir antes)
4. **Relación con otras tools** (si aplica)

### Ejemplo Bueno

```typescript
export const description = `
Añade una columna a una tabla existente en el diagrama ERD.
Usa esta tool cuando el usuario quiera agregar un campo a una entidad.
Requiere que la tabla ya exista (creada con erd_add_table).
Para columnas de clave primaria, usa isPrimaryKey: true.
`;
```

### Ejemplo Malo

```typescript
export const description = 'Adds a column'; // Muy corto, no dice cuándo usarla
```

---

## 7. Manejo de Errores

### McpError con Código Apropiado

```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Errores de validación
throw new McpError(
  ErrorCode.InvalidParams,
  'El nombre de la tabla no puede contener espacios.'
);

// Recurso no encontrado
throw new McpError(
  ErrorCode.InvalidRequest,
  `No se encontró la tabla con id "${tableId}".`
);

// Estado inválido
throw new McpError(
  ErrorCode.InvalidRequest,
  'No hay un canvas activo. Usa open_canvas primero.'
);

// Error interno
throw new McpError(
  ErrorCode.InternalError,
  'Error inesperado al guardar la tabla.'
);
```

### Errores de Zod

```typescript
import { ZodError } from 'zod';

try {
  const validated = inputSchema.parse(rawInput);
} catch (error) {
  if (error instanceof ZodError) {
    const messages = error.errors.map(e =>
      `${e.path.join('.')}: ${e.message}`
    ).join('; ');
    throw new McpError(ErrorCode.InvalidParams, messages);
  }
  throw error;
}
```

---

## 8. Testing de Tools

Cada tool tiene test unitario en `*.test.ts` junto al archivo:

```typescript
// packages/server/src/mcp/tools/erd/add-table.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { handler, inputSchema } from './add-table.js';
import { store } from '../../state/store.js';

describe('erd_add_table', () => {
  beforeEach(() => {
    store.reset();
    store.createCanvas({ type: 'erd', name: 'Test ERD' });
    store.setActiveCanvas('test-canvas-id');
  });

  it('crea tabla con nombre válido', async () => {
    const result = await handler({ name: 'users', columns: [] });

    expect(result.tableId).toBeDefined();
    expect(result.message).toContain('users');
  });

  it('rechaza nombre vacío', () => {
    expect(() => inputSchema.parse({ name: '' })).toThrow();
  });

  it('falla sin canvas activo', async () => {
    store.setActiveCanvas(null);

    await expect(handler({ name: 'users' }))
      .rejects.toThrow('No hay un canvas activo');
  });

  it('falla si el canvas no es ERD', async () => {
    store.createCanvas({ type: 'aws', name: 'AWS Canvas' });
    store.setActiveCanvas('aws-canvas-id');

    await expect(handler({ name: 'users' }))
      .rejects.toThrow('no "erd"');
  });
});
```

---

## 9. Registro de Tools

En `packages/server/src/mcp/server.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import * as addTable from './tools/erd/add-table.js';
import * as deleteTable from './tools/erd/delete-table.js';
// ... más imports

const tools = [
  addTable,
  deleteTable,
  // ... más tools
];

// Registro automático
for (const tool of tools) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: zodToJsonSchema(t.inputSchema),
    })),
  }));
}
```

---

## 10. Checklist Nueva Tool

- [ ] Archivo en `tools/<dominio>/<accion>.ts`
- [ ] Exporta `name`, `description`, `inputSchema`, `handler`
- [ ] `description` explica cuándo usarla
- [ ] `inputSchema` con Zod y mensajes de error en español
- [ ] `handler` valida estado previo (canvas activo, etc.)
- [ ] Errores con `McpError` y código apropiado
- [ ] Test unitario en `*.test.ts`
- [ ] Registrada en `server.ts`
