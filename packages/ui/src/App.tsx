import type { Canvas, SqlType } from '@arqyx/shared';
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type CanvasOption, CanvasSelector } from './features/canvas-selector/canvas-selector.js';
import { erdCanvasToEdges, erdCanvasToNodes } from './features/erd/canvas-to-nodes.js';
import { ConnectionIndicator } from './features/erd/connection-indicator.js';
import { reconcileEdges } from './features/erd/reconcile-edges.js';
import { reconcileNodes } from './features/erd/reconcile-nodes.js';
import { TableNode } from './features/erd/table-node.js';
import { useCanvasWs } from './features/erd/use-canvas-ws.js';
import { flowCanvasToEdges, flowCanvasToNodes } from './features/flow/canvas-to-nodes.js';
import { FlowNode } from './features/flow/flow-node.js';
import { ThemeProvider } from './features/theme/theme-provider.js';
import { ThemeToggle } from './features/theme/theme-toggle.js';

const WS_URL = `ws://${window.location.hostname}:7777/ws`;
const API_URL = `http://${window.location.hostname}:7777/api/canvases`;

const nodeTypes: NodeTypes = {
  table: TableNode,
  flow: FlowNode,
};

export type CanvasHandlers = {
  erd?: {
    onRename?: (tableId: string, newName: string) => void;
    onRemove?: (tableId: string) => void;
    onAddColumn?: (tableId: string, name: string, colType: SqlType) => void;
    onRenameColumn?: (tableId: string, columnId: string, newName: string) => void;
    onEditColumn?: (tableId: string, columnId: string, patch: { colType?: SqlType }) => void;
    onRemoveColumn?: (tableId: string, columnId: string) => void;
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

function toCanvasOption(canvas: Canvas): CanvasOption {
  return { id: canvas.id, name: canvas.name, kind: canvas.kind };
}

export function App() {
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
  const [fetchedCanvasOptions, setFetchedCanvasOptions] = useState<readonly CanvasOption[]>([]);
  const {
    canvas,
    canvases,
    status,
    moveNode,
    addTable,
    renameTable,
    removeTable,
    addColumn,
    renameColumn,
    editColumn,
    removeColumn,
  } = useCanvasWs(WS_URL, selectedCanvasId);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const previousCanvasIdRef = useRef<string | null>(null);

  const canvasOptions = useMemo(() => {
    if (status === 'open') {
      return canvases.map(toCanvasOption);
    }
    if (fetchedCanvasOptions.length > 0) {
      return fetchedCanvasOptions;
    }
    return canvases.map(toCanvasOption);
  }, [status, canvases, fetchedCanvasOptions]);

  useEffect(() => {
    let isMounted = true;

    const fetchCanvases = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { canvases: Canvas[] };
        if (!isMounted) {
          return;
        }
        setFetchedCanvasOptions(payload.canvases.map(toCanvasOption));
      } catch {
        return;
      }
    };

    void fetchCanvases();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSelectedCanvasId((currentCanvasId) => {
      if (currentCanvasId && canvasOptions.some((option) => option.id === currentCanvasId)) {
        return currentCanvasId;
      }
      return canvasOptions[0]?.id ?? null;
    });
  }, [canvasOptions]);

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

  const handleAddColumn = useCallback(
    (tableId: string, name: string, colType: SqlType) => {
      const currentCanvas = canvasRef.current;
      if (currentCanvas?.id) {
        addColumn(currentCanvas.id, tableId, name, colType);
      }
    },
    [addColumn],
  );

  const handleRenameColumn = useCallback(
    (tableId: string, columnId: string, newName: string) => {
      const currentCanvas = canvasRef.current;
      if (currentCanvas?.id) {
        renameColumn(currentCanvas.id, tableId, columnId, newName);
      }
    },
    [renameColumn],
  );

  const handleEditColumn = useCallback(
    (tableId: string, columnId: string, patch: { colType?: SqlType }) => {
      const currentCanvas = canvasRef.current;
      if (currentCanvas?.id) {
        editColumn(currentCanvas.id, tableId, columnId, patch);
      }
    },
    [editColumn],
  );

  const handleRemoveColumn = useCallback(
    (tableId: string, columnId: string) => {
      const currentCanvas = canvasRef.current;
      if (currentCanvas?.id) {
        removeColumn(currentCanvas.id, tableId, columnId);
      }
    },
    [removeColumn],
  );

  useEffect(() => {
    const graph = canvasToGraph(canvas, {
      erd: {
        onRename: handleRename,
        onRemove: handleRemove,
        onAddColumn: handleAddColumn,
        onRenameColumn: handleRenameColumn,
        onEditColumn: handleEditColumn,
        onRemoveColumn: handleRemoveColumn,
      },
    });

    const nextCanvasId = canvas?.id ?? null;
    const switchedCanvas = previousCanvasIdRef.current !== nextCanvasId;
    previousCanvasIdRef.current = nextCanvasId;

    if (switchedCanvas || canvas === null) {
      setNodes(graph.nodes);
      setEdges(graph.edges);
      return;
    }

    setNodes((nds) => reconcileNodes(nds, graph.nodes));
    setEdges((eds) => reconcileEdges(eds, graph.edges));
  }, [
    canvas,
    setNodes,
    setEdges,
    handleRename,
    handleRemove,
    handleAddColumn,
    handleRenameColumn,
    handleEditColumn,
    handleRemoveColumn,
  ]);

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
            <CanvasSelector
              canvases={canvasOptions}
              selectedCanvasId={selectedCanvasId}
              onSelect={setSelectedCanvasId}
            />
            <ConnectionIndicator status={status} />
            <ThemeToggle />
          </div>
        </header>
        <main className="h-[calc(100vh-3rem)] w-full">
          <ReactFlow
            key={canvas?.id ?? 'no-canvas'}
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
