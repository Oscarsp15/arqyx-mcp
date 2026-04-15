import type { CanvasId, TableId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const removeTableTool = defineTool({
  name: 'remove_table',
  description:
    'Elimina una tabla de un lienzo ERD. Cualquier relación que toque esta tabla (como origen o destino) se elimina automáticamente en cascada.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      tableId: z.string().min(1),
    })
    .strict(),
  handler: (input, { store }) => {
    store.removeTable(input.canvasId as CanvasId, input.tableId as TableId);
    return {
      content: [
        {
          type: 'text',
          text: `Tabla ${input.tableId} eliminada del lienzo ${input.canvasId}.`,
        },
      ],
    };
  },
});
