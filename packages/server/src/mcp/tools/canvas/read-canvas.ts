import { type CanvasId, DomainError } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const readCanvasTool = defineTool({
  name: 'read_canvas',
  description:
    'Lee el estado actual de un lienzo existente (tablas, servicios, conexiones). Úsala para revisar qué hay antes de modificar, o para sincronizarte con ediciones manuales del usuario.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
    })
    .strict(),
  handler: (input, { store }) => {
    const canvas = store.get(input.canvasId as CanvasId);
    if (!canvas) {
      throw new DomainError('CANVAS_NOT_FOUND', `No se encontró el lienzo "${input.canvasId}".`);
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(canvas, null, 2),
        },
      ],
    };
  },
});
