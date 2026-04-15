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
]);
export type ClientToServerMessage = z.infer<typeof ClientToServerMessage>;
