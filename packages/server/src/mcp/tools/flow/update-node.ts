import type { CanvasId, FlowNodeId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

const flowNodeShape = z.enum(['rectangle', 'rounded', 'diamond', 'circle', 'note']);
const flowNodeColor = z.enum(['neutral', 'blue', 'green', 'amber', 'red', 'purple']);

export const updateFlowNodeTool = defineTool({
  name: 'update_flow_node',
  description:
    'Modifica propiedades de un nodo flow existente. Solo se actualizan los campos que especifiques; los demás quedan igual. Úsala para renombrar nodos, cambiar su forma o color, añadirles una descripción explicativa, o moverlos a otra posición.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      nodeId: z.string().min(1),
      label: z.string().min(1).max(128).optional(),
      shape: flowNodeShape.optional(),
      color: flowNodeColor.optional(),
      description: z.string().max(1024).nullable().optional(),
      position: z
        .object({
          x: z.number(),
          y: z.number(),
        })
        .optional(),
    })
    .strict(),
  handler: (input, { store }) => {
    const patch: Parameters<typeof store.updateFlowNode>[2] = {};
    if (input.label !== undefined) patch.label = input.label;
    if (input.shape !== undefined) patch.shape = input.shape;
    if (input.color !== undefined) patch.color = input.color;
    if (input.description !== undefined) patch.description = input.description;
    if (input.position !== undefined) patch.position = input.position;

    store.updateFlowNode(input.canvasId as CanvasId, input.nodeId as FlowNodeId, patch);
    return {
      content: [
        {
          type: 'text',
          text: `Nodo ${input.nodeId} actualizado en el lienzo ${input.canvasId}.`,
        },
      ],
    };
  },
});
