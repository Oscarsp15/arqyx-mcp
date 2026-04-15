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
  addTable: (canvasId: string, name: string, position: { x: number; y: number }) => void;
  renameTable: (canvasId: string, tableId: string, newName: string) => void;
  removeTable: (canvasId: string, tableId: string) => void;
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

  const addTable = (canvasId: string, name: string, position: { x: number; y: number }) => {
    clientRef.current?.send({ type: 'erd:table:add', canvasId, name, position });
  };

  const renameTable = (canvasId: string, tableId: string, newName: string) => {
    clientRef.current?.send({ type: 'erd:table:rename', canvasId, tableId, newName });
  };

  const removeTable = (canvasId: string, tableId: string) => {
    clientRef.current?.send({ type: 'erd:table:remove', canvasId, tableId });
  };

  return { canvas, status, moveNode, addTable, renameTable, removeTable };
}
