import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const createErdCanvasTool = defineTool({
  name: 'create_erd_canvas',
  description:
    'Crea un lienzo ERD vacío para diseñar un esquema de base de datos. Devuelve el ID del lienzo creado, que se usa en todas las operaciones posteriores (add_table, add_column, etc.).',
  inputSchema: z
    .object({
      name: z.string().min(1).max(128),
    })
    .strict(),
  handler: (input, { store }) => {
    const canvas = store.createErdCanvas(input.name);
    return {
      content: [
        {
          type: 'text',
          text: `Lienzo ERD "${canvas.name}" creado con id ${canvas.id}.`,
        },
      ],
    };
  },
});
