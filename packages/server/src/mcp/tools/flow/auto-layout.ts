import type { CanvasId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

const layoutDirection = z.enum(['TB', 'LR', 'radial']);

export const autoLayoutFlowTool = defineTool({
  name: 'auto_layout_flow',
  description:
    'Reorganiza automáticamente las posiciones de todos los nodos de un lienzo flow usando el algoritmo dagre. Úsala después de añadir varios nodos o conexiones para que Claude no tenga que calcular coordenadas manualmente. Direcciones: "TB" (top-to-bottom, ideal para jerarquías y organigramas), "LR" (left-to-right, ideal para procesos y workflows), "radial" (el primer nodo al centro y el resto alrededor, ideal para mapas mentales).',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      direction: layoutDirection.default('LR'),
    })
    .strict(),
  handler: (input, { store }) => {
    store.applyFlowLayout(input.canvasId as CanvasId, input.direction);
    return {
      content: [
        {
          type: 'text',
          text: `Lienzo ${input.canvasId} reorganizado con dirección ${input.direction}.`,
        },
      ],
    };
  },
});
