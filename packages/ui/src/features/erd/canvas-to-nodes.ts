import type { ErdCanvas } from '@arqyx/shared';
import type { Edge, Node } from '@xyflow/react';
import type { TableNodeData } from './table-node.js';

export type ErdNode = Node<TableNodeData, 'table'>;

export function erdCanvasToNodes(canvas: ErdCanvas): ErdNode[] {
  return canvas.tables.map((table) => ({
    id: table.id,
    type: 'table',
    position: table.position,
    data: {
      label: table.name,
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
