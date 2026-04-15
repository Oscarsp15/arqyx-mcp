import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const createFlowCanvasTool = defineTool({
  name: 'create_flow_canvas',
  description:
    'Crea un lienzo flexible de tipo flow para diagramas de propósito general: procesos, mapas mentales, jerarquías, organigramas, flujos de trabajo y explicaciones visuales. Devuelve el id del lienzo creado. Úsala cuando el usuario pida que dibujes una explicación, un proceso o una estructura que no sea una base de datos ni una arquitectura AWS.',
  inputSchema: z
    .object({
      name: z.string().min(1).max(128),
    })
    .strict(),
  handler: (input, { store }) => {
    const canvas = store.createFlowCanvas(input.name);
    return {
      content: [
        {
          type: 'text',
          text: `Lienzo flow "${canvas.name}" creado con id ${canvas.id}.`,
        },
      ],
    };
  },
});
