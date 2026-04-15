import { startMcpServer } from './mcp/server.js';
import { createFileCanvasPersister } from './persistence/canvas-persister.js';
import { createUuidGenerator } from './state/id-generator.js';
import { CanvasStore } from './state/store.js';
import { startWebServer } from './web/server.js';

const WEB_PORT = 7777;
const WEB_HOST = '127.0.0.1';

const store = new CanvasStore({
  canvasIdGenerator: createUuidGenerator(),
  tableIdGenerator: createUuidGenerator(),
  columnIdGenerator: createUuidGenerator(),
  flowNodeIdGenerator: createUuidGenerator(),
  flowEdgeIdGenerator: createUuidGenerator(),
});

const persister = createFileCanvasPersister();

for (const canvas of await persister.loadAll()) {
  store.rehydrate(canvas);
}

store.on((event) => {
  if (event.type === 'canvas:created' || event.type === 'canvas:updated') {
    void persister.save(event.canvas).catch((error) => {
      console.error('[arqyx] Failed to save canvas:', error);
    });
    return;
  }
  if (event.type === 'canvas:deleted') {
    void persister.delete(event.id).catch((error) => {
      console.error('[arqyx] Failed to delete canvas file:', error);
    });
  }
});

const webServer = await startWebServer({ store, port: WEB_PORT, host: WEB_HOST });

await startMcpServer({
  store,
  getCanvasUrl: () => webServer.url,
});
