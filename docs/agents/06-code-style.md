# 06 — Estilo de Código

> **Código claro, sin trucos.** Estas reglas son concretas y verificables.

---

## 1. Límites de Tamaño

| Elemento | Límite |
|----------|--------|
| Función | < 40 líneas |
| Archivo | < 300 líneas |
| Parámetros de función | Máximo 4 |
| Niveles de anidación | Máximo 2 |

Si algo crece más allá del límite, **divide**.

---

## 2. Funciones

### Firma

```typescript
// BIEN: máximo 4 parámetros
function createTable(name: string, columns: Column[], position: Position): Table

// MAL: más de 4 parámetros
function createTable(name, columns, position, createdBy, createdAt, schema): Table

// BIEN: si necesitas más, usa objeto tipado
interface CreateTableInput {
  name: string;
  columns: Column[];
  position: Position;
  createdBy: string;
  createdAt: number;
  schema: string;
}
function createTable(input: CreateTableInput): Table
```

### Una Cosa, Un Nivel de Abstracción

```typescript
// MAL: mezcla niveles de abstracción
function processFile(path: string) {
  const content = fs.readFileSync(path, 'utf-8');  // IO bajo nivel
  const parsed = JSON.parse(content);              // Parsing
  const validated = schema.parse(parsed);          // Validación
  return validated;
}

// BIEN: cada nivel en su función
function readFile(path: string): string { /* IO */ }
function parseJson(content: string): unknown { /* Parsing */ }
function validateSchema(data: unknown): Validated { /* Validación */ }

function processFile(path: string): Validated {
  return validateSchema(parseJson(readFile(path)));
}
```

### Return Temprano

```typescript
// MAL: anidación profunda
function process(input: Input | null): Result {
  if (input) {
    if (input.valid) {
      if (input.type === 'a') {
        return handleA(input);
      } else {
        return handleB(input);
      }
    }
  }
  return defaultResult;
}

// BIEN: return temprano, sin anidación
function process(input: Input | null): Result {
  if (!input) return defaultResult;
  if (!input.valid) return defaultResult;
  if (input.type === 'a') return handleA(input);
  return handleB(input);
}
```

### Sin Flags Booleanos

```typescript
// MAL: flag que cambia comportamiento
function saveTable(table: Table, validate: boolean): void {
  if (validate) { /* ... */ }
  // ...
}

// BIEN: dos funciones claras
function saveTable(table: Table): void { /* ... */ }
function saveTableWithValidation(table: Table): void {
  validate(table);
  saveTable(table);
}
```

---

## 3. Nombres

### Funciones: Verbo en Imperativo

```typescript
// BIEN
addTable()
parseAwsService()
validateColumn()
deleteEdge()

// MAL
tableAdder()      // sustantivo
addingTable()     // gerundio
tableAdd()        // orden invertido
```

### Variables: Sustantivos Descriptivos

```typescript
// BIEN
const user = ...
const tableCount = ...
const activeConnections = ...

// MAL
const u = ...
const tc = ...
const data = ...  // demasiado vago
const temp = ...  // ¿temporal de qué?
```

### Booleanos: Prefijo Semántico

```typescript
// BIEN
const isConnected = ...
const hasColumns = ...
const canDelete = ...
const shouldRefresh = ...

// MAL
const connected = ...   // ¿verbo o adjetivo?
const columns = ...     // ¿es boolean o array?
```

### Constantes del Módulo

```typescript
// SCREAMING_SNAKE solo para constantes verdaderas
const MAX_COLUMNS = 100;
const DEFAULT_TIMEOUT_MS = 5000;

// Para configuración que puede cambiar, usa camelCase
const defaultConfig = { ... };
```

### Prohibido

| Nombre | Por qué |
|--------|---------|
| `usr`, `cfg`, `mgr` | Abreviaturas crípticas |
| `userArray`, `configObject` | El tipo está en el nombre |
| `data`, `info`, `value`, `result` | Demasiado vagos (excepto callbacks de 1 línea) |
| `temp`, `foo`, `bar` | No descriptivos |

---

## 4. Control de Flujo

### Prohibido `else` después de `return`

```typescript
// MAL
function check(x: number): string {
  if (x > 0) {
    return 'positive';
  } else {
    return 'non-positive';
  }
}

// BIEN
function check(x: number): string {
  if (x > 0) return 'positive';
  return 'non-positive';
}
```

