import type { Canvas, ClientToServerMessage } from '@arqyx/shared';
import { parseServerMessage } from './parse.js';

export type ConnectionStatus = 'connecting' | 'open' | 'closed';

export type CanvasWsHandlers = {
  onSnapshot: (canvas: Canvas) => void;
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
    }
  });

  return {
    send: (message) => {
      console.log('WS send called', message, 'readyState:', socket.readyState);
      console.log('WS url is:', url);
      if (socket.readyState !== WebSocket.OPEN) {
        console.warn('Socket not open, readyState:', socket.readyState);
        return;
      }
      socket.send(JSON.stringify(message));
      console.log('message dispatched completely');
    },
    close: () => socket.close(),
  };
}
