import type { CanvasId, FlowNodeId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

const flowEdgeStyle = z.enum(['solid', 'dashed', 'dotted']);
const flowEdgeArrow = z.enum(['none', 'single', 'double']);

export const connectFlowNodesTool = defineTool({
  name: 'connect_flow_nodes',
  description:
    'Crea una conexión (edge) entre dos nodos flow existentes. El estilo "solid" es el flujo principal, "dashed" para caminos alternativos o dependencias opcionales, "dotted" para anotaciones. La flecha "single" indica dirección (A causa B), "double" relación bidireccional, "none" para mapas mentales o relaciones simétricas sin dirección. El label es opcional pero útil para etiquetar la transición (ej. "si", "no", "error").',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      from: z.string().min(1),
      to: z.string().min(1),
      label: z.string().max(128).nullable().default(null),
      style: flowEdgeStyle.default('solid'),
      arrow: flowEdgeArrow.default('single'),
    })
    .strict(),
  handler: (input, { store }) => {
    store.connectFlowNodes(input.canvasId as CanvasId, {
      from: input.from as FlowNodeId,
      to: input.to as FlowNodeId,
      label: input.label,
      style: input.style,
      arrow: input.arrow,
    });
    return {
      content: [
        {
          type: 'text',
          text: `Conexión creada de ${input.from} a ${input.to} (${input.style}, ${input.arrow}).`,
        },
      ],
    };
  },
});
