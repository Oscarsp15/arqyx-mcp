import type { CanvasId, ColumnId, TableId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

const relationKind = z.enum(['one-to-one', 'one-to-many', 'many-to-many']);

export const addRelationTool = defineTool({
  name: 'add_relation',
  description:
    'Crea una relación entre dos columnas de dos tablas existentes. Especifica la columna origen, la columna destino y el tipo de cardinalidad. Las columnas deben existir previamente.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      fromTable: z.string().min(1),
      fromColumn: z.string().min(1),
      toTable: z.string().min(1),
      toColumn: z.string().min(1),
      kind: relationKind,
    })
    .strict(),
  handler: (input, { store }) => {
    store.addRelation(input.canvasId as CanvasId, {
      fromTable: input.fromTable as TableId,
      fromColumn: input.fromColumn as ColumnId,
      toTable: input.toTable as TableId,
      toColumn: input.toColumn as ColumnId,
      kind: input.kind,
    });
    return {
      content: [
        {
          type: 'text',
          text: `Relación ${input.kind} creada entre ${input.fromTable}.${input.fromColumn} y ${input.toTable}.${input.toColumn}.`,
        },
      ],
    };
  },
});
