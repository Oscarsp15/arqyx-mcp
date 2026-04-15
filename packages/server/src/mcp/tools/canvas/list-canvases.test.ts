import { describe, expect, it } from 'vitest';
import { createSequentialGenerator } from '../../../state/id-generator.js';
import { CanvasStore } from '../../../state/store.js';
import type { ToolContext } from '../../tool.js';
import { listCanvasesTool } from './list-canvases.js';

function createContext(): ToolContext {
  return {
    store: new CanvasStore({
      canvasIdGenerator: createSequentialGenerator('canvas'),
      tableIdGenerator: createSequentialGenerator('tbl'),
      columnIdGenerator: createSequentialGenerator('col'),
      flowNodeIdGenerator: createSequentialGenerator('node'),
      flowEdgeIdGenerator: createSequentialGenerator('edge'),
    }),
    getCanvasUrl: () => 'http://localhost:7777',
  };
}

describe('list_canvases tool', () => {
  it('returns a friendly message when there are no canvases', async () => {
    const context = createContext();

    const result = await listCanvasesTool.handler({}, context);

    expect(result.content[0]?.text).toBe('No hay lienzos guardados todavía.');
  });

  it('lists every available canvas with id, name and kind', async () => {
    const context = createContext();
    context.store.createErdCanvas('Modelo');
    context.store.createFlowCanvas('Proceso');

    const result = await listCanvasesTool.handler({}, context);

    expect(result.content[0]?.text).toContain('Lienzos disponibles:');
    expect(result.content[0]?.text).toContain('- [erd] Modelo — id: canvas-1');
    expect(result.content[0]?.text).toContain('- [flow] Proceso — id: canvas-2');
  });
});
