import type { CanvasId, TableId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const renameTableTool = defineTool({
  name: 'rename_table',
  description:
    'Renombra una tabla en un lienzo ERD existente, preservando sus columnas, id y relaciones. Requiere el id del lienzo, el id de la tabla a renombrar, y el nuevo nombre.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      tableId: z.string().min(1),
      newName: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
          message:
            'El nombre debe comenzar con letra o guión bajo y solo contener letras, números o guiones bajos.',
        }),
    })
    .strict(),
  handler: (input, { store }) => {
    store.renameTable(input.canvasId as CanvasId, input.tableId as TableId, input.newName);
    return {
      content: [
        {
          type: 'text',
          text: `Tabla ${input.tableId} renombrada exitosamente a "${input.newName}" en el lienzo ${input.canvasId}.`,
        },
      ],
    };
  },
});
