import { type CanvasId, DomainError } from '@arqyx/shared';
import { z } from 'zod';
import { generateMermaidFlowchart } from '../../../state/flow-mermaid.js';
import { defineTool } from '../../tool.js';

export const exportMermaidTool = defineTool({
  name: 'export_mermaid',
  description:
    'Exporta el lienzo de flujo a un diagrama de Mermaid (flowchart). Permite dirección opcional TD o LR.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      direction: z.enum(['TD', 'LR']).optional(),
    })
    .strict(),
  handler: (input, { store }) => {
    const canvas = store.get(input.canvasId as CanvasId);
    if (!canvas) {
      throw new DomainError('CANVAS_NOT_FOUND', `No se encontró el lienzo "${input.canvasId}".`);
    }
    if (canvas.kind !== 'flow') {
      throw new DomainError('CANVAS_WRONG_KIND', 'Esta herramienta requiere un lienzo Flow.');
    }

    const mermaid = generateMermaidFlowchart(canvas, input.direction);

    return {
      content: [
        {
          type: 'text',
          text: mermaid,
        },
      ],
    };
  },
});
