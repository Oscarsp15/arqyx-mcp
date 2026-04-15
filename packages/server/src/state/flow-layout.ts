import type { FlowCanvas, FlowNodeShape } from '@arqyx/shared';
import dagre from '@dagrejs/dagre';

export type LayoutDirection = 'TB' | 'LR' | 'radial';

const NODE_WIDTH_BY_SHAPE: Record<FlowNodeShape, number> = {
  rectangle: 220,
  rounded: 220,
  diamond: 180,
  circle: 140,
  note: 220,
};

const NODE_HEIGHT_BY_SHAPE: Record<FlowNodeShape, number> = {
  rectangle: 90,
  rounded: 90,
  diamond: 120,
  circle: 140,
  note: 110,
};

export function applyAutoLayout(canvas: FlowCanvas, direction: LayoutDirection): FlowCanvas {
  if (canvas.nodes.length === 0) return canvas;

  if (direction === 'radial') {
    return layoutRadial(canvas);
  }
  return layoutWithDagre(canvas, direction);
}

function layoutWithDagre(canvas: FlowCanvas, direction: 'TB' | 'LR'): FlowCanvas {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 60, marginx: 40, marginy: 40 });

  for (const node of canvas.nodes) {
    graph.setNode(node.id, {
      width: NODE_WIDTH_BY_SHAPE[node.shape],
      height: NODE_HEIGHT_BY_SHAPE[node.shape],
    });
  }

  for (const edge of canvas.edges) {
    graph.setEdge(edge.from, edge.to);
  }

  dagre.layout(graph);

  return {
    ...canvas,
    nodes: canvas.nodes.map((node) => {
      const positioned = graph.node(node.id);
      if (!positioned) return node;
      return {
        ...node,
        position: {
          x: positioned.x - NODE_WIDTH_BY_SHAPE[node.shape] / 2,
          y: positioned.y - NODE_HEIGHT_BY_SHAPE[node.shape] / 2,
        },
      };
    }),
  };
}

function layoutRadial(canvas: FlowCanvas): FlowCanvas {
  const [center, ...others] = canvas.nodes;
  if (!center) return canvas;

  const centerPosition = { x: 0, y: 0 };
  const radius = 320;
  const count = others.length;

  const positioned = canvas.nodes.map((node, index) => {
    if (index === 0) {
      return { ...node, position: centerPosition };
    }
    const angleIndex = index - 1;
    const angle = (angleIndex / count) * Math.PI * 2 - Math.PI / 2;
    return {
      ...node,
      position: {
        x: Math.round(Math.cos(angle) * radius),
        y: Math.round(Math.sin(angle) * radius),
      },
    };
  });

  return {
    ...canvas,
    nodes: positioned,
  };
}
