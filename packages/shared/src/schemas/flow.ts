import { z } from 'zod';
import { FlowEdgeId, FlowNodeId } from './ids.js';

export const FlowNodeShape = z.enum(['rectangle', 'rounded', 'diamond', 'circle', 'note']);
export type FlowNodeShape = z.infer<typeof FlowNodeShape>;

export const FlowNodeColor = z.enum([
  'neutral',
  'blue',
  'green',
  'amber',
  'red',
  'purple',
]);
export type FlowNodeColor = z.infer<typeof FlowNodeColor>;

export const FlowNode = z.object({
  id: FlowNodeId,
  shape: FlowNodeShape,
  color: FlowNodeColor,
  label: z.string().min(1).max(128),
  description: z.string().max(1024).nullable(),
  position: z.object({ x: z.number(), y: z.number() }),
});
export type FlowNode = z.infer<typeof FlowNode>;

export const FlowEdgeStyle = z.enum(['solid', 'dashed', 'dotted']);
export type FlowEdgeStyle = z.infer<typeof FlowEdgeStyle>;

export const FlowEdgeArrow = z.enum(['none', 'single', 'double']);
export type FlowEdgeArrow = z.infer<typeof FlowEdgeArrow>;

export const FlowEdge = z.object({
  id: FlowEdgeId,
  from: FlowNodeId,
  to: FlowNodeId,
  label: z.string().max(128).nullable(),
  style: FlowEdgeStyle,
  arrow: FlowEdgeArrow,
});
export type FlowEdge = z.infer<typeof FlowEdge>;
