import { z } from 'zod';
import { Canvas } from './canvas.js';

export const ServerToClientMessage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('canvas:snapshot'), canvas: Canvas }),
  z.object({ type: z.literal('canvas:cleared') }),
]);
export type ServerToClientMessage = z.infer<typeof ServerToClientMessage>;

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
]);
export type ClientToServerMessage = z.infer<typeof ClientToServerMessage>;
