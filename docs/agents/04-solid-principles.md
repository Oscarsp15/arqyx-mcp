# 04 — Principios SOLID Aplicados

> **Estos principios son nivel senior, no negociables.** Aplícalos en cada decisión de diseño.

---

## 1. S — Single Responsibility (SRP)

> Un módulo/función cambia por **una sola razón**.

### Aplicación Concreta

| Nivel | Regla |
|-------|-------|
| Archivo | Un archivo = una responsabilidad clara expresada en su nombre |
| Package | Un package = una razón para cambiar |
| Función | Una función = un verbo. Si necesitas "and" en el nombre, divídela |

### Señales de Violación

- El nombre necesita "y" o "and": `validateAndSave()` → divide en `validate()` y `save()`
- Al describir qué hace usas varias frases
- El archivo crece más allá de 300 líneas

### Prohibido

```typescript
// MAL: index.ts con lógica
// packages/server/src/mcp/tools/erd/index.ts
export function addTable() { /* lógica */ }
export function deleteTable() { /* lógica */ }

// BIEN: index.ts solo reexporta
export { addTable } from './add-table.js';
export { deleteTable } from './delete-table.js';
```

---

## 2. O — Open/Closed (OCP)

> Extiende por composición, no modificando código que ya funciona.

### Aplicación Concreta

Para añadir soporte a un nuevo proveedor cloud (ej. GCP):
- **NO** modificas el código de AWS
- **SÍ** creas un nuevo módulo `gcp/` con la misma interfaz

### Patrón Correcto

```typescript
// Interfaz común en shared
interface CloudService {
  readonly id: string;
  readonly type: 'aws' | 'gcp' | 'azure';
  // ...
}

// Cada proveedor implementa sin tocar a los demás
// server/src/mcp/tools/aws/add-service.ts
// server/src/mcp/tools/gcp/add-service.ts  ← nuevo, no toca aws
```

---

## 3. L — Liskov Substitution (LSP)

> Toda implementación de una interfaz debe ser intercambiable sin sorpresas.

### Aplicación Concreta

- Si defines una interfaz, toda implementación la cumple **completamente**
- Nada de subclases que lanzan `NotImplementedError`
- Nada de implementaciones que ignoran parámetros

### Prohibido

```typescript
// MAL: implementación que no cumple el contrato
interface Repository {
  save(item: Item): Promise<void>;
  delete(id: string): Promise<void>;
}

class ReadOnlyRepository implements Repository {
  save() { throw new Error('Not implemented'); } // VIOLA LSP
  delete() { throw new Error('Not implemented'); }
}

// BIEN: interfaces segregadas
interface Readable { find(id: string): Promise<Item>; }
interface Writable { save(item: Item): Promise<void>; }
```

---

## 4. I — Interface Segregation (ISP)

> Interfaces pequeñas y específicas. Mejor 3 interfaces de 2 métodos que 1 de 6.

### Aplicación Concreta

```typescript
// MAL: interfaz gorda
interface CanvasOperations {
  addNode(): void;
  deleteNode(): void;
  addEdge(): void;
  deleteEdge(): void;
  zoom(): void;
  pan(): void;
}

// BIEN: interfaces segregadas
interface NodeOperations {
  addNode(): void;
  deleteNode(): void;
}

interface EdgeOperations {
  addEdge(): void;
  deleteEdge(): void;
}

interface ViewportOperations {
  zoom(): void;
  pan(): void;
}
```

---

## 5. D — Dependency Inversion (DIP)

> Los módulos de alto nivel no dependen de detalles. Los detalles dependen de abstracciones.

### Aplicación Concreta

El store **no importa** WebSocket; recibe un `EventEmitter` por constructor.

```typescript
// MAL: store acoplado a WebSocket
import { WebSocket } from 'ws';
class Store {
  private ws: WebSocket;
  emit(event: string) { this.ws.send(event); }
}

// BIEN: store recibe abstracción
interface EventEmitter {
  emit(event: string, data: unknown): void;
}

class Store {
  constructor(private emitter: EventEmitter) {}
  emit(event: string, data: unknown) { this.emitter.emit(event, data); }
}
```

---

## 6. Composición sobre Herencia

> **Prohibido** usar herencia de clases para reutilizar código.

### Alternativas Permitidas

1. **Composición de funciones**
2. **Tipos discriminados** (union types)
3. **Inyección de dependencias**

### Excepción Única

Herencia permitida **solo** para extender clases de librerías externas que lo exigen (ej. algunos componentes de React Flow).

```typescript
// MAL: herencia para reutilizar
class BaseHandler {
  protected validate() { /* ... */ }
}
class AddTableHandler extends BaseHandler { }

// BIEN: composición
const validate = (input: unknown) => { /* ... */ };
const addTableHandler = (input: unknown) => {
  const validated = validate(input);
  // ...
};
```

---

## 7. Pure Functions por Defecto

> La lógica de dominio son **funciones puras**: mismos inputs → mismos outputs, sin efectos.

### Reglas

- Los efectos (IO, red, disco, reloj) viven en el borde y se inyectan
- Prohibido `Date.now()` o `Math.random()` dentro de lógica de dominio
- Se reciben por parámetro o se inyecta un `clock`/`idGenerator`

```typescript
// MAL: efecto dentro de la lógica
function createTable(name: string): Table {
  return { id: crypto.randomUUID(), name, createdAt: Date.now() };
}

// BIEN: inyección de efectos
function createTable(
  name: string,
  generateId: () => string,
  now: () => number
): Table {
  return { id: generateId(), name, createdAt: now() };
}
```

---

## 8. Inmutabilidad

> Los datos de dominio son inmutables.

### Reglas

- Usa `readonly` en TypeScript
- Devuelve copias nuevas en las mutaciones del store
- **Prohibido** mutar parámetros de función

```typescript
// MAL: mutación directa
function addColumn(table: Table, column: Column) {
  table.columns.push(column); // MUTA EL PARÁMETRO
  return table;
}

// BIEN: copia inmutable
function addColumn(table: Table, column: Column): Table {
  return {
    ...table,
    columns: [...table.columns, column],
  };
}
```

---

## 9. Parse, Don't Validate

> En el borde, **parseas** input crudo a un tipo de dominio con Zod.

### Flujo Correcto

```
Input crudo → Zod.parse() → Tipo de dominio → Lógica pura
     ▲                            │
     │                            ▼
  Validación              Tipo es prueba de validez
  solo aquí               No más validaciones internas
```

**Prohibido**: validar "por las dudas" en capas internas si el tipo ya garantiza el invariante.

---

## 10. Make Illegal States Unrepresentable

> Si dos campos no pueden coexistir, el tipo lo prohíbe.

### Ejemplo

```typescript
// MAL: validación en runtime
interface Edge {
  kind: 'erd' | 'aws';
  from: string;
  to: string;
  // ¿from/to son TableId o ServiceId? Depende de kind...
}

// BIEN: el tipo hace imposible el estado inválido
type Edge =
  | { kind: 'erd'; from: TableId; to: TableId }
  | { kind: 'aws'; from: ServiceId; to: ServiceId };
```

---

## 11. Boundaries Explícitos

> Cada capa declara su contrato con tipos.

### Reglas

- Si una función cruza un límite (MCP→store, store→WS, WS→UI), el contrato está en `shared`
- Nada de "objetos que se van llenando" a medida que pasan capas
- Cada mensaje tiene su schema Zod definido

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  MCP Tool   │────▶│   Store     │────▶│   WS Hub    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
                    Contratos en
                  packages/shared
```
