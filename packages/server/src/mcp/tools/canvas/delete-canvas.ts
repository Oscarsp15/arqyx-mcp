import { type CanvasId, DomainError } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const deleteCanvasTool = defineTool({
  name: 'delete_canvas',
  description:
    'Elimina un lienzo completo de forma permanente, incluyendo su archivo persistido en disco. Usa esta tool solo cuando el usuario confirme explícitamente que quiere descartarlo.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
    })
    .strict(),
  handler: (input, { store }) => {
    const id = input.canvasId as CanvasId;
    const existed = store.get(id);
    if (!existed) {
      throw new DomainError('CANVAS_NOT_FOUND', `No se encontró el lienzo "${input.canvasId}".`);
    }
    store.delete(id);
    return {
      content: [
        {
          type: 'text',
          text: `Lienzo "${existed.name}" eliminado permanentemente.`,
        },
      ],
    };
  },
});
