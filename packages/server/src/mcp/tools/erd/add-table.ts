import type { CanvasId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const addTableTool = defineTool({
  name: 'add_table',
  description:
    'Añade una tabla a un lienzo ERD existente. Requiere el id del lienzo, el nombre de la tabla y su posición (x, y) en el canvas. La tabla se crea sin columnas; usa add_column para añadirlas.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      name: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
          message:
            'El nombre debe comenzar con letra o guión bajo y solo contener letras, números o guiones bajos.',
        }),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
    })
    .strict(),
  handler: (input, { store }) => {
    const updated = store.addTable(input.canvasId as CanvasId, {
      name: input.name,
      position: input.position,
    });
    const table = updated.tables[updated.tables.length - 1];
    return {
      content: [
        {
          type: 'text',
          text: `Tabla "${input.name}" añadida al lienzo ${input.canvasId} con id ${table?.id ?? 'desconocido'}.`,
        },
      ],
    };
  },
});
