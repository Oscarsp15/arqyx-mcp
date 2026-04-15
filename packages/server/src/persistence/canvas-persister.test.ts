import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CanvasId, ErdCanvas, TableId } from '@arqyx/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type CanvasPersister, createFileCanvasPersister } from './canvas-persister.js';

const sampleCanvas: ErdCanvas = {
  id: 'canvas-1' as CanvasId,
  kind: 'erd',
  name: 'Mi base',
  tables: [
    {
      id: 'tbl-1' as TableId,
      name: 'users',
      columns: [],
      position: { x: 0, y: 0 },
    },
  ],
  relations: [],
};

describe('file canvas persister', () => {
  let directory: string;
  let persister: CanvasPersister;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'arqyx-test-'));
    persister = createFileCanvasPersister({ directory });
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('returns empty array when directory has no canvases', async () => {
    expect(await persister.loadAll()).toEqual([]);
  });

  it('saves and loads a canvas round-trip', async () => {
    await persister.save(sampleCanvas);
    const loaded = await persister.loadAll();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.name).toBe('Mi base');
    expect(loaded[0]?.kind).toBe('erd');
  });

  it('overwrites the file when saving the same canvas twice', async () => {
    await persister.save(sampleCanvas);
    const renamed: ErdCanvas = { ...sampleCanvas, name: 'Otro nombre' };
    await persister.save(renamed);
    const loaded = await persister.loadAll();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.name).toBe('Otro nombre');
  });

  it('deletes a canvas file', async () => {
    await persister.save(sampleCanvas);
    await persister.delete(sampleCanvas.id);
    expect(await persister.loadAll()).toEqual([]);
  });

  it('delete is a no-op when the file does not exist', async () => {
    await expect(persister.delete('missing' as CanvasId)).resolves.toBeUndefined();
  });

  it('skips corrupt json files without crashing', async () => {
    await persister.save(sampleCanvas);
    await writeFile(join(directory, 'broken.json'), '{not json', 'utf8');
    const loaded = await persister.loadAll();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe(sampleCanvas.id);
  });

  it('skips files that do not match the canvas schema', async () => {
    await persister.save(sampleCanvas);
    await writeFile(join(directory, 'invalid.json'), JSON.stringify({ foo: 'bar' }), 'utf8');
    const loaded = await persister.loadAll();
    expect(loaded).toHaveLength(1);
  });

  it('writes pretty-printed json for human inspection', async () => {
    await persister.save(sampleCanvas);
    const raw = await readFile(join(directory, `${sampleCanvas.id}.json`), 'utf8');
    expect(raw).toContain('\n');
    expect(raw.endsWith('\n')).toBe(true);
  });
});
