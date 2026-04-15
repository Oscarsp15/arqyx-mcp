import type { CanvasId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

const flowNodeShape = z.enum(['rectangle', 'rounded', 'diamond', 'circle', 'note']);
const flowNodeColor = z.enum(['neutral', 'blue', 'green', 'amber', 'red', 'purple']);

const STAGGER_OFFSET = 48;

export const addFlowNodeTool = defineTool({
  name: 'add_flow_node',
  description:
    'Añade un nodo a un lienzo flow. Los shapes disponibles son: rectangle (tareas, cajas genéricas), rounded (inicio y fin de procesos), diamond (decisiones con sí/no), circle (estados o eventos), note (anotaciones tipo post-it). Los colores sugieren categorías: neutral (por defecto), blue (información), green (éxito o inicio), amber (advertencia o decisión), red (error o fin crítico), purple (destacado). Si no indicas position, cada nodo nuevo se escalona diagonalmente para que no se apilen; después puedes llamar auto_layout_flow para reorganizar todo con dagre.',
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
        .nullable()
        .default(null),
    })
    .strict(),
  handler: (input, { store }) => {
    const canvasId = input.canvasId as CanvasId;
    const position = input.position ?? computeStaggeredPosition(store, canvasId);
    const updated = store.addFlowNode(canvasId, {
      label: input.label,
      shape: input.shape,
      color: input.color,
      description: input.description,
      position,
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

function computeStaggeredPosition(
  store: Parameters<typeof addFlowNodeTool.handler>[1]['store'],
  canvasId: CanvasId,
): { x: number; y: number } {
  const canvas = store.get(canvasId);
  const existingCount = canvas?.kind === 'flow' ? canvas.nodes.length : 0;
  return { x: existingCount * STAGGER_OFFSET, y: existingCount * STAGGER_OFFSET };
}
