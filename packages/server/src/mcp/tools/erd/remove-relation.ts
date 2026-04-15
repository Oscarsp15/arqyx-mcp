import type { CanvasId, ColumnId, TableId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const removeRelationTool = defineTool({
  name: 'remove_relation',
  description:
    'Elimina una relación existente entre dos columnas. Debes indicar exactamente los cuatro extremos (tabla origen, columna origen, tabla destino, columna destino).',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      fromTable: z.string().min(1),
      fromColumn: z.string().min(1),
      toTable: z.string().min(1),
      toColumn: z.string().min(1),
    })
    .strict(),
  handler: (input, { store }) => {
    store.removeRelation(input.canvasId as CanvasId, {
      fromTable: input.fromTable as TableId,
      fromColumn: input.fromColumn as ColumnId,
      toTable: input.toTable as TableId,
      toColumn: input.toColumn as ColumnId,
    });
    return {
      content: [
        {
          type: 'text',
          text: `Relación entre ${input.fromTable}.${input.fromColumn} y ${input.toTable}.${input.toColumn} eliminada.`,
        },
      ],
    };
  },
});
