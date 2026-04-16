import type { Canvas, ClientToServerMessage } from '@arqyx/shared';
import { parseServerMessage } from './parse.js';

export type ConnectionStatus = 'connecting' | 'open' | 'closed';

export type CanvasWsHandlers = {
  onSnapshot: (canvas: Canvas) => void;
  onCanvasDeleted: (canvasId: string) => void;
  onCanvasCleared: () => void;
  onStatusChange: (status: ConnectionStatus) => void;
};

export type CanvasWsClient = {
  send: (message: ClientToServerMessage) => void;
  close: () => void;
};

export function connectCanvasWs(url: string, handlers: CanvasWsHandlers): CanvasWsClient {
  const socket = new WebSocket(url);
  handlers.onStatusChange('connecting');

  socket.addEventListener('open', () => handlers.onStatusChange('open'));
  socket.addEventListener('close', () => handlers.onStatusChange('closed'));
  socket.addEventListener('error', () => handlers.onStatusChange('closed'));

  socket.addEventListener('message', (event) => {
    const raw = typeof event.data === 'string' ? event.data : '';
    const message = parseServerMessage(raw);
    if (message === null) return;
    if (message.type === 'canvas:snapshot') {
      handlers.onSnapshot(message.canvas);
      return;
    }
    if (message.type === 'canvas:deleted') {
      handlers.onCanvasDeleted(message.id);
      return;
    }
    if (message.type === 'canvas:cleared') {
      handlers.onCanvasCleared();
    }
  });

  return {
    send: (message) => {
      if (socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify(message));
    },
    close: () => socket.close(),
  };
}
