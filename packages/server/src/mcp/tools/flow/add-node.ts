import type { CanvasId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

const flowNodeShape = z.enum(['rectangle', 'rounded', 'diamond', 'circle', 'note']);
const flowNodeColor = z.enum(['neutral', 'blue', 'green', 'amber', 'red', 'purple']);

export const addFlowNodeTool = defineTool({
  name: 'add_flow_node',
  description:
    'Añade un nodo a un lienzo flow. Los shapes disponibles son: rectangle (tareas, cajas genéricas), rounded (inicio y fin de procesos), diamond (decisiones con sí/no), circle (estados o eventos), note (anotaciones tipo post-it). Los colores sugieren categorías: neutral (por defecto), blue (información), green (éxito o inicio), amber (advertencia o decisión), red (error o fin crítico), purple (destacado). La posición es opcional: si no la indicas, auto_layout_flow después puede ordenar todos los nodos automáticamente.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      label: z.string().min(1).max(128),
      shape: flowNodeShape,
      color: flowNodeColor.default('neutral'),
      description: z.string().max(1024).nullable().default(null),
      position: z
        .object({
          x: z.number(),
          y: z.number(),
        })
        .default({ x: 0, y: 0 }),
    })
    .strict(),
  handler: (input, { store }) => {
    const updated = store.addFlowNode(input.canvasId as CanvasId, {
      label: input.label,
      shape: input.shape,
      color: input.color,
      description: input.description,
      position: input.position,
    });
    const node = updated.nodes[updated.nodes.length - 1];
    return {
      content: [
        {
          type: 'text',
          text: `Nodo "${input.label}" (${input.shape}) añadido al lienzo ${input.canvasId} con id ${node?.id ?? 'desconocido'}.`,
        },
      ],
    };
  },
});
