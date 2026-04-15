import {
  DomainError,
  type FlowCanvas,
  type FlowEdge,
  type FlowEdgeArrow,
  type FlowEdgeId,
  type FlowEdgeStyle,
  type FlowNode,
  type FlowNodeColor,
  type FlowNodeId,
  type FlowNodeShape,
} from '@arqyx/shared';

export type NewFlowNodeInput = {
  id: FlowNodeId;
  shape: FlowNodeShape;
  color: FlowNodeColor;
  label: string;
  description: string | null;
  position: { x: number; y: number };
};

export type FlowNodePatch = {
  shape?: FlowNodeShape;
  color?: FlowNodeColor;
  label?: string;
  description?: string | null;
  position?: { x: number; y: number };
};

export type NewFlowEdgeInput = {
  id: FlowEdgeId;
  from: FlowNodeId;
  to: FlowNodeId;
  label: string | null;
  style: FlowEdgeStyle;
  arrow: FlowEdgeArrow;
};

export function createEmptyFlowCanvas(id: FlowCanvas['id'], name: string): FlowCanvas {
  return {
    id,
    kind: 'flow',
    name,
    nodes: [],
    edges: [],
  };
}

export function addNodeToFlow(canvas: FlowCanvas, input: NewFlowNodeInput): FlowCanvas {
  const node: FlowNode = {
    id: input.id,
    shape: input.shape,
    color: input.color,
    label: input.label,
    description: input.description,
    position: input.position,
  };
  return {
    ...canvas,
    nodes: [...canvas.nodes, node],
  };
}

export function updateNodeInFlow(
  canvas: FlowCanvas,
  nodeId: FlowNodeId,
  patch: FlowNodePatch,
): FlowCanvas {
  requireFlowNode(canvas, nodeId);
  return {
    ...canvas,
    nodes: canvas.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            ...(patch.shape !== undefined ? { shape: patch.shape } : {}),
            ...(patch.color !== undefined ? { color: patch.color } : {}),
            ...(patch.label !== undefined ? { label: patch.label } : {}),
            ...(patch.description !== undefined ? { description: patch.description } : {}),
            ...(patch.position !== undefined ? { position: patch.position } : {}),
          }
        : node,
    ),
  };
}

export function removeNodeFromFlow(canvas: FlowCanvas, nodeId: FlowNodeId): FlowCanvas {
  requireFlowNode(canvas, nodeId);
  return {
    ...canvas,
    nodes: canvas.nodes.filter((node) => node.id !== nodeId),
    edges: canvas.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
  };
}

export function connectNodesInFlow(canvas: FlowCanvas, input: NewFlowEdgeInput): FlowCanvas {
  requireFlowNode(canvas, input.from);
  requireFlowNode(canvas, input.to);

  const alreadyExists = canvas.edges.some(
    (edge) => edge.from === input.from && edge.to === input.to,
  );
  if (alreadyExists) {
    throw new DomainError(
      'FLOW_EDGE_DUPLICATE',
      'Ya existe una conexión entre esos dos nodos en este lienzo.',
    );
  }

  const edge: FlowEdge = {
    id: input.id,
    from: input.from,
    to: input.to,
    label: input.label,
    style: input.style,
    arrow: input.arrow,
  };

  return {
    ...canvas,
    edges: [...canvas.edges, edge],
  };
}

export function removeEdgeFromFlow(canvas: FlowCanvas, edgeId: FlowEdgeId): FlowCanvas {
  const exists = canvas.edges.some((edge) => edge.id === edgeId);
  if (!exists) {
    throw new DomainError(
      'FLOW_EDGE_NOT_FOUND',
      'No se encontró la conexión solicitada.',
    );
  }
  return {
    ...canvas,
    edges: canvas.edges.filter((edge) => edge.id !== edgeId),
  };
}

function requireFlowNode(canvas: FlowCanvas, nodeId: FlowNodeId): FlowNode {
  const node = canvas.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) {
    throw new DomainError('FLOW_NODE_NOT_FOUND', 'No se encontró el nodo solicitado.');
  }
  return node;
}
