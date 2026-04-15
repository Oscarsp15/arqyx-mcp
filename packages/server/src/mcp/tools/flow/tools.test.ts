import { DomainError } from '@arqyx/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSequentialGenerator } from '../../../state/id-generator.js';
import { CanvasStore } from '../../../state/store.js';
import type { ToolContext } from '../../tool.js';
import { addFlowNodeTool } from './add-node.js';
import { connectFlowNodesTool } from './connect-nodes.js';
import { createFlowCanvasTool } from './create-canvas.js';
import { removeFlowEdgeTool } from './remove-edge.js';
import { removeFlowNodeTool } from './remove-node.js';
import { updateFlowNodeTool } from './update-node.js';

function createContext(): ToolContext {
  return {
    store: new CanvasStore({
      canvasIdGenerator: createSequentialGenerator('canvas'),
      tableIdGenerator: createSequentialGenerator('tbl'),
      columnIdGenerator: createSequentialGenerator('col'),
      flowNodeIdGenerator: createSequentialGenerator('node'),
      flowEdgeIdGenerator: createSequentialGenerator('edge'),
    }),
    getCanvasUrl: () => 'http://localhost:7777',
  };
}

async function addStartNode(context: ToolContext, canvasId: string) {
  await addFlowNodeTool.handler(
    {
      canvasId,
      label: 'Inicio',
      shape: 'rounded',
      color: 'green',
    },
    context,
  );
  const stored = context.store.get(canvasId as never);
  if (stored?.kind !== 'flow') throw new Error('expected flow canvas');
  return stored.nodes[stored.nodes.length - 1];
}

describe('create_flow_canvas tool', () => {
  it('creates a flow canvas with the given name', async () => {
    const context = createContext();
    const result = await createFlowCanvasTool.handler({ name: 'Proceso de compra' }, context);
    expect(result.content[0]?.text).toContain('Proceso de compra');
    expect(context.store.list()).toHaveLength(1);
  });
});

describe('add_flow_node tool', () => {
  let context: ToolContext;

  beforeEach(() => {
    context = createContext();
  });

  it('adds a node with default color and position', async () => {
    const canvas = context.store.createFlowCanvas('Demo');
    const result = await addFlowNodeTool.handler(
      {
        canvasId: canvas.id,
        label: 'Inicio',
        shape: 'rounded',
      },
      context,
    );
    expect(result.content[0]?.text).toContain('Inicio');
    const stored = context.store.get(canvas.id);
    if (stored?.kind !== 'flow') throw new Error('expected flow');
    expect(stored.nodes).toHaveLength(1);
    expect(stored.nodes[0]?.color).toBe('neutral');
    expect(stored.nodes[0]?.position).toEqual({ x: 0, y: 0 });
  });

  it('accepts custom color and position', async () => {
    const canvas = context.store.createFlowCanvas('Demo');
    await addFlowNodeTool.handler(
      {
        canvasId: canvas.id,
        label: 'Validar',
        shape: 'diamond',
        color: 'amber',
        description: 'Punto de decisión crítico',
        position: { x: 100, y: 50 },
      },
      context,
    );
    const stored = context.store.get(canvas.id);
    if (stored?.kind !== 'flow') throw new Error('expected flow');
    expect(stored.nodes[0]?.color).toBe('amber');
    expect(stored.nodes[0]?.description).toBe('Punto de decisión crítico');
  });

  it('rejects invalid shapes via schema', () => {
    expect(() =>
      addFlowNodeTool.inputSchema.parse({
        canvasId: 'c1',
        label: 'x',
        shape: 'triangle',
      }),
    ).toThrow();
  });
});

