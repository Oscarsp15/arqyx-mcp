import type { CanvasId, ColumnId, TableId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

export const renameColumnTool = defineTool({
  name: 'rename_column',
  description:
    'Renombra una columna existente en una tabla del ERD Canvas, manteniendo sus relaciones. Parámetros requeridos: canvasId, tableId, columnId de la columna a renombrar, y newName para el nombre fresco.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      tableId: z.string().min(1),
      columnId: z.string().min(1),
      newName: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
          message:
            'El nombre debe comenzar con letra o guión bajo y solo contener letras, números o guiones bajos.',
        }),
    })
    .strict(),
  handler: (input, { store }) => {
    store.renameColumn(
      input.canvasId as CanvasId,
      input.tableId as TableId,
      input.columnId as ColumnId,
      input.newName,
    );
    return {
      content: [
        {
          type: 'text',
          text: `Columna ${input.columnId} renombrada exitosamente a "${input.newName}".`,
        },
      ],
    };
  },
});
