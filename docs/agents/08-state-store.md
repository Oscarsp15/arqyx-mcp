# 08 — Estado y Store

> **Una sola fuente de verdad.** El store es inmutable por fuera.

---

## 1. Principio Fundamental

- **Única fuente de verdad**: `packages/server/src/state/store.ts`
- El store es **inmutable por fuera**: devuelve copias o `readonly`
- Toda mutación pasa por un **método del store**
- La UI **no** es dueña de estado de dominio

---

## 2. Arquitectura del Estado

```
┌─────────────────────────────────────────────────────────┐
│                        Store                             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Estado interno (privado)                           │ │
│  │  - canvases: Map<string, Canvas>                    │ │
│  │  - activeCanvasId: string | null                    │ │
│  │  - tables: Map<string, Table>                       │ │
│  │  - services: Map<string, AwsService>                │ │
│  │  - edges: Map<string, Edge>                         │ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                               │
│  ┌────────────────────────┼────────────────────────────┐ │
│  │  Métodos públicos      ▼                            │ │
│  │  - getActiveCanvas(): Canvas | null                 │ │
│  │  - addTable(input): Table                           │ │
│  │  - updateTable(id, changes): Table                  │ │
│  │  - deleteTable(id): void                            │ │
│  │  - ...                                              │ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                               │
│                           │ emit                          │
│                           ▼                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  EventEmitter → WS Hub → Clientes                   │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Reglas del Store

### Inmutabilidad Externa

```typescript
// MAL: devolver referencia directa
getTable(id: string): Table | undefined {
  return this.tables.get(id); // Permite mutación externa!
}

// BIEN: devolver copia
getTable(id: string): Table | undefined {
  const table = this.tables.get(id);
  if (!table) return undefined;
  return { ...table, columns: [...table.columns] };
}

// BIEN: devolver readonly
getTable(id: string): Readonly<Table> | undefined {
  return this.tables.get(id);
}
```

### Toda Mutación por Método

```typescript
// MAL: mutación directa
const table = store.getTable(id);
table.name = 'nuevo nombre'; // Mutación externa!

// BIEN: mutación via método
store.updateTable(id, { name: 'nuevo nombre' });
```

### Emisión de Eventos

Tras cada mutación, el store emite un evento:

```typescript
class Store {
  constructor(private emitter: EventEmitter) {}

  addTable(input: AddTableInput): Table {
    const table = createTable(input);
    this.tables.set(table.id, table);

    // Emitir evento para sincronizar clientes
    this.emitter.emit('table:added', table);

    return table;
  }
}
```

---

## 4. Estructura del Store

```typescript
// packages/server/src/state/store.ts
import { EventEmitter } from 'node:events';
import type { Canvas, Table, AwsService, Edge } from '@arqyx/shared';

interface EventEmitterInterface {
  emit(event: string, data: unknown): void;
}

class CanvasStore {
  private canvases = new Map<string, Canvas>();
  private activeCanvasId: string | null = null;
  private tables = new Map<string, Table>();
  private services = new Map<string, AwsService>();
  private edges = new Map<string, Edge>();

  constructor(private emitter: EventEmitterInterface) {}

  // === Canvas ===

  createCanvas(input: CreateCanvasInput): Canvas {
    const canvas = {
      id: this.generateId(),
      ...input,
      createdAt: Date.now(),
    };
    this.canvases.set(canvas.id, canvas);
    this.emitter.emit('canvas:created', canvas);
    return canvas;
  }

  getActiveCanvas(): Readonly<Canvas> | null {
    if (!this.activeCanvasId) return null;
    return this.canvases.get(this.activeCanvasId) ?? null;
  }

  setActiveCanvas(id: string | null): void {
    this.activeCanvasId = id;
    this.emitter.emit('canvas:active-changed', { canvasId: id });
  }

  // === Tables ===

  addTable(input: AddTableInput): Table {
    const table: Table = {
      id: this.generateId(),
      name: input.name,
      columns: input.columns ?? [],
      position: input.position ?? { x: 100, y: 100 },
    };
    this.tables.set(table.id, table);
    this.emitter.emit('table:added', table);
    return { ...table };
  }

  updateTable(id: string, changes: Partial<Table>): Table {
    const existing = this.tables.get(id);
    if (!existing) throw new Error(`Table ${id} not found`);

    const updated = { ...existing, ...changes };
    this.tables.set(id, updated);
    this.emitter.emit('table:updated', updated);
    return { ...updated };
  }

  deleteTable(id: string): void {
    const existed = this.tables.delete(id);
    if (existed) {
      this.emitter.emit('table:deleted', { id });
    }
  }

