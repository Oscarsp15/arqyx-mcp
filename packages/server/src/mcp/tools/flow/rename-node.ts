import type { CanvasId, FlowNodeId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const renameFlowNodeTool = defineTool({
  name: 'rename_flow_node',
  description:
    'Renombra un nodo existente en un lienzo flow sin cambiar su forma, color, descripción ni posición. Úsala cuando el usuario solo quiera cambiar el texto visible del nodo.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      nodeId: z.string().min(1),
      newLabel: z.string().min(1).max(128),
    })
    .strict(),
  handler: (input, { store }) => {
    store.renameFlowNode(input.canvasId as CanvasId, input.nodeId as FlowNodeId, input.newLabel);
    return {
      content: [
        {
          type: 'text',
          text: `Nodo ${input.nodeId} renombrado exitosamente a "${input.newLabel}" en el lienzo ${input.canvasId}.`,
        },
      ],
    };
  },
});
