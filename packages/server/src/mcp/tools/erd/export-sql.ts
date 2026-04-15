import { type CanvasId, DomainError } from '@arqyx/shared';
import { z } from 'zod';
import { generatePostgresDdl } from '../../../state/erd-sql.js';
import { defineTool } from '../../tool.js';

export const exportSqlTool = defineTool({
  name: 'export_sql_ddl',
  description:
    "Exporta el lienzo ERD a un script SQL de creación de dabase (DDL) para el dialecto seleccionado. Solo soporta dialecto 'postgresql' de momento.",
  inputSchema: z
    .object({
      canvasId: z.string().min(1),
      dialect: z.enum(['postgresql']),
    })
    .strict(),
  handler: (input, { store }) => {
    const canvas = store.get(input.canvasId as CanvasId);
    if (!canvas) {
      throw new DomainError('CANVAS_NOT_FOUND', `No se encontró el lienzo "${input.canvasId}".`);
    }
    if (canvas.kind !== 'erd') {
      throw new DomainError('CANVAS_WRONG_KIND', 'Esta herramienta requiere un lienzo ERD.');
    }

    let ddl: string;
    if (input.dialect === 'postgresql') {
      ddl = generatePostgresDdl(canvas);
    } else {
      throw new Error(`Dialecto no soportado: ${input.dialect}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: ddl,
        },
      ],
    };
  },
});
