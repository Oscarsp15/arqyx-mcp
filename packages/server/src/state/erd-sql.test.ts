import type { CanvasId, ColumnId, TableId } from '@arqyx/shared';
import { describe, expect, it } from 'vitest';
import {
  addColumnToTable,
  addRelationToCanvas,
  addTableToCanvas,
  createEmptyErdCanvas,
} from './erd-operations.js';
import { generatePostgresDdl } from './erd-sql.js';

describe('generatePostgresDdl', () => {
  const canvasId = 'c1' as CanvasId;

  it('generates a simple table with a primary key', () => {
    let canvas = createEmptyErdCanvas(canvasId, 'Test Canvas');
    canvas = addTableToCanvas(canvas, {
      id: 't1' as TableId,
      name: 'users',
      position: { x: 0, y: 0 },
    });
    canvas = addColumnToTable(canvas, 't1' as TableId, {
      id: 'c1' as ColumnId,
      name: 'id',
      type: 'uuid',
      isPrimaryKey: true,
      isNullable: false,
      isUnique: true,
    });

    const ddl = generatePostgresDdl(canvas);
    expect(ddl).toBe(`CREATE TABLE "users" (\n  "id" UUID PRIMARY KEY\n);`);
  });

  it('generates a table with mixed columns', () => {
    let canvas = createEmptyErdCanvas(canvasId, 'Test Canvas');
    canvas = addTableToCanvas(canvas, {
      id: 't1' as TableId,
      name: 'products',
      position: { x: 0, y: 0 },
    });
    canvas = addColumnToTable(canvas, 't1' as TableId, {
      id: 'c1' as ColumnId,
      name: 'id',
      type: 'int',
      isPrimaryKey: true,
      isNullable: false,
      isUnique: true,
    });
    canvas = addColumnToTable(canvas, 't1' as TableId, {
      id: 'c2' as ColumnId,
      name: 'name',
      type: 'varchar',
      isPrimaryKey: false,
      isNullable: false,
      isUnique: true,
    });
    canvas = addColumnToTable(canvas, 't1' as TableId, {
      id: 'c3' as ColumnId,
      name: 'description',
      type: 'text',
      isPrimaryKey: false,
      isNullable: true,
      isUnique: false,
    });
    canvas = addColumnToTable(canvas, 't1' as TableId, {
      id: 'c4' as ColumnId,
      name: 'metadata',
      type: 'json',
      isPrimaryKey: false,
      isNullable: true,
      isUnique: false,
    });

    const ddl = generatePostgresDdl(canvas);
    const expected = `CREATE TABLE "products" (
  "id" INTEGER PRIMARY KEY,
  "name" VARCHAR NOT NULL UNIQUE,
  "description" TEXT,
  "metadata" JSONB
);`;
    expect(ddl).toBe(expected);
  });

  it('generates tables with foreign key relationships', () => {
    let canvas = createEmptyErdCanvas(canvasId, 'Test Canvas');
    const roleTableId = 't_roles' as TableId;
    const userTableId = 't_users' as TableId;

    canvas = addTableToCanvas(canvas, { id: roleTableId, name: 'roles', position: { x: 0, y: 0 } });
    canvas = addColumnToTable(canvas, roleTableId, {
      id: 'c_role_id' as ColumnId,
      name: 'id',
      type: 'int',
      isPrimaryKey: true,
      isNullable: false,
      isUnique: true,
    });

    canvas = addTableToCanvas(canvas, { id: userTableId, name: 'users', position: { x: 0, y: 0 } });
    canvas = addColumnToTable(canvas, userTableId, {
      id: 'c_user_id' as ColumnId,
      name: 'id',
      type: 'uuid',
      isPrimaryKey: true,
      isNullable: false,
      isUnique: true,
    });
    canvas = addColumnToTable(canvas, userTableId, {
      id: 'c_user_role' as ColumnId,
      name: 'role_id',
      type: 'int',
      isPrimaryKey: false,
      isNullable: false,
      isUnique: false,
    });

    canvas = addRelationToCanvas(canvas, {
      fromTable: userTableId,
      fromColumn: 'c_user_role' as ColumnId,
      toTable: roleTableId,
      toColumn: 'c_role_id' as ColumnId,
      kind: 'one-to-many',
    });

    const ddl = generatePostgresDdl(canvas);
    const expected = `CREATE TABLE "roles" (
  "id" INTEGER PRIMARY KEY
);

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY,
  "role_id" INTEGER NOT NULL,
  FOREIGN KEY ("role_id") REFERENCES "roles" ("id")
);`;
    expect(ddl).toBe(expected);
  });
});