describe('update_flow_node tool', () => {
  it('applies a partial patch to an existing node', async () => {
    const context = createContext();
    const canvas = context.store.createFlowCanvas('Demo');
    const node = await addStartNode(context, canvas.id);
    if (!node) throw new Error('node missing');

    await updateFlowNodeTool.handler(
      {
        canvasId: canvas.id,
        nodeId: node.id,
        label: 'Comenzar',
        color: 'blue',
      },
      context,
    );

    const stored = context.store.get(canvas.id);
    if (stored?.kind !== 'flow') throw new Error('expected flow');
    expect(stored.nodes[0]?.label).toBe('Comenzar');
    expect(stored.nodes[0]?.color).toBe('blue');
    expect(stored.nodes[0]?.shape).toBe('rounded');
  });
});

describe('remove_flow_node tool', () => {
  it('removes a node and cascades its edges', async () => {
    const context = createContext();
    const canvas = context.store.createFlowCanvas('Demo');
    const start = await addStartNode(context, canvas.id);
    await addFlowNodeTool.handler(
      { canvasId: canvas.id, label: 'Fin', shape: 'rounded', color: 'red' },
      context,
    );
    const stored = context.store.get(canvas.id);
    if (stored?.kind !== 'flow') throw new Error('expected flow');
    const end = stored.nodes[1];
    if (!start || !end) throw new Error('nodes missing');

    await connectFlowNodesTool.handler(
      { canvasId: canvas.id, from: start.id, to: end.id },
      context,
    );

    await removeFlowNodeTool.handler({ canvasId: canvas.id, nodeId: start.id }, context);

    const after = context.store.get(canvas.id);
    if (after?.kind !== 'flow') throw new Error('expected flow');
    expect(after.nodes).toHaveLength(1);
    expect(after.edges).toHaveLength(0);
  });
});

describe('connect_flow_nodes tool', () => {
  it('creates an edge with defaults solid + single', async () => {
    const context = createContext();
    const canvas = context.store.createFlowCanvas('Demo');
    const start = await addStartNode(context, canvas.id);
    await addFlowNodeTool.handler(
      { canvasId: canvas.id, label: 'Fin', shape: 'rounded', color: 'red' },
      context,
    );
    const stored = context.store.get(canvas.id);
    if (stored?.kind !== 'flow') throw new Error('expected flow');
    const end = stored.nodes[1];
    if (!start || !end) throw new Error('nodes missing');

    await connectFlowNodesTool.handler(
      { canvasId: canvas.id, from: start.id, to: end.id },
      context,
    );
    const after = context.store.get(canvas.id);
    if (after?.kind !== 'flow') throw new Error('expected flow');
    expect(after.edges).toHaveLength(1);
    expect(after.edges[0]?.style).toBe('solid');
    expect(after.edges[0]?.arrow).toBe('single');
  });

  it('rejects connections with missing nodes', async () => {
    const context = createContext();
    const canvas = context.store.createFlowCanvas('Demo');
    await expect(
      connectFlowNodesTool.handler(
        { canvasId: canvas.id, from: 'missing', to: 'also-missing' },
        context,
      ),
    ).rejects.toThrow(DomainError);
  });
});

describe('remove_flow_edge tool', () => {
  it('removes an existing edge by id', async () => {
    const context = createContext();
    const canvas = context.store.createFlowCanvas('Demo');
    const start = await addStartNode(context, canvas.id);
    await addFlowNodeTool.handler(
      { canvasId: canvas.id, label: 'Fin', shape: 'rounded', color: 'red' },
      context,
    );
    const stored = context.store.get(canvas.id);
    if (stored?.kind !== 'flow') throw new Error('expected flow');
    const end = stored.nodes[1];
    if (!start || !end) throw new Error('nodes missing');

    await connectFlowNodesTool.handler(
      { canvasId: canvas.id, from: start.id, to: end.id },
      context,
    );
    const withEdge = context.store.get(canvas.id);
    if (withEdge?.kind !== 'flow') throw new Error('expected flow');
    const edgeId = withEdge.edges[0]?.id;
    if (!edgeId) throw new Error('edge id missing');

    await removeFlowEdgeTool.handler({ canvasId: canvas.id, edgeId }, context);

    const after = context.store.get(canvas.id);
    if (after?.kind !== 'flow') throw new Error('expected flow');
    expect(after.edges).toHaveLength(0);
  });
});
