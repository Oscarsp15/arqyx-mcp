import { z } from 'zod';
import { Canvas } from './canvas.js';
import { SqlType } from './erd.js';

export const ServerToClientMessage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('canvas:snapshot'), canvas: Canvas }),
  z.object({ type: z.literal('canvas:cleared') }),
]);
export type ServerToClientMessage = z.infer<typeof ServerToClientMessage>;

const columnNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/);

export const ClientToServerMessage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hello') }),
  z.object({
    type: z.literal('node:moved'),
    canvasId: z.string().min(1),
    nodeId: z.string().min(1),
    position: z.object({ x: z.number(), y: z.number() }),
  }),
  z.object({
    type: z.literal('erd:table:add'),
    canvasId: z.string().min(1),
    name: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
    position: z.object({ x: z.number(), y: z.number() }),
  }),
  z.object({
    type: z.literal('erd:table:rename'),
    canvasId: z.string().min(1),
    tableId: z.string().min(1),
    newName: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  }),
  z.object({
    type: z.literal('erd:table:remove'),
    canvasId: z.string().min(1),
    tableId: z.string().min(1),
  }),
  z.object({
    type: z.literal('erd:column:add'),
    canvasId: z.string().min(1),
    tableId: z.string().min(1),
    name: columnNameSchema,
    colType: SqlType,
    isPrimaryKey: z.boolean().default(false),
    isNullable: z.boolean().default(true),
    isUnique: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('erd:column:rename'),
    canvasId: z.string().min(1),
    tableId: z.string().min(1),
    columnId: z.string().min(1),
    newName: columnNameSchema,
  }),
  z.object({
    type: z.literal('erd:column:edit'),
    canvasId: z.string().min(1),
    tableId: z.string().min(1),
    columnId: z.string().min(1),
    colType: SqlType.optional(),
    isPrimaryKey: z.boolean().optional(),
    isNullable: z.boolean().optional(),
    isUnique: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('erd:column:remove'),
    canvasId: z.string().min(1),
    tableId: z.string().min(1),
    columnId: z.string().min(1),
  }),
]);
export type ClientToServerMessage = z.infer<typeof ClientToServerMessage>;
