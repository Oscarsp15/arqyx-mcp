import type { AddressInfo } from 'node:net';
import Fastify, { type FastifyInstance } from 'fastify';
import packageJson from '../../package.json';
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
  app.get('/api/health', async () => ({
    ok: true,
    uptime: process.uptime(),
    version: packageJson.version,
  }));
  app.get('/api/canvases', async () => ({ canvases: deps.store.list() }));

  await app.listen({ port: deps.port, host: deps.host });
  const address = app.server.address();
  const listeningPort =
    typeof address === 'object' && address !== null ? (address as AddressInfo).port : deps.port;

  const hub: WsHub = attachWsHub(app.server, deps.store);

  return {
    url: `http://${deps.host}:${listeningPort}`,
    close: async () => {
      await hub.close();
      await app.close();
    },
  };
}
