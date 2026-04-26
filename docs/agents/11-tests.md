# 11 — Tests

> **No hay código sin tests.** Vitest para todo.

---

## 1. Principio Fundamental

- Toda tool MCP tiene test unitario
- El store tiene tests de todas sus mutaciones
- Los schemas Zod tienen tests de casos válidos e inválidos
- **No se mergea código sin tests** para la lógica que añade

---

## 2. Stack de Testing

| Herramienta | Uso |
|-------------|-----|
| Vitest | Test runner |
| @testing-library/react | Tests de componentes |
| @testing-library/user-event | Simulación de interacciones |

---

## 3. Estructura de Archivos

Tests junto al código que testean:

```
packages/server/src/mcp/tools/erd/
├── add-table.ts
├── add-table.test.ts     ← Test junto al código
├── delete-table.ts
└── delete-table.test.ts

packages/shared/src/schemas/
├── table.ts
├── table.test.ts
├── canvas.ts
└── canvas.test.ts
```

---

## 4. Tests de Schemas Zod

```typescript
// packages/shared/src/schemas/table.test.ts
import { describe, it, expect } from 'vitest';
import { TableSchema, ColumnSchema } from './table.js';

describe('ColumnSchema', () => {
  it('acepta columna válida con todos los campos', () => {
    const valid = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'user_id',
      type: 'uuid',
      isPrimaryKey: true,
      isNullable: false,
    };
    expect(() => ColumnSchema.parse(valid)).not.toThrow();
  });

  it('aplica defaults correctamente', () => {
    const minimal = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'email',
      type: 'varchar',
    };
    const result = ColumnSchema.parse(minimal);
    expect(result.isPrimaryKey).toBe(false);
    expect(result.isNullable).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    const invalid = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: '',
      type: 'varchar',
    };
    expect(() => ColumnSchema.parse(invalid)).toThrow();
  });

  it('rechaza tipo inválido', () => {
    const invalid = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'field',
      type: 'invalid_type',
    };
    expect(() => ColumnSchema.parse(invalid)).toThrow();
  });

  it('rechaza id no-uuid', () => {
    const invalid = {
      id: 'not-a-uuid',
      name: 'field',
      type: 'varchar',
    };
    expect(() => ColumnSchema.parse(invalid)).toThrow();
  });
});

describe('TableSchema', () => {
  const validTable = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'users',
    columns: [],
    position: { x: 0, y: 0 },
  };

  it('acepta tabla válida', () => {
    expect(() => TableSchema.parse(validTable)).not.toThrow();
  });

  it('acepta tabla con columnas', () => {
    const withColumns = {
      ...validTable,
      columns: [
        { id: 'col-1', name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false },
        { id: 'col-2', name: 'email', type: 'varchar', isPrimaryKey: false, isNullable: false },
      ],
    };
    expect(() => TableSchema.parse(withColumns)).not.toThrow();
  });

  it('rechaza nombre con formato inválido', () => {
    const invalid = { ...validTable, name: 'Invalid Name' };
    expect(() => TableSchema.parse(invalid)).toThrow();
  });
});
```

---

## 5. Tests del Store

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

  describe('canvas operations', () => {
    it('crea canvas y emite evento', () => {
      const canvas = store.createCanvas({ type: 'erd', name: 'Test' });

      expect(canvas.id).toBeDefined();
      expect(canvas.type).toBe('erd');
      expect(canvas.name).toBe('Test');
      expect(mockEmitter.emit).toHaveBeenCalledWith('canvas:created', canvas);
    });

    it('establece canvas activo', () => {
      const canvas = store.createCanvas({ type: 'erd', name: 'Test' });
      store.setActiveCanvas(canvas.id);

      expect(store.getActiveCanvas()?.id).toBe(canvas.id);
      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'canvas:active-changed',
        { canvasId: canvas.id }
      );
    });
  });

  describe('table operations', () => {
    beforeEach(() => {
      const canvas = store.createCanvas({ type: 'erd', name: 'Test' });
      store.setActiveCanvas(canvas.id);
      mockEmitter.emit.mockClear();
    });

    it('añade tabla y emite evento', () => {
      const table = store.addTable({ name: 'users' });

      expect(table.id).toBeDefined();
      expect(table.name).toBe('users');
      expect(table.columns).toEqual([]);
      expect(mockEmitter.emit).toHaveBeenCalledWith('table:added', table);
    });

    it('devuelve copia inmutable', () => {
      const table = store.addTable({ name: 'users' });
      table.name = 'modified'; // Intento de mutación

      const retrieved = store.getTable(table.id);
      expect(retrieved?.name).toBe('users'); // No afectado
    });

    it('actualiza tabla y emite evento', () => {
      const table = store.addTable({ name: 'users' });
      mockEmitter.emit.mockClear();

      const updated = store.updateTable(table.id, { name: 'accounts' });

      expect(updated.name).toBe('accounts');
      expect(mockEmitter.emit).toHaveBeenCalledWith('table:updated', updated);
    });

    it('falla al actualizar tabla inexistente', () => {
      expect(() =>
        store.updateTable('non-existent', { name: 'test' })
      ).toThrow('not found');
    });

    it('elimina tabla y emite evento', () => {
      const table = store.addTable({ name: 'users' });
      mockEmitter.emit.mockClear();

      store.deleteTable(table.id);

      expect(store.getTable(table.id)).toBeUndefined();
      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'table:deleted',
        { id: table.id }
      );
    });
  });
});
```

---

## 6. Tests de Tools MCP

```typescript
// packages/server/src/mcp/tools/erd/add-table.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handler, inputSchema } from './add-table.js';
import { store } from '../../state/store.js';