### Switch Exhaustivo

```typescript
type Status = 'pending' | 'active' | 'done';

// MAL: sin default exhaustivo
function getLabel(status: Status): string {
  switch (status) {
    case 'pending': return 'Pendiente';
    case 'active': return 'Activo';
    // 'done' se olvida y TypeScript no lo detecta
  }
}

// BIEN: con assertNever
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

function getLabel(status: Status): string {
  switch (status) {
    case 'pending': return 'Pendiente';
    case 'active': return 'Activo';
    case 'done': return 'Completado';
    default: return assertNever(status); // Error si falta un caso
  }
}
```

### Array Methods vs Loops

```typescript
// BIEN: transformaciones con métodos funcionales
const names = tables.map(t => t.name);
const active = tables.filter(t => t.isActive);
const total = values.reduce((sum, v) => sum + v, 0);

// BIEN: loops cuando hay efectos o early exit
for (const table of tables) {
  if (table.name === target) return table; // early exit
  await saveToDb(table); // efecto
}
```

---

## 5. Async/Await

### Solo `async` si hay `await`

```typescript
// MAL: async sin await
async function getName(): Promise<string> {
  return 'name';
}

// BIEN: sin async si no esperas nada
function getName(): Promise<string> {
  return Promise.resolve('name');
}

// O simplemente:
function getName(): string {
  return 'name';
}
```

### Prohibido `.then()`

```typescript
// MAL
fetchData().then(data => process(data)).catch(err => handle(err));

// BIEN
try {
  const data = await fetchData();
  process(data);
} catch (err) {
  handle(err);
}
```

### Prohibido Promise Floating

```typescript
// MAL: promesa sin await ni catch
saveData(data); // Fire and forget - bugs silenciosos

// BIEN: siempre await o .catch()
await saveData(data);
// O si es intencional:
saveData(data).catch(err => logger.error(err));
```

---

## 6. Clases

### Cuándo Usar Clases

Solo si hay **estado + comportamiento cohesivos** (ej. `CanvasStore`).

- Si es solo datos → usa tipo
- Si es solo comportamiento → usa función

### Constructor Solo Asigna

```typescript
// MAL: lógica en constructor
class Store {
  constructor(config: Config) {
    this.data = loadFromDisk(config.path); // Lógica pesada
    this.connection = connect(config.url); // Efecto
  }
}

// BIEN: factory function
class Store {
  private constructor(private data: Data, private connection: Connection) {}

  static async create(config: Config): Promise<Store> {
    const data = await loadFromDisk(config.path);
    const connection = await connect(config.url);
    return new Store(data, connection);
  }
}
```

### Privados con `private`, no `_prefijo`

```typescript
// MAL
class Store {
  _internalState = {};
}

// BIEN
class Store {
  private internalState = {};
}
```

### Sin Getters/Setters con Lógica

```typescript
// MAL: getter con lógica oculta
class User {
  get fullName() {
    return this.fetchFromDb().fullName; // Efecto oculto!
  }
}

// BIEN: método explícito
class User {
  async getFullName(): Promise<string> {
    const data = await this.fetchFromDb();
    return data.fullName;
  }
}
```

---

## 7. Imports

### Orden

1. Builtins de Node (`node:fs`, `node:path`)
2. Dependencias externas (`zod`, `fastify`)
3. Imports de `@shared/*` o `@arqyx/shared`
4. Imports relativos del mismo package

Biome ordena automáticamente.

### Prohibido

```typescript
// MAL: subir 2+ niveles
import { Table } from '../../../shared/types';

// BIEN: usar path alias
import { Table } from '@arqyx/shared';

// MAL: import *
import * as utils from './utils';

// BIEN: importar lo que usas
import { formatDate, parseDate } from './date-utils';
```

---

## 8. Comentarios

### Prohibido por Defecto

- Sin docstrings multi-línea
- Sin comentarios explicando QUÉ hace el código
- Sin `// TODO` sin issue asociado

### Permitido

- Una línea máximo para invariantes no obvias
- Workarounds documentados con referencia

```typescript
// BIEN: workaround documentado
// Workaround para bug en React Flow v12.1 - ver issue #123
const position = { ...node.position };

// MAL: comentario que explica lo obvio
// Añade la tabla al array de tablas
tables.push(table);
```

### Regla de Oro

> Si necesitas un comentario para explicar qué hace el código, reescribe el código para que sea obvio.
