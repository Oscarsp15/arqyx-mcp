import type { Server as HttpServer } from 'node:http';
import {
  type CanvasId,
  ClientToServerMessage,
  type ColumnId,
  DomainError,
  type FlowNodeId,
  type ServerToClientMessage,
  type TableId,
} from '@arqyx/shared';
import pino from 'pino';
import { WebSocket, WebSocketServer } from 'ws';
import type { ColumnPatch } from '../state/erd-operations.js';
import type { CanvasStore } from '../state/store.js';

const logger = pino({ name: 'ws-hub' });

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
        if (!parsed.success) {
          logger.warn({ issues: parsed.error.issues }, 'rejected malformed client message');
          return;
        }
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
        if (parsed.data.type === 'erd:column:add') {
          store.addColumn(parsed.data.canvasId as CanvasId, parsed.data.tableId as TableId, {
            name: parsed.data.name,
            type: parsed.data.colType,
            isPrimaryKey: parsed.data.isPrimaryKey,
            isNullable: parsed.data.isNullable,
            isUnique: parsed.data.isUnique,
          });
          return;
        }
        if (parsed.data.type === 'erd:column:rename') {
          store.renameColumn(
            parsed.data.canvasId as CanvasId,
            parsed.data.tableId as TableId,
            parsed.data.columnId as ColumnId,
            parsed.data.newName,
          );
          return;
        }
        if (parsed.data.type === 'erd:column:edit') {
          const patch: ColumnPatch = {
            ...(parsed.data.colType !== undefined ? { type: parsed.data.colType } : {}),
            ...(parsed.data.isPrimaryKey !== undefined
              ? { isPrimaryKey: parsed.data.isPrimaryKey }
              : {}),
            ...(parsed.data.isNullable !== undefined ? { isNullable: parsed.data.isNullable } : {}),
            ...(parsed.data.isUnique !== undefined ? { isUnique: parsed.data.isUnique } : {}),
          };
          store.editColumn(
            parsed.data.canvasId as CanvasId,
            parsed.data.tableId as TableId,
            parsed.data.columnId as ColumnId,
            patch,
          );
          return;
        }
        if (parsed.data.type === 'erd:column:remove') {
          store.removeColumn(
            parsed.data.canvasId as CanvasId,
            parsed.data.tableId as TableId,
            parsed.data.columnId as ColumnId,
          );
          return;
        }
      } catch (error) {
        if (error instanceof DomainError) {
          logger.warn({ code: error.code, message: error.message }, 'domain error on ws message');
          return;
        }
        if (error instanceof SyntaxError) {
          logger.warn({ message: error.message }, 'invalid json on ws message');
          return;
        }
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
