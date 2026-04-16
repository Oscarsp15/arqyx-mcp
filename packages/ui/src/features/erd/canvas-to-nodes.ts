import type { ErdCanvas, SqlType } from '@arqyx/shared';
import type { Edge, Node } from '@xyflow/react';
import type { TableNodeData } from './table-node.js';

export type ErdNode = Node<TableNodeData, 'table'>;

export type ErdNodeHandlers = {
  onRename?: (tableId: string, newName: string) => void;
  onRemove?: (tableId: string) => void;
  onAddColumn?: (tableId: string, name: string, colType: SqlType) => void;
  onRenameColumn?: (tableId: string, columnId: string, newName: string) => void;
  onEditColumn?: (tableId: string, columnId: string, patch: { colType?: SqlType }) => void;
  onRemoveColumn?: (tableId: string, columnId: string) => void;
};

export function erdCanvasToNodes(canvas: ErdCanvas, handlers?: ErdNodeHandlers): ErdNode[] {
  return canvas.tables.map((table) => ({
    id: table.id,
    type: 'table',
    position: table.position,
    data: {
      label: table.name,
      ...(handlers?.onRename
        ? { onRename: (newName: string) => handlers.onRename?.(table.id, newName) }
        : {}),
      ...(handlers?.onRemove ? { onRemove: () => handlers.onRemove?.(table.id) } : {}),
      ...(handlers?.onAddColumn
        ? {
            onAddColumn: (name: string, colType: SqlType) =>
              handlers.onAddColumn?.(table.id, name, colType),
          }
        : {}),
      ...(handlers?.onRenameColumn
        ? {
            onRenameColumn: (columnId: string, newName: string) =>
              handlers.onRenameColumn?.(table.id, columnId, newName),
          }
        : {}),
      ...(handlers?.onEditColumn
        ? {
            onEditColumn: (columnId: string, patch: { colType?: SqlType }) =>
              handlers.onEditColumn?.(table.id, columnId, patch),
          }
        : {}),
      ...(handlers?.onRemoveColumn
        ? {
            onRemoveColumn: (columnId: string) => handlers.onRemoveColumn?.(table.id, columnId),
          }
        : {}),
      columns: table.columns.map((column) => ({
        id: column.id,
        name: column.name,
        type: column.type,
        isPrimaryKey: column.isPrimaryKey,
        isNullable: column.isNullable,
        isUnique: column.isUnique,
      })),
    },
  }));
}

export function erdCanvasToEdges(canvas: ErdCanvas): Edge[] {
  return canvas.relations.map((relation) => ({
    id: `${relation.fromTable}:${relation.fromColumn}->${relation.toTable}:${relation.toColumn}`,
    source: relation.fromTable,
    target: relation.toTable,
    label: relation.kind,
  }));
}
