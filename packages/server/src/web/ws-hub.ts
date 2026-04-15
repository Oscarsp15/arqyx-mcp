import type { Server as HttpServer } from 'node:http';
import {
  type CanvasId,
  ClientToServerMessage,
  DomainError,
  type FlowNodeId,
  type ServerToClientMessage,
  type TableId,
} from '@arqyx/shared';
import { WebSocket, WebSocketServer } from 'ws';
import type { CanvasStore } from '../state/store.js';

export type WsHub = {
  close: () => Promise<void>;
};

export function attachWsHub(httpServer: HttpServer, store: CanvasStore): WsHub {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const broadcast = (message: ServerToClientMessage) => {
    const payload = JSON.stringify(message);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  };

  const unsubscribe = store.on((event) => {
    if (event.type === 'canvas:created' || event.type === 'canvas:updated') {
      broadcast({ type: 'canvas:snapshot', canvas: event.canvas });
    }
  });

  wss.on('connection', (socket) => {
    for (const canvas of store.list()) {
      const message: ServerToClientMessage = { type: 'canvas:snapshot', canvas };
      socket.send(JSON.stringify(message));
    }

    socket.on('message', (raw) => {
      const text = typeof raw === 'string' ? raw : raw.toString();
      try {
        const json = JSON.parse(text) as unknown;
        const parsed = ClientToServerMessage.safeParse(json);
        if (!parsed.success) return;
        if (parsed.data.type === 'node:moved') {
          dispatchNodeMoved(store, parsed.data.canvasId, parsed.data.nodeId, parsed.data.position);
          return;
        }
        if (parsed.data.type === 'erd:table:add') {
          store.addTable(parsed.data.canvasId as CanvasId, {
            name: parsed.data.name,
            position: parsed.data.position,
          });
          return;
        }
        if (parsed.data.type === 'erd:table:rename') {
          store.renameTable(
            parsed.data.canvasId as CanvasId,
            parsed.data.tableId as TableId,
            parsed.data.newName,
          );
          return;
        }
        if (parsed.data.type === 'erd:table:remove') {
          store.removeTable(parsed.data.canvasId as CanvasId, parsed.data.tableId as TableId);
          return;
        }
      } catch (error) {
        if (error instanceof DomainError) return;
        if (error instanceof SyntaxError) return;
        throw error;
      }
    });
  });

  return {
    close: async () => {
      unsubscribe();
      await new Promise<void>((resolve, reject) => {
        wss.close((closeError) => (closeError ? reject(closeError) : resolve()));
      });
    },
  };
}

function dispatchNodeMoved(
  store: CanvasStore,
  canvasId: string,
  nodeId: string,
  position: { x: number; y: number },
): void {
  const canvas = store.get(canvasId as CanvasId);
  if (!canvas) return;
  if (canvas.kind === 'erd') {
    store.moveTable(canvasId as CanvasId, nodeId as TableId, position);
    return;
  }
  if (canvas.kind === 'flow') {
    store.updateFlowNode(canvasId as CanvasId, nodeId as FlowNodeId, { position });
    return;
  }
}