// Mock del store
vi.mock('../../state/store.js', () => ({
  store: {
    getActiveCanvas: vi.fn(),
    addTable: vi.fn(),
  },
}));

describe('erd_add_table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('inputSchema', () => {
    it('acepta input válido', () => {
      const valid = { name: 'users', columns: [] };
      expect(() => inputSchema.parse(valid)).not.toThrow();
    });

    it('rechaza nombre vacío', () => {
      const invalid = { name: '' };
      expect(() => inputSchema.parse(invalid)).toThrow();
    });

    it('rechaza nombre con formato inválido', () => {
      const invalid = { name: 'Invalid Name' };
      expect(() => inputSchema.parse(invalid)).toThrow();
    });
  });

  describe('handler', () => {
    it('crea tabla cuando hay canvas ERD activo', async () => {
      vi.mocked(store.getActiveCanvas).mockReturnValue({
        id: 'canvas-1',
        type: 'erd',
        name: 'Test',
      });
      vi.mocked(store.addTable).mockReturnValue({
        id: 'table-1',
        name: 'users',
        columns: [],
        position: { x: 100, y: 100 },
      });

      const result = await handler({ name: 'users', columns: [] });

      expect(result.tableId).toBe('table-1');
      expect(result.message).toContain('users');
      expect(store.addTable).toHaveBeenCalledWith({
        name: 'users',
        columns: [],
        position: { x: 100, y: 100 },
      });
    });

    it('falla sin canvas activo', async () => {
      vi.mocked(store.getActiveCanvas).mockReturnValue(null);

      await expect(handler({ name: 'users' })).rejects.toThrow(
        'No hay un canvas activo'
      );
    });

    it('falla si el canvas no es ERD', async () => {
      vi.mocked(store.getActiveCanvas).mockReturnValue({
        id: 'canvas-1',
        type: 'aws',
        name: 'AWS Canvas',
      });

      await expect(handler({ name: 'users' })).rejects.toThrow(
        'no "erd"'
      );
    });
  });
});
```

---

## 7. Tests de UI (Componentes)

```typescript
// packages/ui/src/features/erd/table-node.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableNode } from './table-node';

describe('TableNode', () => {
  const mockTable = {
    id: 'table-1',
    name: 'users',
    columns: [
      { id: 'col-1', name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false },
      { id: 'col-2', name: 'email', type: 'varchar', isPrimaryKey: false, isNullable: false },
    ],
    position: { x: 0, y: 0 },
  };

  it('muestra el nombre de la tabla', () => {
    render(<TableNode table={mockTable} isSelected={false} onSelect={() => {}} />);

    expect(screen.getByText('users')).toBeInTheDocument();
  });

  it('muestra las columnas', () => {
    render(<TableNode table={mockTable} isSelected={false} onSelect={() => {}} />);

    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
  });

  it('llama onSelect al hacer click', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<TableNode table={mockTable} isSelected={false} onSelect={onSelect} />);

    await user.click(screen.getByText('users'));

    expect(onSelect).toHaveBeenCalledWith('table-1');
  });

  it('aplica estilos de selección', () => {
    const { rerender } = render(
      <TableNode table={mockTable} isSelected={false} onSelect={() => {}} />
    );

    expect(screen.getByRole('article')).not.toHaveClass('ring-2');

    rerender(
      <TableNode table={mockTable} isSelected={true} onSelect={() => {}} />
    );

    expect(screen.getByRole('article')).toHaveClass('ring-2');
  });
});
```

---

## 8. Qué NO Testear

### Implementación

```typescript
// MAL: testea implementación
expect(useState).toHaveBeenCalled();
expect(component.state.internal).toBe(true);

// BIEN: testea comportamiento
expect(screen.getByText('Resultado visible')).toBeInTheDocument();
```

### Componentes Puramente Presentacionales

Si un componente solo recibe props y renderiza JSX sin lógica, no necesita test propio. Pero sí debe estar cubierto por tests de integración del feature.

---

## 9. Comandos

```bash
# Correr todos los tests
pnpm test

# Correr tests en modo watch
pnpm test -- --watch

# Correr tests de un archivo
pnpm test -- packages/server/src/state/store.test.ts

# Correr tests con coverage
pnpm test -- --coverage
```

---

## 10. Checklist de Tests

Antes de enviar un PR:

- [ ] ¿Toda tool MCP nueva tiene tests?
- [ ] ¿Toda mutación del store tiene tests?
- [ ] ¿Los schemas tienen tests de casos válidos e inválidos?
- [ ] ¿Los componentes con lógica tienen tests?
- [ ] ¿`pnpm test` pasa sin errores?
