# 09 — Frontend React

> **React 19 + Vite + Zustand.** El frontend es donde más fácil se cuela código mediocre.

---

## 1. Stack del Frontend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19.x | UI framework |
| Vite | 6.x | Build tool |
| Tailwind CSS | 4.x | Estilos |
| shadcn/ui | latest | Componentes base |
| Lucide | latest | Iconos |
| @xyflow/react | 12.x | Canvas (React Flow) |
| Zustand | 5.x | Estado visual |

---

## 2. Componentes

### Un Componente = Un Archivo

```
ui/src/features/erd/
├── table-node.tsx       # TableNode
├── column-row.tsx       # ColumnRow
├── relation-edge.tsx    # RelationEdge
└── use-table-drag.ts    # Hook custom
```

### Convenciones de Nombres

| Elemento | Formato | Ejemplo |
|----------|---------|---------|
| Archivo | `kebab-case.tsx` | `table-node.tsx` |
| Componente | `PascalCase` | `TableNode` |
| Hook | `use-kebab-case.ts` | `use-table-drag.ts` |
| Tipo de props | `PascalCaseProps` | `TableNodeProps` |

### Límites

- Componente < **150 líneas**
- Si crece, extrae subcomponentes o hooks
- **Un solo export** por archivo

### Estructura de un Componente

```typescript
// ui/src/features/erd/table-node.tsx

// 1. Props tipadas al inicio
type TableNodeProps = {
  table: Table;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

// 2. Un solo export
export function TableNode({ table, isSelected, onSelect }: TableNodeProps) {
  // 3. Hooks primero
  const { theme } = useTheme();

  // 4. Handlers
  const handleClick = () => onSelect(table.id);

  // 5. JSX al final
  return (
    <div
      className={cn('rounded border p-2', isSelected && 'ring-2 ring-primary')}
      onClick={handleClick}
    >
      <h3 className="font-medium">{table.name}</h3>
      {table.columns.map(col => (
        <ColumnRow key={col.id} column={col} />
      ))}
    </div>
  );
}
```

### Prohibido

```typescript
// MAL: React.FC (obsoleto, añade children implícito)
const TableNode: React.FC<Props> = ({ ... }) => { ... }

// MAL: Props inline
export function TableNode({ table }: { table: Table }) { ... }

// MAL: Múltiples exports
export function TableNode() { ... }
export function TableHeader() { ... } // Debe estar en otro archivo
```

---

## 3. Estado UI

### Regla Dura

> La UI **no es dueña de estado de dominio**.

| Estado | Dónde Vive | Ejemplo |
|--------|------------|---------|
| Dominio | Server → WS → Hook | Tablas, columnas, conexiones |
| Visual | Zustand | Selección, zoom, tema, paneles |
| Local | useState | Input de formulario, dropdown abierto |

### Zustand: Solo Estado Visual

```typescript
// ui/src/stores/canvas-ui-store.ts
import { create } from 'zustand';

interface CanvasUIState {
  // Estado visual
  selectedNodeId: string | null;
  zoom: number;
  panOffset: { x: number; y: number };
  isPanelOpen: boolean;

  // Acciones
  selectNode: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  togglePanel: () => void;
}

export const useCanvasUIStore = create<CanvasUIState>((set) => ({
  selectedNodeId: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  isPanelOpen: false,

  selectNode: (id) => set({ selectedNodeId: id }),
  setZoom: (zoom) => set({ zoom }),
  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
}));
```

### Prohibido en Zustand

```typescript
// MAL: estado de dominio en Zustand
const useStore = create((set) => ({
  tables: [],  // Esto viene del server!
  addTable: (t) => set((s) => ({ tables: [...s.tables, t] })),
}));
```

### Prohibido con useState

```typescript
// MAL: estado compartido entre componentes en useState
function Parent() {
  const [selectedId, setSelectedId] = useState(null);
  return (
    <>
      <List selectedId={selectedId} onSelect={setSelectedId} />
      <Detail selectedId={selectedId} />
    </>
  );
}

// BIEN: levántalo a Zustand
function Parent() {
  return (
    <>
      <List />
      <Detail />
    </>
  );
}
// Ambos componentes leen de useCanvasUIStore
```

---

## 4. Efectos (`useEffect`)

### Regla de Oro

> `useEffect` es el **último recurso**, no el primero.

### Antes de Usar useEffect, Pregúntate

1. ¿Se puede calcular en render? → `const x = derivado`
2. ¿Se puede derivar de props? → Calcularlo inline
3. ¿Es un event handler disfrazado? → Moverlo al handler

### Prohibido: Sincronizar Estado con Efectos

```typescript
// MAL: efecto para sincronizar
const [derivedValue, setDerivedValue] = useState('');
useEffect(() => {
  setDerivedValue(computeFromProps(props));
}, [props]);

// BIEN: calcular en render
const derivedValue = computeFromProps(props);
```

### Dependencias Exhaustivas

```typescript
// El linter exige dependencias completas - NO ignorar
useEffect(() => {
  fetchData(userId);
}, [userId]); // ✅ Incluye userId

// MAL: ignorar la regla
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { ... }, []); // ❌
```

