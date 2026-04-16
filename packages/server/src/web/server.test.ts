import { afterEach, describe, expect, it } from 'vitest';
import packageJson from '../../package.json';
import { createSequentialGenerator } from '../state/id-generator.js';
import { CanvasStore } from '../state/store.js';
import { type WebServer, startWebServer } from './server.js';

function createTestStore(): CanvasStore {
  return new CanvasStore({
    canvasIdGenerator: createSequentialGenerator('canvas'),
    tableIdGenerator: createSequentialGenerator('tbl'),
    columnIdGenerator: createSequentialGenerator('col'),
    flowNodeIdGenerator: createSequentialGenerator('node'),
    flowEdgeIdGenerator: createSequentialGenerator('edge'),
  });
}

describe('startWebServer', () => {
  let webServer: WebServer | undefined;

  afterEach(async () => {
    if (!webServer) {
      return;
    }

    await webServer.close();
    webServer = undefined;
  });

  it('serves GET /api/health with uptime and version', async () => {
    webServer = await startWebServer({
      store: createTestStore(),
      port: 0,
      host: 'localhost',
    });

    const response = await fetch(`${webServer.url}/api/health`);
    const payload = (await response.json()) as { uptime: number; version: string };

    expect(response.status).toBe(200);
    expect(payload.version).toBe(packageJson.version);
    expect(payload.uptime).toBeGreaterThanOrEqual(0);
  });
});
