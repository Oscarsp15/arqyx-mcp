import type { CanvasId, FlowEdgeId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const removeFlowEdgeTool = defineTool({
  name: 'remove_flow_edge',
  description:
    'Elimina una conexión existente entre dos nodos flow usando su id. Si quieres eliminar un nodo junto con todas sus conexiones, usa remove_flow_node en su lugar — hace la cascada automáticamente.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      edgeId: z.string().min(1),
    })
    .strict(),
  handler: (input, { store }) => {
    store.removeFlowEdge(input.canvasId as CanvasId, input.edgeId as FlowEdgeId);
    return {
      content: [
        {
          type: 'text',
          text: `Conexión ${input.edgeId} eliminada del lienzo ${input.canvasId}.`,
        },
      ],
    };
  },
});
