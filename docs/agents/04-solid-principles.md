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

---

## 12. Patrones de Error Handling (Nivel Senior)

### Fail Fast, Fail Loud

```typescript
// MAL: silenciar errores
try {
  await saveTable(table);
} catch (e) {
  console.log(e); // Se pierde el error
}

// MAL: catch genérico
try {
  await saveTable(table);
} catch (e) {
  return null; // ¿Qué pasó? Nadie sabe
}

// BIEN: propagar o manejar explícitamente
try {
  await saveTable(table);
} catch (error) {
  if (error instanceof ValidationError) {
    throw new McpError(ErrorCode.InvalidParams, error.message);
  }
  throw error; // Re-lanzar lo que no conocemos
}
```

### Errores Tipados con Discriminador

```typescript
// Definir errores de dominio
type DomainError =
  | { type: 'NOT_FOUND'; resource: string; id: string }
  | { type: 'VALIDATION'; field: string; message: string }
  | { type: 'CONFLICT'; reason: string };

// Result type para operaciones que pueden fallar
type Result<T, E = DomainError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Uso
function findTable(id: string): Result<Table> {
  const table = store.get(id);
  if (!table) {
    return { ok: false, error: { type: 'NOT_FOUND', resource: 'Table', id } };
  }
  return { ok: true, value: table };
}

// El caller DEBE manejar ambos casos
const result = findTable(id);
if (!result.ok) {
  // TypeScript sabe que es un error aquí
  throw new McpError(ErrorCode.InvalidRequest, `${result.error.resource} not found`);
}
// TypeScript sabe que result.value es Table aquí
```

### Never Swallow Async Errors

```typescript
// MAL: promesa floating
saveInBackground(data); // Si falla, nadie lo sabe

// BIEN: manejar explícitamente
saveInBackground(data).catch(error => {
  logger.error({ error }, 'background save failed');
  // Decidir: ¿reintentar? ¿notificar? ¿ignorar?
});

// O usar void para indicar intención
void saveInBackground(data).catch(handleBackgroundError);
```

---

## 13. Testing Patterns (Nivel Senior)

### Arrange-Act-Assert

```typescript
it('añade columna a tabla existente', () => {
  // Arrange: preparar el estado inicial
  const table = createTestTable({ name: 'users' });
  store.addTable(table);

  // Act: ejecutar la acción
  const result = store.addColumn(table.id, { name: 'email', type: 'varchar' });

  // Assert: verificar el resultado
  expect(result.columns).toHaveLength(1);
  expect(result.columns[0].name).toBe('email');
});
```

### Test Behavior, Not Implementation

```typescript
// MAL: testeando implementación
it('llama a useState', () => {
  const spy = vi.spyOn(React, 'useState');
  render(<Component />);
  expect(spy).toHaveBeenCalled();
});

// BIEN: testeando comportamiento
it('muestra el contador incrementado al hacer click', async () => {
  render(<Counter />);
  await userEvent.click(screen.getByRole('button', { name: 'Incrementar' }));
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

### Test Edge Cases First

```typescript
describe('divideNumbers', () => {
  // Edge cases primero
  it('lanza error al dividir por cero', () => {
    expect(() => divideNumbers(10, 0)).toThrow('División por cero');
  });

  it('retorna 0 cuando el dividendo es 0', () => {
    expect(divideNumbers(0, 5)).toBe(0);
  });

  it('maneja números negativos', () => {
    expect(divideNumbers(-10, 2)).toBe(-5);
  });

  // Happy path al final
  it('divide correctamente números positivos', () => {
    expect(divideNumbers(10, 2)).toBe(5);
  });
});
```

### Factories sobre Fixtures

```typescript
// MAL: fixtures estáticos
const testTable = { id: '1', name: 'users', columns: [] };

// BIEN: factory functions
function createTestTable(overrides: Partial<Table> = {}): Table {
  return {
    id: crypto.randomUUID(),
    name: 'test_table',
    columns: [],
    position: { x: 0, y: 0 },
    ...overrides,
  };
}

// Uso flexible
const simpleTable = createTestTable();
const tableWithColumns = createTestTable({
  columns: [createTestColumn({ name: 'id', isPrimaryKey: true })],
});
```

---

## 14. Performance Patterns (Nivel Senior)

### Memoización Correcta

```typescript
// MAL: memoizar todo "por si acaso"
const value = useMemo(() => simpleCalculation(x), [x]); // Overhead innecesario

// BIEN: memoizar solo cuando hay evidencia
// 1. Profiling muestra que es lento
// 2. La operación es O(n²) o peor
// 3. El resultado se pasa a componentes memo'd
const expensiveValue = useMemo(() => {
  // Comentario explicando por qué se memoiza
  return heavyCalculation(largeArray); // O(n log n)
}, [largeArray]);
```

### Evitar Re-renders Innecesarios

```typescript
// MAL: objeto nuevo en cada render
<Component config={{ theme: 'dark' }} />

// BIEN: extraer constante
const CONFIG = { theme: 'dark' } as const;
<Component config={CONFIG} />

// O memoizar si depende de props
const config = useMemo(() => ({ theme }), [theme]);
```

### Lazy Loading

```typescript
// Componentes pesados: lazy load
const HeavyChart = lazy(() => import('./heavy-chart'));

// Uso con Suspense
<Suspense fallback={<ChartSkeleton />}>
  <HeavyChart data={data} />
</Suspense>
```

---

## 15. Decisiones de Diseño Comunes

### Cuándo Crear una Abstracción

| Señal | Acción |
|-------|--------|
| Código duplicado 2 veces | Tolerar, observar |
| Código duplicado 3+ veces | Extraer abstracción |
| Código similar pero no igual | NO extraer, es peor |
| Lógica compleja en un lugar | Extraer para testear |

### Cuándo NO Crear una Abstracción

- "Por si después lo necesito" → YAGNI
- "Para que sea más flexible" → Sin caso de uso concreto, no
- "Es más elegante" → Elegancia sin utilidad es vanidad

### Trade-offs Conscientes

```typescript
// Simplicidad vs Flexibilidad
// SIMPLE: Hardcodear tipos conocidos
type ColumnType = 'varchar' | 'int' | 'boolean' | 'timestamp';

// FLEXIBLE: Permitir extensión
type ColumnType = string; // Con validación en runtime

// Decisión: SIMPLE porque el MVP tiene tipos fijos.
// Si necesitamos más tipos, refactorizamos.

// Rendimiento vs Legibilidad
// LEGIBLE: Múltiples transformaciones
const result = data
  .filter(x => x.active)
  .map(x => x.name)
  .sort();

// PERFORMANTE: Un solo loop
const result = [];
for (const x of data) {
  if (x.active) result.push(x.name);
}
result.sort();

// Decisión: LEGIBLE a menos que profile demuestre problema.
```
