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
import { useCallback, useEffect, useRef } from 'react';
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

  // Ref para acceder al canvas actual desde closures sin stale values
  const canvasRef = useRef<Canvas | null>(null);
  canvasRef.current = canvas;

  // Handlers estables que siempre acceden al canvas actual via ref
  const handleRename = useCallback(
    (tableId: string, newName: string) => {
      const currentCanvas = canvasRef.current;
      if (currentCanvas?.id) {
        renameTable(currentCanvas.id, tableId, newName);
      }
    },
    [renameTable],
  );

  const handleRemove = useCallback(
    (tableId: string) => {
      const currentCanvas = canvasRef.current;
      if (currentCanvas?.id) {
        removeTable(currentCanvas.id, tableId);
      }
    },
    [removeTable],
  );

  useEffect(() => {
    const graph = canvasToGraph(canvas, {
      erd: {
        onRename: handleRename,
        onRemove: handleRemove,
      },
    });

    // Sincronización inteligente: mezclamos data y position conservando las
    // propiedades internas de React Flow (measured, dragging, etc.) para evitar "ghost nodes".
    setNodes((nds) => {
      const serverNodes = graph.nodes;

      return serverNodes.map((serverNode) => {
        const localNode = nds.find((n) => n.id === serverNode.id);
        if (!localNode) return serverNode;

        // Comparamos propiedades para detectar cambios reales del servidor
        const dataA = localNode.data as Record<string, unknown>;
        const dataB = serverNode.data as Record<string, unknown>;

        const labelChanged = dataA['label'] !== dataB['label'];
        const posChanged =
          localNode.position.x !== serverNode.position.x ||
          localNode.position.y !== serverNode.position.y;

        // Detección de cambios específicos por tipo de nodo
        let specificChanged = false;
        if (serverNode.type === 'table') {
          // Para tablas ERD, comparamos las columnas
          specificChanged = JSON.stringify(dataA['columns']) !== JSON.stringify(dataB['columns']);
        } else if (serverNode.type === 'flow') {
          // Para nodos Flow, comparamos forma, color y descripción
          specificChanged =
            dataA['shape'] !== dataB['shape'] ||
            dataA['color'] !== dataB['color'] ||
            dataA['description'] !== dataB['description'];
        }

        if (labelChanged || posChanged || specificChanged) {
          // Fusionamos: el servidor manda en data y position, pero mantenemos el resto (measured, etc.)
          return {
            ...localNode,
            data: serverNode.data,
            position: serverNode.position,
          };
        }
        return localNode;
      });
    });

    setEdges(graph.edges);
  }, [canvas, setNodes, setEdges, handleRename, handleRemove]);

  const handleAddTable = useCallback(() => {
    const currentCanvas = canvasRef.current;
    if (!currentCanvas || currentCanvas.kind !== 'erd') return;
    let index = 1;
    let name = `nueva_tabla_${index}`;
    while (currentCanvas.tables.some((t) => t.name === name)) {
      index++;
      name = `nueva_tabla_${index}`;
    }
    const x = Math.floor(Math.random() * 200);
    const y = Math.floor(Math.random() * 200);
    addTable(currentCanvas.id, name, { x, y });
  }, [addTable]);

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
