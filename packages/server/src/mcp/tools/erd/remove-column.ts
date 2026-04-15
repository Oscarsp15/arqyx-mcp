import type { CanvasId, ColumnId, TableId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const removeColumnTool = defineTool({
  name: 'remove_column',
  description:
    'Elimina una columna existente de una tabla. Falla si la columna está referenciada por una relación; en ese caso, elimina primero la relación con remove_relation.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      tableId: z.string().min(1),
      columnId: z.string().min(1),
    })
    .strict(),
  handler: (input, { store }) => {
    store.removeColumn(
      input.canvasId as CanvasId,
      input.tableId as TableId,
      input.columnId as ColumnId,
    );
    return {
      content: [
        {
          type: 'text',
          text: `Columna ${input.columnId} eliminada de la tabla ${input.tableId}.`,
        },
      ],
    };
  },
});
