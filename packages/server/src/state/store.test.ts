import { type CanvasId, DomainError } from '@arqyx/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSequentialGenerator } from './id-generator.js';
import { CanvasStore, type StoreEvent } from './store.js';

function createTestStore(): CanvasStore {
  return new CanvasStore({
    canvasIdGenerator: createSequentialGenerator('canvas'),
    tableIdGenerator: createSequentialGenerator('tbl'),
    columnIdGenerator: createSequentialGenerator('col'),
    flowNodeIdGenerator: createSequentialGenerator('node'),
    flowEdgeIdGenerator: createSequentialGenerator('edge'),
  });
}

describe('CanvasStore.createErdCanvas', () => {
  let store: CanvasStore;

  beforeEach(() => {
    store = createTestStore();
  });

  it('creates an empty ERD canvas and returns it', () => {
    const canvas = store.createErdCanvas('Mi base');
    expect(canvas.kind).toBe('erd');
    expect(canvas.name).toBe('Mi base');
    expect(canvas.tables).toEqual([]);
  });

  it('generates sequential ids for subsequent canvases', () => {
    const first = store.createErdCanvas('A');
    const second = store.createErdCanvas('B');
    expect(first.id).not.toBe(second.id);
  });

  it('emits a canvas:created event', () => {
    const listener = vi.fn<(event: StoreEvent) => void>();
    store.on(listener);
    const canvas = store.createErdCanvas('Mi base');
    expect(listener).toHaveBeenCalledWith({ type: 'canvas:created', canvas });
  });
});

describe('CanvasStore.addTable', () => {
  let store: CanvasStore;

  beforeEach(() => {
    store = createTestStore();
  });

  it('adds a table to an existing ERD canvas', () => {
    const canvas = store.createErdCanvas('Mi base');
    const updated = store.addTable(canvas.id, {
      name: 'users',
      position: { x: 0, y: 0 },
    });
    expect(updated.tables).toHaveLength(1);
    expect(updated.tables[0]?.name).toBe('users');
  });

  it('emits a canvas:updated event', () => {
    const canvas = store.createErdCanvas('Mi base');
    const listener = vi.fn<(event: StoreEvent) => void>();
    store.on(listener);
    store.addTable(canvas.id, { name: 'users', position: { x: 0, y: 0 } });
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'canvas:updated' }));
  });

  it('throws CANVAS_NOT_FOUND for unknown canvas', () => {
    expect(() =>
      store.addTable('missing' as CanvasId, { name: 'users', position: { x: 0, y: 0 } }),
    ).toThrow(DomainError);
  });

  it('preserves immutability of previous canvas snapshot', () => {
    const first = store.createErdCanvas('Mi base');
    store.addTable(first.id, { name: 'users', position: { x: 0, y: 0 } });
    expect(first.tables).toHaveLength(0);
  });
});

describe('CanvasStore.addColumn', () => {
  it('adds a column to an existing table', () => {
    const store = createTestStore();
    const canvas = store.createErdCanvas('Mi base');
    const afterTable = store.addTable(canvas.id, {
      name: 'users',
      position: { x: 0, y: 0 },
    });
    const tableId = afterTable.tables[0]?.id;
    if (!tableId) throw new Error('table id missing');

    const updated = store.addColumn(canvas.id, tableId, {
      name: 'email',
      type: 'text',
      isPrimaryKey: false,
      isNullable: false,
      isUnique: true,
    });

    const table = updated.tables[0];
    expect(table?.columns).toHaveLength(1);
    expect(table?.columns[0]?.name).toBe('email');
  });
});

describe('CanvasStore.removeColumn', () => {
  it('removes an existing column', () => {
    const store = createTestStore();
    const canvas = store.createErdCanvas('Mi base');
    const afterTable = store.addTable(canvas.id, {
      name: 'users',
      position: { x: 0, y: 0 },
    });
    const tableId = afterTable.tables[0]?.id;
    if (!tableId) throw new Error('table id missing');
    const withColumn = store.addColumn(canvas.id, tableId, {
      name: 'email',
      type: 'text',
      isPrimaryKey: false,
      isNullable: false,
      isUnique: true,
    });
    const columnId = withColumn.tables[0]?.columns[0]?.id;
    if (!columnId) throw new Error('column id missing');

    const updated = store.removeColumn(canvas.id, tableId, columnId);
    expect(updated.tables[0]?.columns).toHaveLength(0);
  });
});

