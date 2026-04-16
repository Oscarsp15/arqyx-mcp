import type { Canvas, SqlType } from '@arqyx/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type CanvasWsClient, type ConnectionStatus, connectCanvasWs } from '../../ws/client.js';

export type MoveNodeFn = (
  canvasId: string,
  nodeId: string,
  position: { x: number; y: number },
) => void;

export type ColumnFlags = {
  isPrimaryKey?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
};

export type CanvasWsState = {
  canvas: Canvas | null;
  canvases: readonly Canvas[];
  status: ConnectionStatus;
  moveNode: MoveNodeFn;
  addTable: (canvasId: string, name: string, position: { x: number; y: number }) => void;
  renameTable: (canvasId: string, tableId: string, newName: string) => void;
  removeTable: (canvasId: string, tableId: string) => void;
  addColumn: (
    canvasId: string,
    tableId: string,
    name: string,
    colType: SqlType,
    flags?: ColumnFlags,
  ) => void;
  renameColumn: (canvasId: string, tableId: string, columnId: string, newName: string) => void;
  editColumn: (
    canvasId: string,
    tableId: string,
    columnId: string,
    patch: { colType?: SqlType } & ColumnFlags,
  ) => void;
  removeColumn: (canvasId: string, tableId: string, columnId: string) => void;
};

function upsertCanvas(existingCanvases: readonly Canvas[], nextCanvas: Canvas): readonly Canvas[] {
  const existingIndex = existingCanvases.findIndex((canvas) => canvas.id === nextCanvas.id);
  if (existingIndex === -1) {
    return [...existingCanvases, nextCanvas];
  }
  const nextCanvases = [...existingCanvases];
  nextCanvases[existingIndex] = nextCanvas;
  return nextCanvases;
}

export function useCanvasWs(url: string, selectedCanvasId: string | null): CanvasWsState {
  const [canvases, setCanvases] = useState<readonly Canvas[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const clientRef = useRef<CanvasWsClient | null>(null);
  const canvas = useMemo(
    () => canvases.find((nextCanvas) => nextCanvas.id === selectedCanvasId) ?? null,
    [canvases, selectedCanvasId],
  );

  useEffect(() => {
    const client = connectCanvasWs(url, {
      onSnapshot: (nextCanvas) => {
        setCanvases((currentCanvases) => upsertCanvas(currentCanvases, nextCanvas));
      },
      onCanvasDeleted: (canvasId) => {
        setCanvases((currentCanvases) =>
          currentCanvases.filter((currentCanvas) => currentCanvas.id !== canvasId),
        );
      },
      onCanvasCleared: () => {
        setCanvases([]);
      },
      onStatusChange: setStatus,
    });
    clientRef.current = client;
    return () => {
      clientRef.current = null;
      client.close();
    };
  }, [url]);

  const moveNode: MoveNodeFn = useCallback((canvasId, nodeId, position) => {
    clientRef.current?.send({ type: 'node:moved', canvasId, nodeId, position });
  }, []);

  const addTable = useCallback(
    (canvasId: string, name: string, position: { x: number; y: number }) => {
      clientRef.current?.send({ type: 'erd:table:add', canvasId, name, position });
    },
    [],
  );

  const renameTable = useCallback((canvasId: string, tableId: string, newName: string) => {
    clientRef.current?.send({ type: 'erd:table:rename', canvasId, tableId, newName });
  }, []);

  const removeTable = useCallback((canvasId: string, tableId: string) => {
    clientRef.current?.send({ type: 'erd:table:remove', canvasId, tableId });
  }, []);

  const addColumn = useCallback(
    (canvasId: string, tableId: string, name: string, colType: SqlType, flags?: ColumnFlags) => {
      console.debug('[ws] send erd:column:add', { canvasId, tableId, name, colType });
      clientRef.current?.send({
        type: 'erd:column:add',
        canvasId,
        tableId,
        name,
        colType,
        isPrimaryKey: flags?.isPrimaryKey ?? false,
        isNullable: flags?.isNullable ?? true,
        isUnique: flags?.isUnique ?? false,
      });
    },
    [],
  );

  const renameColumn = useCallback(
    (canvasId: string, tableId: string, columnId: string, newName: string) => {
      console.debug('[ws] send erd:column:rename', { canvasId, tableId, columnId, newName });
      clientRef.current?.send({ type: 'erd:column:rename', canvasId, tableId, columnId, newName });
    },
    [],
  );

  const editColumn = useCallback(
    (
      canvasId: string,
      tableId: string,
      columnId: string,
      patch: { colType?: SqlType } & ColumnFlags,
    ) => {
      console.debug('[ws] send erd:column:edit', { canvasId, tableId, columnId, patch });
      clientRef.current?.send({
        type: 'erd:column:edit',
        canvasId,
        tableId,
        columnId,
        colType: patch.colType,
        isPrimaryKey: patch.isPrimaryKey,
        isNullable: patch.isNullable,
        isUnique: patch.isUnique,
      });
    },
    [],
  );

  const removeColumn = useCallback((canvasId: string, tableId: string, columnId: string) => {
    console.debug('[ws] send erd:column:remove', { canvasId, tableId, columnId });
    clientRef.current?.send({ type: 'erd:column:remove', canvasId, tableId, columnId });
  }, []);

  return useMemo(
    () => ({
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
    }),
    [
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
    ],
  );
}
