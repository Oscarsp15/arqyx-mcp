import type { FlowCanvas, FlowEdgeStyle } from '@arqyx/shared';
import type { Edge, Node } from '@xyflow/react';
import type { FlowNodeData } from './flow-node.js';

export type FlowReactFlowNode = Node<FlowNodeData, 'flow'>;

export function flowCanvasToNodes(canvas: FlowCanvas): FlowReactFlowNode[] {
  return canvas.nodes.map((node) => ({
    id: node.id,
    type: 'flow',
    position: node.position,
    data: {
      label: node.label,
      shape: node.shape,
      color: node.color,
      description: node.description,
    },
  }));
}

export function flowCanvasToEdges(canvas: FlowCanvas): Edge[] {
  return canvas.edges.map((edge) => {
    const base: Edge = {
      id: edge.id,
      source: edge.from,
      target: edge.to,
      animated: edge.style === 'dashed',
      style: edgeStyleToCss(edge.style),
    };
    if (edge.label !== null) base.label = edge.label;
    if (edge.arrow !== 'none') base.markerEnd = 'url(#arrow-end)';
    if (edge.arrow === 'double') base.markerStart = 'url(#arrow-start)';
    return base;
  });
}

function edgeStyleToCss(style: FlowEdgeStyle): Record<string, string | number> {
  switch (style) {
    case 'solid':
      return { strokeWidth: 2 };
    case 'dashed':
      return { strokeWidth: 2, strokeDasharray: '6 4' };
    case 'dotted':
      return { strokeWidth: 2, strokeDasharray: '2 4' };
    default: {
      const exhaustive: never = style;
      return exhaustive;
    }
  }
}