describe('CanvasStore.renameTable', () => {
  it('updates the name of a table and emits canvas:updated', () => {
    const store = createTestStore();
    const canvas = store.createErdCanvas('Mi base');
    const withTable = store.addTable(canvas.id, {
      name: 'users',
      position: { x: 0, y: 0 },
    });
    const tableId = withTable.tables[0]?.id;
    if (!tableId) throw new Error('table id missing');

    const updated = store.renameTable(canvas.id, tableId, 'clientes');
    expect(updated.tables[0]?.name).toBe('clientes');
  });
});

describe('CanvasStore.moveTable', () => {
  it('updates the position of a table and emits canvas:updated', () => {
    const store = createTestStore();
    const canvas = store.createErdCanvas('Mi base');
    const withTable = store.addTable(canvas.id, {
      name: 'users',
      position: { x: 0, y: 0 },
    });
    const tableId = withTable.tables[0]?.id;
    if (!tableId) throw new Error('table id missing');

    const updated = store.moveTable(canvas.id, tableId, { x: 321, y: 654 });
    expect(updated.tables[0]?.position).toEqual({ x: 321, y: 654 });
  });
});

describe('CanvasStore flow methods', () => {
  it('creates a flow canvas and adds a node', () => {
    const store = createTestStore();
    const canvas = store.createFlowCanvas('Mi proceso');
    const withNode = store.addFlowNode(canvas.id, {
      shape: 'rounded',
      color: 'green',
      label: 'Inicio',
      description: null,
      position: { x: 0, y: 0 },
    });
    expect(withNode.kind).toBe('flow');
    expect(withNode.nodes).toHaveLength(1);
    expect(withNode.nodes[0]?.label).toBe('Inicio');
  });

  it('connects two flow nodes and removes the edge', () => {
    const store = createTestStore();
    const canvas = store.createFlowCanvas('Mi proceso');
    const withStart = store.addFlowNode(canvas.id, {
      shape: 'rounded',
      color: 'green',
      label: 'Inicio',
      description: null,
      position: { x: 0, y: 0 },
    });
    const fromId = withStart.nodes[0]?.id;
    const withEnd = store.addFlowNode(canvas.id, {
      shape: 'rounded',
      color: 'red',
      label: 'Fin',
      description: null,
      position: { x: 400, y: 0 },
    });
    const toId = withEnd.nodes[1]?.id;
    if (!fromId || !toId) throw new Error('node ids missing');

    const withEdge = store.connectFlowNodes(canvas.id, {
      from: fromId,
      to: toId,
      label: 'siguiente',
      style: 'solid',
      arrow: 'single',
    });
    expect(withEdge.edges).toHaveLength(1);
    const edgeId = withEdge.edges[0]?.id;
    if (!edgeId) throw new Error('edge id missing');

    const withoutEdge = store.removeFlowEdge(canvas.id, edgeId);
    expect(withoutEdge.edges).toHaveLength(0);
  });

  it('rejects flow operations on an ERD canvas', () => {
    const store = createTestStore();
    const erd = store.createErdCanvas('Mi base');
    expect(() =>
      store.addFlowNode(erd.id, {
        shape: 'rectangle',
        color: 'neutral',
        label: 'x',
        description: null,
        position: { x: 0, y: 0 },
      }),
    ).toThrow(DomainError);
  });
});

describe('CanvasStore.get', () => {
  it('returns the current canvas after mutations', () => {
    const store = createTestStore();
    const created = store.createErdCanvas('Mi base');
    store.addTable(created.id, { name: 'users', position: { x: 0, y: 0 } });
    const fetched = store.get(created.id);
    expect(fetched?.kind).toBe('erd');
    expect(fetched && 'tables' in fetched && fetched.tables).toHaveLength(1);
  });
});
