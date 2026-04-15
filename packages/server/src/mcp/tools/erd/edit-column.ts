import type { CanvasId, ColumnId, TableId } from '@arqyx/shared';
import { z } from 'zod';
import { defineTool } from '../../tool.js';

const sqlType = z.enum([
  'uuid',
  'int',
  'bigint',
  'text',
  'varchar',
  'boolean',
  'timestamp',
  'date',
  'numeric',
  'json',
]);

export const editColumnTool = defineTool({
  name: 'edit_column',
  description:
    'Modifica las propiedades de una columna existente conservando su ID. Útil para cambiar el tipo SQL o los flags de (PK, Nullable, Unique) preservando sus relaciones estáticas.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      tableId: z.string().min(1),
      columnId: z.string().min(1),
      type: sqlType.optional(),
      isPrimaryKey: z.boolean().optional(),
      isNullable: z.boolean().optional(),
      isUnique: z.boolean().optional(),
    })
    .strict(),
  handler: (input, { store }) => {
    // biome-ignore lint/suspicious/noExplicitAny: bypass zod optional to exact type mapping
    const patch: any = {};
    if (input.type !== undefined) patch.type = input.type;
    if (input.isPrimaryKey !== undefined) patch.isPrimaryKey = input.isPrimaryKey;
    if (input.isNullable !== undefined) patch.isNullable = input.isNullable;
    if (input.isUnique !== undefined) patch.isUnique = input.isUnique;

    store.editColumn(
      input.canvasId as CanvasId,
      input.tableId as TableId,
      input.columnId as ColumnId,
      patch,
    );
    return {
      content: [
        {
          type: 'text',
          text: `Columna ${input.columnId} actualizada correctamente mediante patch parcial.`,
        },
      ],
    };
  },
});
