import type { CanvasId, FlowNodeId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const removeFlowNodeTool = defineTool({
  name: 'remove_flow_node',
  description:
    'Elimina un nodo de un lienzo flow. Cualquier conexión (edge) que toque este nodo como origen o destino se elimina automáticamente en cascada.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      nodeId: z.string().min(1),
    })
    .strict(),
  handler: (input, { store }) => {
    store.removeFlowNode(input.canvasId as CanvasId, input.nodeId as FlowNodeId);
    return {
      content: [
        {
          type: 'text',
          text: `Nodo ${input.nodeId} eliminado del lienzo ${input.canvasId}.`,
        },
      ],
    };
  },
});
