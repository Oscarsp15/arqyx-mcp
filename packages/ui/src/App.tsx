import {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect } from 'react';
import {
  type ErdNode,
  erdCanvasToEdges,
  erdCanvasToNodes,
} from './features/erd/canvas-to-nodes.js';
import { ConnectionIndicator } from './features/erd/connection-indicator.js';
import { TableNode } from './features/erd/table-node.js';
import { useCanvasWs } from './features/erd/use-canvas-ws.js';
import { ThemeProvider } from './features/theme/theme-provider.js';
import { ThemeToggle } from './features/theme/theme-toggle.js';

const WS_URL = `ws://${window.location.hostname}:7777/ws`;

const nodeTypes: NodeTypes = { table: TableNode };

export function App() {
  const { canvas, status, moveNode } = useCanvasWs(WS_URL);
  const [nodes, setNodes, onNodesChange] = useNodesState<ErdNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (canvas?.kind === 'erd') {
      setNodes(erdCanvasToNodes(canvas));
      setEdges(erdCanvasToEdges(canvas));
      return;
    }
    setNodes([]);
    setEdges([]);
  }, [canvas, setNodes, setEdges]);

  return (
    <ThemeProvider>
      <div className="h-screen w-screen">
        <header className="flex h-12 items-center justify-between border-border border-b px-4">
          <h1 className="font-medium text-sm">Arqyx</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-xs">
              {canvas ? canvas.name : 'Sin lienzo'}
            </span>
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
          </ReactFlow>
        </main>
      </div>
    </ThemeProvider>
  );
}
