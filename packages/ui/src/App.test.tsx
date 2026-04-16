import { type Canvas, Canvas as CanvasSchema } from '@arqyx/shared';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.js';

const mockUseCanvasWs = vi.fn();

vi.mock('./features/erd/use-canvas-ws.js', () => ({
  useCanvasWs: (url: string, selectedCanvasId: string | null) =>
    mockUseCanvasWs(url, selectedCanvasId),
}));

vi.mock('./features/theme/theme-provider.js', () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('./features/theme/theme-toggle.js', () => ({
  ThemeToggle: () => <span>theme</span>,
}));

vi.mock('./features/erd/connection-indicator.js', () => ({
  ConnectionIndicator: () => <span>ws</span>,
}));

vi.mock('./features/erd/table-node.js', () => ({
  TableNode: () => null,
}));

vi.mock('./features/flow/flow-node.js', () => ({
  FlowNode: () => null,
}));

vi.mock('@xyflow/react', async () => {
  const React = await import('react');
  return {
    ReactFlow: ({
      nodes,
      children,
    }: { nodes: Array<{ id: string; data?: { label?: string } }>; children: ReactNode }) => (
      <div>
        <div data-testid="graph-labels">
          {nodes.map((node) => node.data?.label ?? node.id).join('|')}
        </div>
        {children}
      </div>
    ),
    useNodesState: (initialNodes: Array<unknown>) => {
      const [nodes, setNodes] = React.useState(initialNodes);
      return [nodes, setNodes, () => {}] as const;
    },
    useEdgesState: (initialEdges: Array<unknown>) => {
      const [edges, setEdges] = React.useState(initialEdges);
      return [edges, setEdges, () => {}] as const;
    },
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
    Panel: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
});

const canvasOne: Canvas = CanvasSchema.parse({
  id: 'canvas-1',
  kind: 'erd',
  name: 'Ventas',
  tables: [
    {
      id: 'table-1',
      name: 'clientes',
      columns: [],
      position: { x: 0, y: 0 },
    },
  ],
  relations: [],
});

const canvasTwo: Canvas = CanvasSchema.parse({
  id: 'canvas-2',
  kind: 'erd',
  name: 'Facturacion',
  tables: [
    {
      id: 'table-2',
      name: 'facturas',
      columns: [],
      position: { x: 0, y: 0 },
    },
  ],
  relations: [],
});

beforeEach(() => {
  const wsCanvases: readonly Canvas[] = [canvasOne, canvasTwo];
  const moveNode = vi.fn();
  const addTable = vi.fn();
  const renameTable = vi.fn();
  const removeTable = vi.fn();

  mockUseCanvasWs.mockImplementation((_url: string, selectedCanvasId: string | null) => ({
    canvas: selectedCanvasId === 'canvas-2' ? canvasTwo : canvasOne,
    canvases: wsCanvases,
    status: 'open',
    moveNode,
    addTable,
    renameTable,
    removeTable,
  }));

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ canvases: [canvasOne, canvasTwo] }),
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  mockUseCanvasWs.mockReset();
});

describe('App', () => {
  it('updates the rendered graph when the selected canvas changes', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('graph-labels').textContent).toContain('clientes');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lienzo' }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'ERD · Facturacion' }));

    await waitFor(() => {
      expect(screen.getByTestId('graph-labels').textContent).toContain('facturas');
    });
  });
});
