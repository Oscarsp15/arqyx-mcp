import Fastify, { type FastifyInstance } from 'fastify';
import type { CanvasStore } from '../state/store.js';
import { type WsHub, attachWsHub } from './ws-hub.js';

export type WebServer = {
  url: string;
  close: () => Promise<void>;
};

type StartWebServerDeps = {
  store: CanvasStore;
  port: number;
  host: string;
};

export async function startWebServer(deps: StartWebServerDeps): Promise<WebServer> {
  const app: FastifyInstance = Fastify({ logger: false });

  app.get('/healthz', async () => ({ ok: true }));
  app.get('/api/canvases', async () => ({ canvases: deps.store.list() }));

  await app.listen({ port: deps.port, host: deps.host });

  const hub: WsHub = attachWsHub(app.server, deps.store);

  return {
    url: `http://${deps.host}:${deps.port}`,
    close: async () => {
      await hub.close();
      await app.close();
    },
  };
}
