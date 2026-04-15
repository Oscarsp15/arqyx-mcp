import { type CanvasId, DomainError, type FlowEdgeId, type FlowNodeId } from '@arqyx/shared';
import { describe, expect, it } from 'vitest';
import {
  addNodeToFlow,
  connectNodesInFlow,
  createEmptyFlowCanvas,
  removeEdgeFromFlow,
  removeNodeFromFlow,
  updateNodeInFlow,
} from './flow-operations.js';

const canvasId = 'canvas-1' as CanvasId;

function baseCanvas() {
  return createEmptyFlowCanvas(canvasId, 'Proceso de compra');
}

function canvasWithTwoNodes() {
  const a = addNodeToFlow(baseCanvas(), {
    id: 'node-a' as FlowNodeId,
    shape: 'rounded',
    color: 'green',
    label: 'Inicio',
    description: null,
    position: { x: 0, y: 0 },
  });
  return addNodeToFlow(a, {
    id: 'node-b' as FlowNodeId,
    shape: 'rectangle',
    color: 'neutral',
    label: 'Validar carrito',
    description: 'Verifica que el carrito no esté vacío',
    position: { x: 200, y: 0 },
  });
}

describe('createEmptyFlowCanvas', () => {
  it('creates an empty flow canvas', () => {
    const canvas = baseCanvas();
    expect(canvas.kind).toBe('flow');
    expect(canvas.nodes).toEqual([]);
    expect(canvas.edges).toEqual([]);
  });
});

describe('addNodeToFlow', () => {
  it('appends a node preserving previous canvas immutability', () => {
    const canvas = baseCanvas();
    const next = addNodeToFlow(canvas, {
      id: 'node-1' as FlowNodeId,
      shape: 'diamond',
      color: 'amber',
      label: '¿Usuario activo?',
      description: null,
      position: { x: 100, y: 100 },
    });
    expect(next.nodes).toHaveLength(1);
    expect(canvas.nodes).toHaveLength(0);
    expect(next.nodes[0]?.shape).toBe('diamond');
  });
});

describe('updateNodeInFlow', () => {
  it('applies a partial patch to the target node', () => {
    const canvas = canvasWithTwoNodes();
    const next = updateNodeInFlow(canvas, 'node-a' as FlowNodeId, {
      label: 'Comenzar',
      color: 'blue',
    });
    const updated = next.nodes.find((node) => node.id === 'node-a');
    expect(updated?.label).toBe('Comenzar');
    expect(updated?.color).toBe('blue');
    expect(updated?.shape).toBe('rounded');
  });

  it('allows clearing description with null', () => {
    const canvas = canvasWithTwoNodes();
    const next = updateNodeInFlow(canvas, 'node-b' as FlowNodeId, { description: null });
    const updated = next.nodes.find((node) => node.id === 'node-b');
    expect(updated?.description).toBeNull();
  });

  it('throws FLOW_NODE_NOT_FOUND when the node does not exist', () => {
    const canvas = baseCanvas();
    expect(() => updateNodeInFlow(canvas, 'missing' as FlowNodeId, { label: 'x' })).toThrow(
      DomainError,
    );
  });
});

describe('removeNodeFromFlow', () => {
  it('removes a node and cascades any incident edges', () => {
    const withNodes = canvasWithTwoNodes();
    const withEdge = connectNodesInFlow(withNodes, {
      id: 'edge-1' as FlowEdgeId,
      from: 'node-a' as FlowNodeId,
      to: 'node-b' as FlowNodeId,
      label: null,
      style: 'solid',
      arrow: 'single',
    });
    const next = removeNodeFromFlow(withEdge, 'node-a' as FlowNodeId);
    expect(next.nodes).toHaveLength(1);
    expect(next.edges).toHaveLength(0);
  });
});

describe('connectNodesInFlow', () => {
  it('creates an edge between two existing nodes', () => {
    const canvas = canvasWithTwoNodes();
    const next = connectNodesInFlow(canvas, {
      id: 'edge-1' as FlowEdgeId,
      from: 'node-a' as FlowNodeId,
      to: 'node-b' as FlowNodeId,
      label: 'siguiente',
      style: 'solid',
      arrow: 'single',
    });
    expect(next.edges).toHaveLength(1);
    expect(next.edges[0]?.label).toBe('siguiente');
  });

  it('rejects duplicate edges with the same endpoints', () => {
    const canvas = canvasWithTwoNodes();
    const once = connectNodesInFlow(canvas, {
      id: 'edge-1' as FlowEdgeId,
      from: 'node-a' as FlowNodeId,
      to: 'node-b' as FlowNodeId,
      label: null,
      style: 'solid',
      arrow: 'single',
    });
    expect(() =>
      connectNodesInFlow(once, {
        id: 'edge-2' as FlowEdgeId,
        from: 'node-a' as FlowNodeId,
        to: 'node-b' as FlowNodeId,
        label: null,
        style: 'dashed',
        arrow: 'single',
      }),
    ).toThrow(DomainError);
  });

  it('throws FLOW_NODE_NOT_FOUND when endpoints do not exist', () => {
    const canvas = canvasWithTwoNodes();
    expect(() =>
      connectNodesInFlow(canvas, {
        id: 'edge-1' as FlowEdgeId,
        from: 'node-a' as FlowNodeId,
        to: 'missing' as FlowNodeId,
        label: null,
        style: 'solid',
        arrow: 'single',
      }),
    ).toThrow(DomainError);
  });
});

describe('removeEdgeFromFlow', () => {
  it('removes an edge by id', () => {
    const canvas = canvasWithTwoNodes();
    const withEdge = connectNodesInFlow(canvas, {
      id: 'edge-1' as FlowEdgeId,
      from: 'node-a' as FlowNodeId,
      to: 'node-b' as FlowNodeId,
      label: null,
      style: 'solid',
      arrow: 'single',
    });
    const next = removeEdgeFromFlow(withEdge, 'edge-1' as FlowEdgeId);
    expect(next.edges).toHaveLength(0);
  });

  it('throws FLOW_EDGE_NOT_FOUND when the edge does not exist', () => {
    const canvas = baseCanvas();
    expect(() => removeEdgeFromFlow(canvas, 'missing' as FlowEdgeId)).toThrow(DomainError);
  });
});
