import { z } from 'zod';

const brandedId = <B extends string>(_brand: B) => z.string().min(1).brand<B>();

export const NodeId = brandedId('NodeId');
export type NodeId = z.infer<typeof NodeId>;

export const EdgeId = brandedId('EdgeId');
export type EdgeId = z.infer<typeof EdgeId>;

export const TableId = brandedId('TableId');
export type TableId = z.infer<typeof TableId>;

export const ColumnId = brandedId('ColumnId');
export type ColumnId = z.infer<typeof ColumnId>;

export const AwsServiceId = brandedId('AwsServiceId');
export type AwsServiceId = z.infer<typeof AwsServiceId>;

export const VpcId = brandedId('VpcId');
export type VpcId = z.infer<typeof VpcId>;

export const CanvasId = brandedId('CanvasId');
export type CanvasId = z.infer<typeof CanvasId>;

export const FlowNodeId = brandedId('FlowNodeId');
export type FlowNodeId = z.infer<typeof FlowNodeId>;

export const FlowEdgeId = brandedId('FlowEdgeId');
export type FlowEdgeId = z.infer<typeof FlowEdgeId>;
