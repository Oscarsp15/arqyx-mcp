import type { Canvas } from '@arqyx/shared';
import { useEffect, useRef, useState } from 'react';
import { type CanvasWsClient, type ConnectionStatus, connectCanvasWs } from '../../ws/client.js';

export type MoveNodeFn = (
  canvasId: string,
  nodeId: string,
  position: { x: number; y: number },
) => void;

export type CanvasWsState = {
  canvas: Canvas | null;
  status: ConnectionStatus;
  moveNode: MoveNodeFn;
};

export function useCanvasWs(url: string): CanvasWsState {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const clientRef = useRef<CanvasWsClient | null>(null);

  useEffect(() => {
    const client = connectCanvasWs(url, {
      onSnapshot: setCanvas,
      onStatusChange: setStatus,
    });
    clientRef.current = client;
    return () => {
      clientRef.current = null;
      client.close();
    };
  }, [url]);

  const moveNode: MoveNodeFn = (canvasId, nodeId, position) => {
    clientRef.current?.send({ type: 'node:moved', canvasId, nodeId, position });
  };

  return { canvas, status, moveNode };
}
