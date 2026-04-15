import {
  type CanvasId,
  type ColumnId,
  DomainError,
  type ErdCanvas,
  type TableId,
} from '@arqyx/shared';
import { describe, expect, it } from 'vitest';
import {
  addColumnToTable,
  addRelationToCanvas,
  addTableToCanvas,
  createEmptyErdCanvas,
  editColumnInTable,
  moveTableInCanvas,
  removeColumnFromTable,
  removeRelationFromCanvas,
  removeTableFromCanvas,
  renameColumnInTable,
  renameTableInCanvas,
} from './erd-operations.js';

const canvasId = 'canvas-1' as CanvasId;

describe('createEmptyErdCanvas', () => {
  it('creates a canvas with no tables or relations', () => {
    const canvas = createEmptyErdCanvas(canvasId, 'Mi base');
    expect(canvas.id).toBe(canvasId);
    expect(canvas.kind).toBe('erd');
    expect(canvas.name).toBe('Mi base');
    expect(canvas.tables).toEqual([]);
    expect(canvas.relations).toEqual([]);
  });
});

describe('addTableToCanvas', () => {
  const base = createEmptyErdCanvas(canvasId, 'Mi base');

  it('returns a new canvas with the table appended', () => {
    const next = addTableToCanvas(base, {
      id: 'tbl-1' as TableId,
      name: 'users',
      position: { x: 0, y: 0 },
    });

    expect(next.tables).toHaveLength(1);
    expect(next.tables[0]?.name).toBe('users');
    expect(base.tables).toHaveLength(0);
  });

  it('rejects duplicate table names', () => {
    const withUsers = addTableToCanvas(base, {
      id: 'tbl-1' as TableId,
      name: 'users',
      position: { x: 0, y: 0 },
    });

    expect(() =>
      addTableToCanvas(withUsers, {
        id: 'tbl-2' as TableId,
        name: 'users',
        position: { x: 100, y: 0 },
      }),
    ).toThrow(DomainError);
  });
});

describe('addColumnToTable', () => {
  const tableId = 'tbl-1' as TableId;
  const withTable = addTableToCanvas(createEmptyErdCanvas(canvasId, 'Mi base'), {
    id: tableId,
    name: 'users',
    position: { x: 0, y: 0 },
  });

  it('appends a column to the target table without mutating the previous canvas', () => {
    const next = addColumnToTable(withTable, tableId, {
      id: 'col-1' as ColumnId,
      name: 'id',
      type: 'uuid',
      isPrimaryKey: true,
      isNullable: false,
      isUnique: true,
    });
    const nextTable = next.tables[0];
    expect(nextTable?.columns).toHaveLength(1);
    expect(nextTable?.columns[0]?.name).toBe('id');
    expect(withTable.tables[0]?.columns).toHaveLength(0);
  });

  it('rejects duplicate column names within the same table', () => {
    const withId = addColumnToTable(withTable, tableId, {
      id: 'col-1' as ColumnId,
      name: 'id',
      type: 'uuid',
      isPrimaryKey: true,
      isNullable: false,
      isUnique: true,
    });

    expect(() =>
      addColumnToTable(withId, tableId, {
        id: 'col-2' as ColumnId,
        name: 'id',
        type: 'int',
        isPrimaryKey: false,
        isNullable: true,
        isUnique: false,
      }),
    ).toThrow(DomainError);
  });

  it('throws TABLE_NOT_FOUND when the target table does not exist', () => {
    expect(() =>
      addColumnToTable(withTable, 'missing' as TableId, {
        id: 'col-1' as ColumnId,
        name: 'id',
        type: 'uuid',
        isPrimaryKey: true,
        isNullable: false,
        isUnique: true,
      }),
    ).toThrow(DomainError);
  });
});

describe('removeColumnFromTable', () => {
  const tableId = 'tbl-1' as TableId;
  const columnId = 'col-1' as ColumnId;
  const base = addColumnToTable(
    addTableToCanvas(createEmptyErdCanvas(canvasId, 'Mi base'), {
      id: tableId,
      name: 'users',
      position: { x: 0, y: 0 },
    }),
    tableId,
    {
      id: columnId,
      name: 'email',
      type: 'text',
      isPrimaryKey: false,
      isNullable: false,
      isUnique: true,
    },
  );

  it('removes the column from the target table', () => {
    const next = removeColumnFromTable(base, tableId, columnId);
    expect(next.tables[0]?.columns).toHaveLength(0);
    expect(base.tables[0]?.columns).toHaveLength(1);
  });

  it('throws COLUMN_NOT_FOUND when the column does not exist', () => {
    expect(() => removeColumnFromTable(base, tableId, 'missing' as ColumnId)).toThrow(DomainError);
  });
});

