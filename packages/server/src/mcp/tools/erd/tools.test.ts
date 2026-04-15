import { DomainError } from '@arqyx/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSequentialGenerator } from '../../../state/id-generator.js';
import { CanvasStore } from '../../../state/store.js';
import type { ToolContext } from '../../tool.js';
import { readCanvasTool } from '../canvas/read-canvas.js';
import { addColumnTool } from './add-column.js';
import { addTableTool } from './add-table.js';
import { createErdCanvasTool } from './create-canvas.js';
import { removeColumnTool } from './remove-column.js';
import { renameTableTool } from './rename-table.js';

function createContext(): ToolContext {
  return {
    store: new CanvasStore({
      canvasIdGenerator: createSequentialGenerator('canvas'),
      tableIdGenerator: createSequentialGenerator('tbl'),
      columnIdGenerator: createSequentialGenerator('col'),
      flowNodeIdGenerator: createSequentialGenerator('node'),
      flowEdgeIdGenerator: createSequentialGenerator('edge'),
    }),
    getCanvasUrl: () => 'http://localhost:7777',
  };
}

describe('create_erd_canvas tool', () => {
  let context: ToolContext;

  beforeEach(() => {
    context = createContext();
  });

  it('creates a canvas with the given name', async () => {
    const result = await createErdCanvasTool.handler({ name: 'Mi base' }, context);
    expect(result.content[0]?.text).toContain('Mi base');
    expect(context.store.list()).toHaveLength(1);
  });

  it('rejects empty names via schema', () => {
    expect(() => createErdCanvasTool.inputSchema.parse({ name: '' })).toThrow();
  });
});

describe('add_table tool', () => {
  let context: ToolContext;

  beforeEach(() => {
    context = createContext();
  });

  it('adds a table to an existing canvas', async () => {
    const canvas = context.store.createErdCanvas('Mi base');
    const result = await addTableTool.handler(
      {
        canvasId: canvas.id,
        name: 'users',
        position: { x: 0, y: 0 },
      },
      context,
    );
    expect(result.content[0]?.text).toContain('users');
    const updated = context.store.get(canvas.id);
    expect(updated?.kind === 'erd' && updated.tables).toHaveLength(1);
  });

  it('rejects invalid table names via schema', () => {
    expect(() =>
      addTableTool.inputSchema.parse({
        canvasId: 'canvas-1',
        name: '123-bad',
        position: { x: 0, y: 0 },
      }),
    ).toThrow();
  });

  it('throws DomainError when canvas does not exist', async () => {
    await expect(
      addTableTool.handler(
        { canvasId: 'missing', name: 'users', position: { x: 0, y: 0 } },
        context,
      ),
    ).rejects.toThrow(DomainError);
  });
});

describe('add_column tool', () => {
  it('adds a column to an existing table', async () => {
    const context = createContext();
    const canvas = context.store.createErdCanvas('Mi base');
    const withTable = context.store.addTable(canvas.id, {
      name: 'users',
      position: { x: 0, y: 0 },
    });
    const tableId = withTable.tables[0]?.id;
    if (!tableId) throw new Error('table id missing');

    const result = await addColumnTool.handler(
      {
        canvasId: canvas.id,
        tableId,
        name: 'email',
        type: 'text',
        isPrimaryKey: false,
        isNullable: false,
        isUnique: true,
      },
      context,
    );
    expect(result.content[0]?.text).toContain('email');
    const stored = context.store.get(canvas.id);
    expect(stored?.kind === 'erd' && stored.tables[0]?.columns).toHaveLength(1);
  });

  it('applies schema defaults when flags are omitted', () => {
    const parsed = addColumnTool.inputSchema.parse({
      canvasId: 'c1',
      tableId: 't1',
      name: 'id',
      type: 'uuid',
    });
    expect(parsed).toMatchObject({
      isPrimaryKey: false,
      isNullable: true,
      isUnique: false,
    });
  });

  it('rejects invalid column names via schema', () => {
    expect(() =>
      addColumnTool.inputSchema.parse({
        canvasId: 'c1',
        tableId: 't1',
        name: '9bad',
        type: 'text',
      }),
    ).toThrow();
  });
});

describe('rename_table tool', () => {
  it('renames a table successfully', async () => {
    const context = createContext();
    const canvas = context.store.createErdCanvas('Mi base');
    const withTable = context.store.addTable(canvas.id, {
      name: 'users',
      position: { x: 0, y: 0 },
    });
    const tableId = withTable.tables[0]?.id;
    if (!tableId) throw new Error('table id missing');

    const result = await renameTableTool.handler(
      { canvasId: canvas.id, tableId, newName: 'clientes' },
      context,
    );

    expect(result.content[0]?.text).toContain('clientes');
    const stored = context.store.get(canvas.id);
    expect(stored?.kind === 'erd' && stored.tables[0]?.name).toBe('clientes');
  });

  it('rejects invalid table names via schema', () => {
    expect(() =>
      renameTableTool.inputSchema.parse({
        canvasId: 'c1',
        tableId: 't1',
        newName: '9bad',
      }),
    ).toThrow();
  });
});

describe('remove_column tool', () => {
  it('removes an existing column', async () => {
    const context = createContext();
    const canvas = context.store.createErdCanvas('Mi base');
    const withTable = context.store.addTable(canvas.id, {
      name: 'users',
      position: { x: 0, y: 0 },
    });
    const tableId = withTable.tables[0]?.id;
    if (!tableId) throw new Error('table id missing');
    const withColumn = context.store.addColumn(canvas.id, tableId, {
      name: 'email',
      type: 'text',
      isPrimaryKey: false,
      isNullable: false,
      isUnique: true,
    });
    const columnId = withColumn.tables[0]?.columns[0]?.id;
    if (!columnId) throw new Error('column id missing');

    await removeColumnTool.handler({ canvasId: canvas.id, tableId, columnId }, context);

    const stored = context.store.get(canvas.id);
    expect(stored?.kind === 'erd' && stored.tables[0]?.columns).toHaveLength(0);
  });

  it('throws DomainError when column does not exist', async () => {
    const context = createContext();
    const canvas = context.store.createErdCanvas('Mi base');
    const withTable = context.store.addTable(canvas.id, {
      name: 'users',
      position: { x: 0, y: 0 },
    });
    const tableId = withTable.tables[0]?.id;
    if (!tableId) throw new Error('table id missing');

    await expect(
      removeColumnTool.handler({ canvasId: canvas.id, tableId, columnId: 'missing' }, context),
    ).rejects.toThrow(DomainError);
  });
});

describe('read_canvas tool', () => {
  it('returns the canvas state as JSON', async () => {
    const context = createContext();
    const canvas = context.store.createErdCanvas('Mi base');
    context.store.addTable(canvas.id, { name: 'users', position: { x: 0, y: 0 } });

    const result = await readCanvasTool.handler({ canvasId: canvas.id }, context);
    const parsed = JSON.parse(result.content[0]?.text ?? '{}');
    expect(parsed.kind).toBe('erd');
    expect(parsed.tables).toHaveLength(1);
  });

  it('throws DomainError when canvas does not exist', async () => {
    const context = createContext();
    await expect(readCanvasTool.handler({ canvasId: 'missing' }, context)).rejects.toThrow(
      DomainError,
    );
  });
});
