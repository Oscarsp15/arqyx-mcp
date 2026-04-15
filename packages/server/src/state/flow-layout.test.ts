import type { CanvasId, FlowEdgeId, FlowNodeId } from '@arqyx/shared';
import { describe, expect, it } from 'vitest';
import { applyAutoLayout } from './flow-layout.js';
import { addNodeToFlow, connectNodesInFlow, createEmptyFlowCanvas } from './flow-operations.js';

function canvasWithTwoConnectedNodes() {
  const base = createEmptyFlowCanvas('canvas-1' as CanvasId, 'Proceso');
  const withA = addNodeToFlow(base, {
    id: 'node-a' as FlowNodeId,
    shape: 'rounded',
    color: 'green',
    label: 'Inicio',
    description: null,
    position: { x: 0, y: 0 },
  });
  const withB = addNodeToFlow(withA, {
    id: 'node-b' as FlowNodeId,
    shape: 'rectangle',
    color: 'neutral',
    label: 'Paso',
    description: null,
    position: { x: 0, y: 0 },
  });
  return connectNodesInFlow(withB, {
    id: 'edge-1' as FlowEdgeId,
    from: 'node-a' as FlowNodeId,
    to: 'node-b' as FlowNodeId,
    label: null,
    style: 'solid',
    arrow: 'single',
  });
}

describe('applyAutoLayout', () => {
  it('is a no-op for empty canvases', () => {
    const empty = createEmptyFlowCanvas('canvas-1' as CanvasId, 'Vacío');
    expect(applyAutoLayout(empty, 'LR').nodes).toEqual([]);
  });

  it('LR direction positions downstream nodes to the right of upstream nodes', () => {
    const canvas = canvasWithTwoConnectedNodes();
    const laid = applyAutoLayout(canvas, 'LR');
    const a = laid.nodes.find((node) => node.id === 'node-a');
    const b = laid.nodes.find((node) => node.id === 'node-b');
    if (!a || !b) throw new Error('nodes missing after layout');
    expect(b.position.x).toBeGreaterThan(a.position.x);
  });

  it('TB direction positions downstream nodes below upstream nodes', () => {
    const canvas = canvasWithTwoConnectedNodes();
    const laid = applyAutoLayout(canvas, 'TB');
    const a = laid.nodes.find((node) => node.id === 'node-a');
    const b = laid.nodes.find((node) => node.id === 'node-b');
    if (!a || !b) throw new Error('nodes missing after layout');
    expect(b.position.y).toBeGreaterThan(a.position.y);
  });

  it('radial places the first node at the origin and the rest around it', () => {
    const base = createEmptyFlowCanvas('canvas-1' as CanvasId, 'Mapa');
    const withCenter = addNodeToFlow(base, {
      id: 'center' as FlowNodeId,
      shape: 'circle',
      color: 'purple',
      label: 'Idea central',
      description: null,
      position: { x: 123, y: 456 },
    });
    const withBranches = ['a', 'b', 'c'].reduce(
      (canvas, id, index) =>
        addNodeToFlow(canvas, {
          id: id as FlowNodeId,
          shape: 'rectangle',
          color: 'blue',
          label: `Rama ${index + 1}`,
          description: null,
          position: { x: 0, y: 0 },
        }),
      withCenter,
    );
    const laid = applyAutoLayout(withBranches, 'radial');
    const center = laid.nodes.find((node) => node.id === 'center');
    expect(center?.position).toEqual({ x: 0, y: 0 });
    const branches = laid.nodes.filter((node) => node.id !== 'center');
    for (const branch of branches) {
      const radius = Math.hypot(branch.position.x, branch.position.y);
      expect(Math.round(radius)).toBeGreaterThan(100);
    }
  });
});