describe('renameColumnInTable', () => {
  const tableId = 'tbl-1' as TableId;
  const columnId = 'col-1' as ColumnId;
  const base = addColumnToTable(
    addTableToCanvas(createEmptyErdCanvas(canvasId, 'Mi base'), {
      id: tableId,
      name: 'users',
      position: { x: 0, y: 0 },
    }),
    tableId,
    {
      id: columnId,
      name: 'email',
      type: 'text',
      isPrimaryKey: false,
      isNullable: false,
      isUnique: true,
    },
  );

  it('updates the name of the target column without mutating the previous canvas', () => {
    const next = renameColumnInTable(base, tableId, columnId, 'correo');
    const renamed = next.tables[0]?.columns[0];
    const original = base.tables[0]?.columns[0];
    expect(renamed?.name).toBe('correo');
    expect(original?.name).toBe('email');
    expect(renamed?.type).toBe(original?.type);
  });

  it('allows renaming to the exact same name without throwing', () => {
    const next = renameColumnInTable(base, tableId, columnId, 'email');
    expect(next.tables[0]?.columns[0]?.name).toBe('email');
  });

  it('throws COLUMN_NOT_FOUND when the column does not exist', () => {
    expect(() => renameColumnInTable(base, tableId, 'missing' as ColumnId, 'test')).toThrow(
      DomainError,
    );
  });

  it('rejects duplicate column names in the same table', () => {
    const withSecondCol = addColumnToTable(base, tableId, {
      id: 'col-2' as ColumnId,
      name: 'status',
      type: 'text',
      isPrimaryKey: false,
      isNullable: false,
      isUnique: false,
    });
    expect(() => renameColumnInTable(withSecondCol, tableId, 'col-2' as ColumnId, 'email')).toThrow(
      DomainError,
    );
  });
});

describe('editColumnInTable', () => {
  const tableId = 'tbl-1' as TableId;
  const columnId = 'col-1' as ColumnId;
  const base = addColumnToTable(
    addTableToCanvas(createEmptyErdCanvas(canvasId, 'Mi base'), {
      id: tableId,
      name: 'users',
      position: { x: 0, y: 0 },
    }),
    tableId,
    {
      id: columnId,
      name: 'email',
      type: 'text',
      isPrimaryKey: false,
      isNullable: true,
      isUnique: false,
    },
  );

  it('updates the specified properties of a column leaving others intact', () => {
    const next = editColumnInTable(base, tableId, columnId, {
      isUnique: true,
      type: 'varchar',
    });
    const edited = next.tables[0]?.columns[0];
    const original = base.tables[0]?.columns[0];

    expect(edited?.type).toBe('varchar');
    expect(edited?.isUnique).toBe(true);
    expect(edited?.isNullable).toBe(true);
    expect(edited?.name).toBe('email');

    expect(original?.type).toBe('text');
  });

  it('throws COLUMN_NOT_FOUND when the column does not exist', () => {
    expect(() =>
      editColumnInTable(base, tableId, 'missing' as ColumnId, { isPrimaryKey: true }),
    ).toThrow(DomainError);
  });
});

function buildCanvasWithTwoTables(): {
  canvas: ErdCanvas;
  usersId: TableId;
  ordersId: TableId;
  usersPk: ColumnId;
  ordersFk: ColumnId;
} {
  const usersId = 'tbl-users' as TableId;
  const ordersId = 'tbl-orders' as TableId;
  const usersPk = 'col-users-id' as ColumnId;
  const ordersFk = 'col-orders-user' as ColumnId;

  const withUsers = addTableToCanvas(createEmptyErdCanvas(canvasId, 'Mi base'), {
    id: usersId,
    name: 'users',
    position: { x: 0, y: 0 },
  });
  const withOrders = addTableToCanvas(withUsers, {
    id: ordersId,
    name: 'orders',
    position: { x: 400, y: 0 },
  });
  const withUsersPk = addColumnToTable(withOrders, usersId, {
    id: usersPk,
    name: 'id',
    type: 'uuid',
    isPrimaryKey: true,
    isNullable: false,
    isUnique: true,
  });
  const canvas = addColumnToTable(withUsersPk, ordersId, {
    id: ordersFk,
    name: 'user_id',
    type: 'uuid',
    isPrimaryKey: false,
    isNullable: false,
    isUnique: false,
  });

  return { canvas, usersId, ordersId, usersPk, ordersFk };
}

describe('addRelationToCanvas', () => {
  it('adds a relation between two valid columns', () => {
    const { canvas, usersId, ordersId, usersPk, ordersFk } = buildCanvasWithTwoTables();
    const next = addRelationToCanvas(canvas, {
      fromTable: ordersId,
      fromColumn: ordersFk,
      toTable: usersId,
      toColumn: usersPk,
      kind: 'one-to-many',
    });
    expect(next.relations).toHaveLength(1);
    expect(canvas.relations).toHaveLength(0);
  });

  it('rejects duplicate relations with the same endpoints', () => {
    const { canvas, usersId, ordersId, usersPk, ordersFk } = buildCanvasWithTwoTables();
    const once = addRelationToCanvas(canvas, {
      fromTable: ordersId,
      fromColumn: ordersFk,
      toTable: usersId,
      toColumn: usersPk,
      kind: 'one-to-many',
    });
    expect(() =>
      addRelationToCanvas(once, {
        fromTable: ordersId,
        fromColumn: ordersFk,
        toTable: usersId,
        toColumn: usersPk,
        kind: 'one-to-many',
      }),
    ).toThrow(DomainError);
  });

  it('rejects relations targeting non-existent columns', () => {
    const { canvas, usersId, ordersId, ordersFk } = buildCanvasWithTwoTables();
    expect(() =>
      addRelationToCanvas(canvas, {
        fromTable: ordersId,
        fromColumn: ordersFk,
        toTable: usersId,
        toColumn: 'missing' as ColumnId,
        kind: 'one-to-many',
      }),
    ).toThrow(DomainError);
  });
});

