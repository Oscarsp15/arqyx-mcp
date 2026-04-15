import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const openCanvasTool = defineTool({
  name: 'open_canvas',
  description:
    'Devuelve la URL del lienzo web de Arqyx para que el usuario la abra en el navegador y vea los diseños en vivo. Úsala al inicio de cualquier sesión de diseño.',
  inputSchema: z.object({}).strict(),
  handler: (_input, { getCanvasUrl }) => ({
    content: [
      {
        type: 'text',
        text: `Abre el lienzo en tu navegador: ${getCanvasUrl()}`,
      },
    ],
  }),
});
