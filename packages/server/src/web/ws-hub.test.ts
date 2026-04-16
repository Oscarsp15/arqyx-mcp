import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { TableId } from '@arqyx/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { createSequentialGenerator } from '../state/id-generator.js';
import { CanvasStore } from '../state/store.js';
import { attachWsHub } from './ws-hub.js';

function createTestStore(): CanvasStore {
  return new CanvasStore({
    canvasIdGenerator: createSequentialGenerator('canvas'),
    tableIdGenerator: createSequentialGenerator('tbl'),
    columnIdGenerator: createSequentialGenerator('col'),
    flowNodeIdGenerator: createSequentialGenerator('node'),
    flowEdgeIdGenerator: createSequentialGenerator('edge'),
  });
}

describe('WsHub (WebSocket Server)', () => {
  let server: ReturnType<typeof createServer>;
  let wsHub: ReturnType<typeof attachWsHub>;
  let store: CanvasStore;
  let port: number;
  let clients: WebSocket[] = [];

  beforeEach(async () => {
    clients = [];
    server = createServer();
    store = createTestStore();
    wsHub = attachWsHub(server, store);

    await new Promise<void>((resolve) => {
      server.listen(0, 'localhost', () => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterEach(async () => {
    for (const c of clients) c.terminate();
    await wsHub.close();
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('handles erd:table:add message', async () => {
    const canvas = store.createErdCanvas('Test Canvas');

    const client = new WebSocket(`ws://localhost:${port}/ws`);
    clients.push(client);
    await new Promise<void>((resolve) => client.on('open', resolve));

    const msg = {
      type: 'erd:table:add',
      canvasId: canvas.id,
      name: 'new_table',
      position: { x: 50, y: 100 },
    };

    client.send(JSON.stringify(msg));

    await new Promise((r) => setTimeout(r, 100));

    const updatedCanvas = store.get(canvas.id);
    expect(updatedCanvas?.kind).toBe('erd');
    if (updatedCanvas?.kind === 'erd') {
      expect(updatedCanvas.tables).toHaveLength(1);
      expect(updatedCanvas.tables[0]?.name).toBe('new_table');
      expect(updatedCanvas.tables[0]?.position.x).toBe(50);
    }
  });

  it('handles erd:table:rename message', async () => {
    const canvas = store.createErdCanvas('Test Canvas');
    // Using manual store assignment for precise ID targeting
    store.addTable(canvas.id, { name: 'old_table', position: { x: 0, y: 0 } });
    const updatedCanvas1 = store.get(canvas.id);
    const tableId = updatedCanvas1?.kind === 'erd' ? updatedCanvas1.tables[0]?.id : '';

    const client = new WebSocket(`ws://localhost:${port}/ws`);
    clients.push(client);
    await new Promise<void>((resolve) => client.on('open', resolve));

    const msg = {
      type: 'erd:table:rename',
      canvasId: canvas.id,
      tableId: tableId,
      newName: 'renamed_table',
    };

    client.send(JSON.stringify(msg));
    await new Promise((r) => setTimeout(r, 100));

    const updatedCanvas = store.get(canvas.id);
    if (updatedCanvas?.kind === 'erd') {
      expect(updatedCanvas.tables[0]?.name).toBe('renamed_table');
    }
  });

  it('handles erd:table:remove message', async () => {
    const canvas = store.createErdCanvas('Test Canvas');
    store.addTable(canvas.id, { name: 'table_to_remove', position: { x: 0, y: 0 } });
    const updatedCanvas1 = store.get(canvas.id);
    const tableId = updatedCanvas1?.kind === 'erd' ? updatedCanvas1.tables[0]?.id : '';

    const client = new WebSocket(`ws://localhost:${port}/ws`);
    clients.push(client);
    await new Promise<void>((resolve) => client.on('open', resolve));

    const msg = {
      type: 'erd:table:remove',
      canvasId: canvas.id,
      tableId: tableId,
    };

    client.send(JSON.stringify(msg));
    await new Promise((r) => setTimeout(r, 100));

    const updatedCanvas = store.get(canvas.id);
    if (updatedCanvas?.kind === 'erd') {
      expect(updatedCanvas.tables).toHaveLength(0);
    }
  });

  it('handles erd:column:add message', async () => {
    const canvas = store.createErdCanvas('Test Canvas');
    store.addTable(canvas.id, { name: 'test_table', position: { x: 0, y: 0 } });
    const canvasWithTable = store.get(canvas.id);
    const tableId = canvasWithTable?.kind === 'erd' ? canvasWithTable.tables[0]?.id : '';

    const client = new WebSocket(`ws://localhost:${port}/ws`);
    clients.push(client);
    await new Promise<void>((resolve) => client.on('open', resolve));

    client.send(
      JSON.stringify({
        type: 'erd:column:add',
        canvasId: canvas.id,
        tableId,
        name: 'user_id',
        colType: 'uuid',
        isPrimaryKey: true,
        isNullable: false,
        isUnique: true,
      }),
    );
    await new Promise((r) => setTimeout(r, 100));

    const updated = store.get(canvas.id);
    if (updated?.kind === 'erd') {
      expect(updated.tables[0]?.columns).toHaveLength(1);
      expect(updated.tables[0]?.columns[0]?.name).toBe('user_id');
      expect(updated.tables[0]?.columns[0]?.type).toBe('uuid');
    }
  });

  it('handles erd:column:rename message', async () => {
    const canvas = store.createErdCanvas('Test Canvas');
    store.addTable(canvas.id, { name: 'test_table', position: { x: 0, y: 0 } });
    const canvasWithTable = store.get(canvas.id);
    const tableId = canvasWithTable?.kind === 'erd' ? canvasWithTable.tables[0]?.id : '';
    store.addColumn(canvas.id, tableId as TableId, {
      name: 'old_name',
      type: 'text',
      isPrimaryKey: false,
      isNullable: true,
      isUnique: false,
    });
    const canvasWithCol = store.get(canvas.id);
    const columnId = canvasWithCol?.kind === 'erd' ? canvasWithCol.tables[0]?.columns[0]?.id : '';

    const client = new WebSocket(`ws://localhost:${port}/ws`);
    clients.push(client);
    await new Promise<void>((resolve) => client.on('open', resolve));

    client.send(
      JSON.stringify({
        type: 'erd:column:rename',
        canvasId: canvas.id,
        tableId,
        columnId,
        newName: 'new_name',
      }),
    );
    await new Promise((r) => setTimeout(r, 100));

    const updated = store.get(canvas.id);
    if (updated?.kind === 'erd') {
      expect(updated.tables[0]?.columns[0]?.name).toBe('new_name');
    }
  });

  it('handles erd:column:edit message', async () => {
    const canvas = store.createErdCanvas('Test Canvas');
    store.addTable(canvas.id, { name: 'test_table', position: { x: 0, y: 0 } });
    const canvasWithTable = store.get(canvas.id);
    const tableId = canvasWithTable?.kind === 'erd' ? canvasWithTable.tables[0]?.id : '';
    store.addColumn(canvas.id, tableId as TableId, {
      name: 'col',
      type: 'text',
      isPrimaryKey: false,
      isNullable: true,
      isUnique: false,
    });
    const canvasWithCol = store.get(canvas.id);
    const columnId = canvasWithCol?.kind === 'erd' ? canvasWithCol.tables[0]?.columns[0]?.id : '';

    const client = new WebSocket(`ws://localhost:${port}/ws`);
    clients.push(client);
    await new Promise<void>((resolve) => client.on('open', resolve));

    client.send(
      JSON.stringify({
        type: 'erd:column:edit',
        canvasId: canvas.id,
        tableId,
        columnId,
        colType: 'int',
        isNullable: false,
      }),
    );
    await new Promise((r) => setTimeout(r, 100));

    const updated = store.get(canvas.id);
    if (updated?.kind === 'erd') {
      expect(updated.tables[0]?.columns[0]?.type).toBe('int');
      expect(updated.tables[0]?.columns[0]?.isNullable).toBe(false);
    }
  });

  it('handles erd:column:remove message', async () => {
    const canvas = store.createErdCanvas('Test Canvas');
    store.addTable(canvas.id, { name: 'test_table', position: { x: 0, y: 0 } });
    const canvasWithTable = store.get(canvas.id);
    const tableId = canvasWithTable?.kind === 'erd' ? canvasWithTable.tables[0]?.id : '';
    store.addColumn(canvas.id, tableId as TableId, {
      name: 'col_to_remove',
      type: 'text',
      isPrimaryKey: false,
      isNullable: true,
      isUnique: false,
    });
    const canvasWithCol = store.get(canvas.id);
    const columnId = canvasWithCol?.kind === 'erd' ? canvasWithCol.tables[0]?.columns[0]?.id : '';

    const client = new WebSocket(`ws://localhost:${port}/ws`);
    clients.push(client);
    await new Promise<void>((resolve) => client.on('open', resolve));

    client.send(
      JSON.stringify({ type: 'erd:column:remove', canvasId: canvas.id, tableId, columnId }),
    );
    await new Promise((r) => setTimeout(r, 100));

    const updated = store.get(canvas.id);
    if (updated?.kind === 'erd') {
      expect(updated.tables[0]?.columns).toHaveLength(0);
    }
  });
});
