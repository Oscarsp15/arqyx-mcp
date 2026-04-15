import type { Canvas } from '@arqyx/shared';
import {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Panel } from '@xyflow/react';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { erdCanvasToEdges, erdCanvasToNodes } from './features/erd/canvas-to-nodes.js';
import { ConnectionIndicator } from './features/erd/connection-indicator.js';
import { TableNode } from './features/erd/table-node.js';
import { useCanvasWs } from './features/erd/use-canvas-ws.js';
import { flowCanvasToEdges, flowCanvasToNodes } from './features/flow/canvas-to-nodes.js';
import { FlowNode } from './features/flow/flow-node.js';
import { ThemeProvider } from './features/theme/theme-provider.js';
import { ThemeToggle } from './features/theme/theme-toggle.js';

const WS_URL = `ws://${window.location.hostname}:7777/ws`;

const nodeTypes: NodeTypes = {
  table: TableNode,
  flow: FlowNode,
};

export type CanvasHandlers = {
  erd?: {
    onRename?: (tableId: string, newName: string) => void;
    onRemove?: (tableId: string) => void;
  };
};

function canvasToGraph(
  canvas: Canvas | null,
  handlers?: CanvasHandlers,
): { nodes: Node[]; edges: Edge[] } {
  if (canvas === null) return { nodes: [], edges: [] };
  switch (canvas.kind) {
    case 'erd':
      return { nodes: erdCanvasToNodes(canvas, handlers?.erd), edges: erdCanvasToEdges(canvas) };
    case 'flow':
      return { nodes: flowCanvasToNodes(canvas), edges: flowCanvasToEdges(canvas) };
    case 'aws':
      return { nodes: [], edges: [] };
    default: {
      const exhaustive: never = canvas;
      return exhaustive;
    }
  }
}

function canvasKindLabel(canvas: Canvas | null): string {
  if (canvas === null) return 'Sin lienzo';
  switch (canvas.kind) {
    case 'erd':
      return `ERD · ${canvas.name}`;
    case 'flow':
      return `Flow · ${canvas.name}`;
    case 'aws':
      return `AWS · ${canvas.name}`;
    default: {
      const exhaustive: never = canvas;
      return exhaustive;
    }
  }
}

export function App() {
  const { canvas, status, moveNode, addTable, renameTable, removeTable } = useCanvasWs(WS_URL);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const graph = canvasToGraph(canvas, {
      erd: {
        onRename: (tableId, newName) => {
          if (canvas?.id) renameTable(canvas.id, tableId, newName);
        },
        onRemove: (tableId) => {
          if (canvas?.id) removeTable(canvas.id, tableId);
        },
      },
    });
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [canvas, setNodes, setEdges, renameTable, removeTable]);

  const handleAddTable = () => {
    if (!canvas || canvas.kind !== 'erd') return;
    let index = 1;
    let name = `nueva_tabla_${index}`;
    while (canvas.tables.some((t) => t.name === name)) {
      index++;
      name = `nueva_tabla_${index}`;
    }
    const x = Math.floor(Math.random() * 200);
    const y = Math.floor(Math.random() * 200);
    addTable(canvas.id, name, { x, y });
  };

  return (
    <ThemeProvider>
      <div className="h-screen w-screen">
        <header className="flex h-12 items-center justify-between border-border border-b px-4">
          <h1 className="font-medium text-sm">Arqyx</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-xs">{canvasKindLabel(canvas)}</span>
            <ConnectionIndicator status={status} />
            <ThemeToggle />
          </div>
        </header>
        <main className="h-[calc(100vh-3rem)] w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={(_event, node) => {
              if (!canvas) return;
              moveNode(canvas.id, node.id, node.position);
            }}
            fitView
          >
            <Background />
            <Controls aria-label="Controles del lienzo" />
            <MiniMap pannable zoomable ariaLabel="Minimapa: vista general del lienzo" />
            {canvas?.kind === 'erd' && (
              <Panel position="top-right">
                <button
                  type="button"
                  onClick={handleAddTable}
                  className="flex cursor-pointer items-center gap-2 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4" />
                  Añadir Tabla
                </button>
              </Panel>
            )}
          </ReactFlow>
        </main>
      </div>
    </ThemeProvider>
  );
}