describe('removeRelationFromCanvas', () => {
  it('removes an existing relation by endpoints', () => {
    const { canvas, usersId, ordersId, usersPk, ordersFk } = buildCanvasWithTwoTables();
    const withRelation = addRelationToCanvas(canvas, {
      fromTable: ordersId,
      fromColumn: ordersFk,
      toTable: usersId,
      toColumn: usersPk,
      kind: 'one-to-many',
    });
    const next = removeRelationFromCanvas(withRelation, {
      fromTable: ordersId,
      fromColumn: ordersFk,
      toTable: usersId,
      toColumn: usersPk,
    });
    expect(next.relations).toHaveLength(0);
  });

  it('throws RELATION_NOT_FOUND when endpoints do not match any relation', () => {
    const { canvas, usersId, ordersId, usersPk, ordersFk } = buildCanvasWithTwoTables();
    expect(() =>
      removeRelationFromCanvas(canvas, {
        fromTable: ordersId,
        fromColumn: ordersFk,
        toTable: usersId,
        toColumn: usersPk,
      }),
    ).toThrow(DomainError);
  });
});

describe('renameTableInCanvas', () => {
  it('updates the name of the target table without mutating the previous canvas', () => {
    const { canvas, usersId } = buildCanvasWithTwoTables();
    const next = renameTableInCanvas(canvas, usersId, 'clientes');
    const renamed = next.tables.find((table) => table.id === usersId);
    const original = canvas.tables.find((table) => table.id === usersId);
    expect(renamed?.name).toBe('clientes');
    expect(original?.name).toBe('users');
  });

  it('allows renaming to the exact same name without throwing', () => {
    const { canvas, usersId } = buildCanvasWithTwoTables();
    const next = renameTableInCanvas(canvas, usersId, 'users');
    const renamed = next.tables.find((table) => table.id === usersId);
    expect(renamed?.name).toBe('users');
  });

  it('throws TABLE_NOT_FOUND when the table does not exist', () => {
    const { canvas } = buildCanvasWithTwoTables();
    expect(() => renameTableInCanvas(canvas, 'missing' as TableId, 'test')).toThrow(DomainError);
  });

  it('rejects duplicate table names', () => {
    const { canvas, usersId } = buildCanvasWithTwoTables();
    expect(() => renameTableInCanvas(canvas, usersId, 'orders')).toThrow(DomainError);
  });
});

describe('moveTableInCanvas', () => {
  it('updates the position of the target table without mutating the previous canvas', () => {
    const { canvas, usersId } = buildCanvasWithTwoTables();
    const next = moveTableInCanvas(canvas, usersId, { x: 123, y: 456 });
    const moved = next.tables.find((table) => table.id === usersId);
    const original = canvas.tables.find((table) => table.id === usersId);
    expect(moved?.position).toEqual({ x: 123, y: 456 });
    expect(original?.position).toEqual({ x: 0, y: 0 });
  });

  it('throws TABLE_NOT_FOUND when the table does not exist', () => {
    const { canvas } = buildCanvasWithTwoTables();
    expect(() => moveTableInCanvas(canvas, 'missing' as TableId, { x: 1, y: 1 })).toThrow(
      DomainError,
    );
  });
});

describe('removeTableFromCanvas', () => {
  it('removes the table and cascades all relations touching it', () => {
    const { canvas, usersId, ordersId, usersPk, ordersFk } = buildCanvasWithTwoTables();
    const withRelation = addRelationToCanvas(canvas, {
      fromTable: ordersId,
      fromColumn: ordersFk,
      toTable: usersId,
      toColumn: usersPk,
      kind: 'one-to-many',
    });
    const next = removeTableFromCanvas(withRelation, usersId);
    expect(next.tables).toHaveLength(1);
    expect(next.tables[0]?.id).toBe(ordersId);
    expect(next.relations).toHaveLength(0);
  });

  it('throws TABLE_NOT_FOUND when the table does not exist', () => {
    const { canvas } = buildCanvasWithTwoTables();
    expect(() => removeTableFromCanvas(canvas, 'missing' as TableId)).toThrow(DomainError);
  });
});

describe('removeColumnFromTable with relations', () => {
  it('rejects removing a column referenced by a relation', () => {
    const { canvas, usersId, ordersId, usersPk, ordersFk } = buildCanvasWithTwoTables();
    const withRelation = addRelationToCanvas(canvas, {
      fromTable: ordersId,
      fromColumn: ordersFk,
      toTable: usersId,
      toColumn: usersPk,
      kind: 'one-to-many',
    });
    expect(() => removeColumnFromTable(withRelation, usersId, usersPk)).toThrow(DomainError);
  });
});