  // === Testing ===

  reset(): void {
    this.canvases.clear();
    this.tables.clear();
    this.services.clear();
    this.edges.clear();
    this.activeCanvasId = null;
  }

  // === Privado ===

  private generateId(): string {
    return crypto.randomUUID();
  }
}

// Singleton con inyección de emitter
export const createStore = (emitter: EventEmitterInterface) =>
  new CanvasStore(emitter);

// Para tests
export const createTestStore = () =>
  new CanvasStore({ emit: () => {} });
```

---

## 5. Estado de la UI

### Qué Maneja Zustand (UI)

| Estado | Ejemplo | Dónde Vive |
|--------|---------|------------|
| Visual | Selección actual, zoom, pan | Zustand |
| Preferencias | Tema (claro/oscuro), layout | Zustand |
| UI temporal | Modal abierto, tooltip | Zustand |
| Dominio | Tablas, servicios, conexiones | Server → WS → Hook |

### Qué NO Maneja Zustand

```typescript
// MAL: estado de dominio en Zustand
const useCanvasStore = create((set) => ({
  tables: [],  // NO! Esto viene del server
  addTable: (table) => set(s => ({ tables: [...s.tables, table] })),
}));

// BIEN: estado visual en Zustand
const useCanvasStore = create((set) => ({
  selectedNodeId: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  setSelectedNode: (id) => set({ selectedNodeId: id }),
}));
```

---

## 6. Sincronización UI ↔ Server

```typescript
// packages/ui/src/hooks/use-canvas-data.ts
import { useEffect, useState } from 'react';
import { useWebSocket } from './use-websocket';
import type { Canvas, Table } from '@arqyx/shared';

export function useCanvasData() {
  const ws = useWebSocket();
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    const unsubscribe = ws.subscribe((message) => {
      switch (message.type) {
        case 'canvas:updated':
          setCanvas(message.payload);
          break;
        case 'table:added':
          setTables(prev => [...prev, message.payload]);
          break;
        case 'table:updated':
          setTables(prev =>
            prev.map(t => t.id === message.payload.id ? message.payload : t)
          );
          break;
        case 'table:deleted':
          setTables(prev =>
            prev.filter(t => t.id !== message.payload.id)
          );
          break;
      }
    });

    return unsubscribe;
  }, [ws]);

  return { canvas, tables };
}
```

---

## 7. Tests del Store

```typescript
// packages/server/src/state/store.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from './store.js';

describe('CanvasStore', () => {
  const mockEmitter = { emit: vi.fn() };
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore(mockEmitter);
    mockEmitter.emit.mockClear();
  });

  describe('addTable', () => {
    it('añade tabla y emite evento', () => {
      const table = store.addTable({ name: 'users' });

      expect(table.id).toBeDefined();
      expect(table.name).toBe('users');
      expect(mockEmitter.emit).toHaveBeenCalledWith('table:added', table);
    });

    it('devuelve copia, no referencia', () => {
      const table = store.addTable({ name: 'users' });
      table.name = 'modified';

      const retrieved = store.getTable(table.id);
      expect(retrieved?.name).toBe('users'); // No afectado
    });
  });

  describe('updateTable', () => {
    it('actualiza propiedades y emite evento', () => {
      const table = store.addTable({ name: 'users' });
      mockEmitter.emit.mockClear();

      const updated = store.updateTable(table.id, { name: 'accounts' });

      expect(updated.name).toBe('accounts');
      expect(mockEmitter.emit).toHaveBeenCalledWith('table:updated', updated);
    });

    it('falla si la tabla no existe', () => {
      expect(() =>
        store.updateTable('non-existent', { name: 'test' })
      ).toThrow('not found');
    });
  });

  describe('deleteTable', () => {
    it('elimina tabla y emite evento', () => {
      const table = store.addTable({ name: 'users' });
      mockEmitter.emit.mockClear();

      store.deleteTable(table.id);

      expect(store.getTable(table.id)).toBeUndefined();
      expect(mockEmitter.emit).toHaveBeenCalledWith('table:deleted', { id: table.id });
    });
  });
});
```

---

## 8. Inyección de Dependencias

El store no importa WebSocket directamente — recibe un `EventEmitter`:

```typescript
// En producción
import { EventEmitter } from 'node:events';
import { createStore } from './state/store.js';
import { WsHub } from './web/ws-hub.js';

const emitter = new EventEmitter();
const store = createStore(emitter);
const wsHub = new WsHub(emitter);

// En tests
import { createStore } from './state/store.js';

const mockEmitter = { emit: vi.fn() };
const store = createStore(mockEmitter);
```
