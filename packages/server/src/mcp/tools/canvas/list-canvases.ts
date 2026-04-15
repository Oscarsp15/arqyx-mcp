import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const listCanvasesTool = defineTool({
  name: 'list_canvases',
  description:
    'Lista todos los lienzos existentes con su id, tipo y nombre. Úsala al inicio de una sesión para ver qué canvas hay disponibles antes de leer o modificar uno.',
  inputSchema: z.object({}).strict(),
  handler: (_input, { store }) => {
    const canvases = store.listCanvases();
    if (canvases.length === 0) {
      return {
        content: [{ type: 'text', text: 'No hay lienzos guardados todavía.' }],
      };
    }

    const lines = canvases.map((canvas) => `- [${canvas.kind}] ${canvas.name} — id: ${canvas.id}`);
    return {
      content: [
        {
          type: 'text',
          text: `Lienzos disponibles:\n${lines.join('\n')}`,
        },
      ],
    };
  },
});