### Cleanup Obligatorio

```typescript
// Todo efecto con suscripción DEBE limpiar
useEffect(() => {
  const subscription = ws.subscribe(handler);
  return () => subscription.unsubscribe(); // ✅ Cleanup
}, []);

// MAL: sin cleanup
useEffect(() => {
  window.addEventListener('resize', handler);
  // ❌ Memory leak!
}, []);
```

---

## 5. Hooks Personalizados

### Cuándo Crear un Hook

Cuando dos o más componentes comparten lógica.

### Estructura

```typescript
// ui/src/features/erd/use-table-selection.ts
import { useCallback } from 'react';
import { useCanvasUIStore } from '@/stores/canvas-ui-store';

export function useTableSelection() {
  const selectedId = useCanvasUIStore((s) => s.selectedNodeId);
  const selectNode = useCanvasUIStore((s) => s.selectNode);

  const isSelected = useCallback(
    (id: string) => selectedId === id,
    [selectedId]
  );

  return { selectedId, selectNode, isSelected };
}
```

### Un Hook = Una Responsabilidad

```typescript
// MAL: hook-dios
function useEverything() {
  // Selección + zoom + pan + data fetching + ... ❌
}

// BIEN: hooks específicos
function useTableSelection() { ... }
function useCanvasZoom() { ... }
function useCanvasData() { ... }
```

### Hooks de IO: Thin Wrappers

```typescript
// La lógica está en función pura, el hook solo conecta a React
function parseMessage(raw: string): Message {
  return JSON.parse(raw); // Función pura
}

function useWebSocketMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onmessage = (event) => {
      const msg = parseMessage(event.data); // Usa la función pura
      setMessages((prev) => [...prev, msg]);
    };
    return () => ws.close();
  }, []);

  return messages;
}
```

---

## 6. Performance

### No Optimices Antes de Medir

```typescript
// MAL: useMemo/useCallback especulativos
const data = useMemo(() => items.map(transform), [items]); // ¿Necesario?
const onClick = useCallback(() => { ... }, []); // ¿Necesario?

// BIEN: solo cuando hay profile que lo justifica
// Profile muestra que este map tarda 50ms en 1000 items
const data = useMemo(() => items.map(expensiveTransform), [items]);
```

### Keys Estables

```typescript
// MAL: key basado en índice (si la lista se reordena)
{items.map((item, index) => (
  <Item key={index} data={item} /> // ❌
))}

// BIEN: key estable
{items.map((item) => (
  <Item key={item.id} data={item} /> // ✅
))}
```

### Evitar Objetos Inline en Props

```typescript
// MAL: objeto nuevo en cada render
<Chart style={{ width: 100, height: 50 }} />

// BIEN: extraer al módulo
const chartStyle = { width: 100, height: 50 };
<Chart style={chartStyle} />
```

---

## 7. React Flow Específico

### Nodos Custom en Archivos Separados

```
ui/src/features/erd/
├── table-node.tsx      # Un nodeType = un archivo
├── column-node.tsx
└── relation-edge.tsx
```

### Props Tipadas

```typescript
// NO usar any en data
type TableNodeData = {
  table: Table;
  isEditing: boolean;
};

function TableNode({ data }: NodeProps<TableNodeData>) {
  // data tiene tipo correcto
}
```

### Prohibido Mutar Nodes/Edges

```typescript
// MAL: mutación directa
nodes[0].position = { x: 100, y: 100 };

// BIEN: usar setters o despachar al server
setNodes((nds) =>
  nds.map((n) =>
    n.id === id ? { ...n, position: { x: 100, y: 100 } } : n
  )
);

// MEJOR: los cambios viajan al server
ws.send({ type: 'node:move', payload: { id, position } });
```

---

## 8. Anti-patrones Prohibidos

| Anti-patrón | Problema | Solución |
|-------------|----------|----------|
| `dangerouslySetInnerHTML` | XSS | Solo para SVG sanitizado |
| `useRef` para estado | No re-renderiza | Usar `useState` |
| Server + UI state en mismo hook | Confuso | Separar hooks |
| > 5 props booleanas | Son N componentes | Dividir componente |
| `{condition && <X />}` con `0` | Renderiza `0` | Usar ternario |
| Async en handler sin catch | Errores silenciosos | Manejar errores |

```typescript
// Ejemplo: condition && con 0
const count = 0;
{count && <Badge />} // Renderiza "0"!

// Correcto
{count > 0 ? <Badge /> : null}
```

---

## 9. Imports en UI

```typescript
// 1. Builtins React
import { useState, useEffect } from 'react';

// 2. Dependencias externas
import { useReactFlow } from '@xyflow/react';
import { cn } from 'clsx';

// 3. Imports de shared
import type { Table } from '@arqyx/shared';

// 4. Imports internos con alias
import { Button } from '@/components/ui/button';
import { useCanvasUIStore } from '@/stores/canvas-ui-store';

// 5. Imports relativos (mismo feature)
import { ColumnRow } from './column-row';
```

### Obligatorio

- `import type` para imports solo de tipo
- Path alias `@/` en vez de `../../../`
- Estilos de React Flow en `App.tsx`, no en cada componente
