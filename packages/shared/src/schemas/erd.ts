import { z } from 'zod';
import { ColumnId, TableId } from './ids.js';

export const SqlType = z.enum([
  'uuid',
  'int',
  'bigint',
  'text',
  'varchar',
  'boolean',
  'timestamp',
  'date',
  'numeric',
  'json',
]);
export type SqlType = z.infer<typeof SqlType>;

export const Column = z.object({
  id: ColumnId,
  name: z.string().min(1).max(64),
  type: SqlType,
  isPrimaryKey: z.boolean(),
  isNullable: z.boolean(),
  isUnique: z.boolean(),
});
export type Column = z.infer<typeof Column>;

export const Table = z.object({
  id: TableId,
  name: z.string().min(1).max(64),
  columns: z.array(Column).readonly(),
  position: z.object({ x: z.number(), y: z.number() }),
});
export type Table = z.infer<typeof Table>;

export const RelationKind = z.enum(['one-to-one', 'one-to-many', 'many-to-many']);
export type RelationKind = z.infer<typeof RelationKind>;

export const Relation = z.object({
  fromTable: TableId,
  fromColumn: ColumnId,
  toTable: TableId,
  toColumn: ColumnId,
  kind: RelationKind,
});
export type Relation = z.infer<typeof Relation>;
