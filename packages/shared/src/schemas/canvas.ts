import { z } from 'zod';
import { AwsConnection, AwsService, Vpc } from './aws.js';
import { Relation, Table } from './erd.js';
import { FlowEdge, FlowNode } from './flow.js';
import { CanvasId } from './ids.js';

export const CanvasKind = z.enum(['erd', 'aws', 'flow']);
export type CanvasKind = z.infer<typeof CanvasKind>;

export const ErdCanvas = z.object({
  id: CanvasId,
  kind: z.literal('erd'),
  name: z.string().min(1).max(128),
  tables: z.array(Table).readonly(),
  relations: z.array(Relation).readonly(),
});
export type ErdCanvas = z.infer<typeof ErdCanvas>;

export const AwsCanvas = z.object({
  id: CanvasId,
  kind: z.literal('aws'),
  name: z.string().min(1).max(128),
  vpcs: z.array(Vpc).readonly(),
  services: z.array(AwsService).readonly(),
  connections: z.array(AwsConnection).readonly(),
});
export type AwsCanvas = z.infer<typeof AwsCanvas>;

export const FlowCanvas = z.object({
  id: CanvasId,
  kind: z.literal('flow'),
  name: z.string().min(1).max(128),
  nodes: z.array(FlowNode).readonly(),
  edges: z.array(FlowEdge).readonly(),
});
export type FlowCanvas = z.infer<typeof FlowCanvas>;

export const Canvas = z.discriminatedUnion('kind', [ErdCanvas, AwsCanvas, FlowCanvas]);
export type Canvas = z.infer<typeof Canvas>;
