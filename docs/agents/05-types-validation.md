# 05 — Tipos y Validación

> **TypeScript strict + Zod.** Sin excepciones.

---

## 1. Configuración TypeScript Obligatoria

Todos los packages deben tener:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

## 2. Prohibiciones de Tipos

| Prohibido | Alternativa |
|-----------|-------------|
| `any` | Usa el tipo correcto o `unknown` + narrowing |
| `as unknown as T` | Refactoriza para que el tipo fluya naturalmente |
| `@ts-ignore` | Usa `// @ts-expect-error RAZÓN` con explicación |
| `!` (non-null assertion) | Usa narrowing o maneja el caso `null`/`undefined` |

### Cuándo `@ts-expect-error` es Aceptable

Solo cuando:
1. Es un workaround documentado para un bug de librería
2. La razón está explícita en la misma línea
3. No hay alternativa tipada

```typescript
// BIEN: razón explícita
// @ts-expect-error: React Flow tipos incorrectos para custom node data
const data = node.data as TableNodeData;

// MAL: sin razón
// @ts-expect-error
const data = node.data;
```

---

## 3. Schemas Zod como Fuente de Verdad

### Dónde Viven

Todos los schemas de dominio en:
```
packages/shared/src/schemas/
├── table.ts        # TableSchema, ColumnSchema
├── aws-service.ts  # AwsServiceSchema
├── canvas.ts       # CanvasSchema
└── messages.ts     # Schemas de mensajes WS
```

### Cómo Definir un Schema

```typescript
// packages/shared/src/schemas/table.ts
import { z } from 'zod';

export const ColumnSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  type: z.enum(['varchar', 'int', 'boolean', 'timestamp', 'uuid']),
  isPrimaryKey: z.boolean().default(false),
  isNullable: z.boolean().default(true),
});

export const TableSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  columns: z.array(ColumnSchema),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

// Tipo derivado - NUNCA se duplica manualmente
export type Column = z.infer<typeof ColumnSchema>;
export type Table = z.infer<typeof TableSchema>;
```

---

## 4. Derivar Tipos, Nunca Duplicar

```typescript
// MAL: tipo duplicado manualmente
interface Table {
  id: string;
  name: string;
  columns: Column[];
  // ... puede divergir del schema
}

// BIEN: tipo derivado del schema
export type Table = z.infer<typeof TableSchema>;
```

---

## 5. Validación en el Borde

> "Parse, don't validate" — Zod en la entrada, tipos garantizados después.

### Bordes del Sistema

| Borde | Qué validar |
|-------|-------------|
| MCP Tool handler | Input del tool call |
| WebSocket message | Mensaje entrante del cliente |
| HTTP endpoint | Body, query params, headers |
| Formulario UI | Input del usuario antes de enviar |

### Patrón de Validación

```typescript
// En el handler de una tool MCP
export const handler = async (input: unknown): Promise<Result> => {
  // 1. Parsear (valida y transforma)
  const validated = AddTableInputSchema.parse(input);

  // 2. A partir de aquí, `validated` tiene tipo garantizado
  // No más validaciones "por las dudas"
  const table = store.addTable(validated);

  return { success: true, table };
};
```

---

## 6. Errores de Validación

### En MCP Tools

```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';

try {
  const validated = InputSchema.parse(input);
} catch (error) {
  if (error instanceof ZodError) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Validación fallida: ${error.errors.map(e => e.message).join(', ')}`
    );
  }
  throw error;
}
```

### En UI (con mensajes en español)

```typescript
const result = InputSchema.safeParse(formData);
if (!result.success) {
  const errors = result.error.errors.map(e => ({
    field: e.path.join('.'),
    message: translateZodError(e), // Traduce a español
  }));
  setFormErrors(errors);
  return;
}
```

---

## 7. Tipos Discriminados

> Usa union types para hacer estados ilegales irrepresentables.

```typescript
// Schema con discriminador
export const EdgeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('erd'),
    id: z.string().uuid(),
    fromTable: z.string().uuid(),
    toTable: z.string().uuid(),
    relationType: z.enum(['one-to-one', 'one-to-many', 'many-to-many']),
  }),
  z.object({
    kind: z.literal('aws'),
    id: z.string().uuid(),
    fromService: z.string().uuid(),
    toService: z.string().uuid(),
    protocol: z.enum(['https', 'sqs', 'sns', 'kinesis']),
  }),
]);

export type Edge = z.infer<typeof EdgeSchema>;

// El tipo garantiza que no puedes mezclar fromTable con protocol
```

---

## 8. Schemas para Mensajes WebSocket

```typescript
// packages/shared/src/schemas/messages.ts

// Mensajes del server al cliente
export const ServerMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('canvas:updated'),
    payload: CanvasSchema,
  }),
  z.object({
    type: z.literal('table:added'),
    payload: TableSchema,
  }),
  z.object({
    type: z.literal('error'),
    payload: z.object({
      code: z.string(),
      message: z.string(),
    }),
  }),
]);

// Mensajes del cliente al server
export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('table:move'),
    payload: z.object({
      tableId: z.string().uuid(),
      position: z.object({ x: z.number(), y: z.number() }),
    }),
  }),
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;
export type ClientMessage = z.infer<typeof ClientMessageSchema>;
```

---

## 9. Refinements y Transforms

### Validaciones Complejas

```typescript
const TableNameSchema = z
  .string()
  .min(1, 'El nombre no puede estar vacío')
  .max(255, 'El nombre es demasiado largo')
  .regex(/^[a-z][a-z0-9_]*$/, 'Debe empezar con letra y solo contener a-z, 0-9, _')
  .transform(name => name.toLowerCase()); // Normaliza
```

### Validaciones entre Campos

```typescript
const DateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
}).refine(
  data => data.end > data.start,
  { message: 'La fecha fin debe ser posterior a la fecha inicio' }
);
```

---

## 10. Tests de Schemas

Cada schema tiene tests de casos válidos e inválidos:

```typescript
// packages/shared/src/schemas/table.test.ts
import { describe, it, expect } from 'vitest';
import { TableSchema } from './table.js';

describe('TableSchema', () => {
  it('acepta una tabla válida', () => {
    const valid = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'users',
      columns: [],
      position: { x: 0, y: 0 },
    };
    expect(() => TableSchema.parse(valid)).not.toThrow();
  });

  it('rechaza nombre vacío', () => {
    const invalid = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: '',
      columns: [],
      position: { x: 0, y: 0 },
    };
    expect(() => TableSchema.parse(invalid)).toThrow();
  });

  it('rechaza id no-uuid', () => {
    const invalid = {
      id: 'not-a-uuid',
      name: 'users',
      columns: [],
      position: { x: 0, y: 0 },
    };
    expect(() => TableSchema.parse(invalid)).toThrow();
  });
});
```
