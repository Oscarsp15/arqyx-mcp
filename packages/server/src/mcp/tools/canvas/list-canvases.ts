import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const listCanvasesTool = defineTool({
  name: 'list_canvases',
  description:
    'Lista todos los lienzos existentes (ERD, AWS u otros) con su id, tipo y nombre. Úsala al inicio de una sesión para saber qué diseños persistidos hay disponibles antes de crear uno nuevo.',
  inputSchema: z.object({}).strict(),
  handler: (_input, { store }) => {
    const canvases = store.list();
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
