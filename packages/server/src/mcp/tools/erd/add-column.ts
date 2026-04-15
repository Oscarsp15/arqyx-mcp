import type { CanvasId, TableId } from '@arqyx/shared';
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

export const addColumnTool = defineTool({
  name: 'add_column',
  description:
    'Añade una columna a una tabla existente de un lienzo ERD. Especifica el tipo SQL y los flags de clave primaria, nullable y unique. Úsala después de add_table para poblar el esquema.',
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      tableId: z.string().min(1),
      name: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
          message:
            'El nombre debe comenzar con letra o guión bajo y solo contener letras, números o guiones bajos.',
        }),
      type: sqlType,
      isPrimaryKey: z.boolean().default(false),
      isNullable: z.boolean().default(true),
      isUnique: z.boolean().default(false),
    })
    .strict(),
  handler: (input, { store }) => {
    store.addColumn(input.canvasId as CanvasId, input.tableId as TableId, {
      name: input.name,
      type: input.type,
      isPrimaryKey: input.isPrimaryKey,
      isNullable: input.isNullable,
      isUnique: input.isUnique,
    });
    return {
      content: [
        {
          type: 'text',
          text: `Columna "${input.name}" (${input.type}) añadida a la tabla ${input.tableId}.`,
        },
      ],
    };
  },
});
