import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { Canvas, type CanvasId, DomainError } from '@arqyx/shared';

export type CanvasPersister = {
  save(canvas: Canvas): Promise<void>;
  delete(id: CanvasId): Promise<void>;
  loadAll(): Promise<Canvas[]>;
};

export type FilePersisterOptions = {
  directory?: string;
};

export function defaultCanvasDirectory(): string {
  return join(homedir(), '.arqyx', 'canvases');
}

export function createFileCanvasPersister(options: FilePersisterOptions = {}): CanvasPersister {
  const directory = resolve(options.directory ?? defaultCanvasDirectory());

  const filePathFor = (id: CanvasId): string => {
    const safeName = `${id}.json`;
    const resolved = resolve(join(directory, safeName));
    if (!resolved.startsWith(`${directory}`)) {
      throw new DomainError('INVALID_INPUT', 'Ruta de lienzo inválida.');
    }
    return resolved;
  };

  return {
    save: async (canvas) => {
      await mkdir(directory, { recursive: true });
      const path = filePathFor(canvas.id);
      const payload = `${JSON.stringify(canvas, null, 2)}\n`;
      await writeFile(path, payload, 'utf8');
    },
    delete: async (id) => {
      const path = filePathFor(id);
      try {
        await unlink(path);
      } catch (error) {
        if (isFileNotFound(error)) return;
        throw error;
      }
    },
    loadAll: async () => {
      let entries: string[];
      try {
        entries = await readdir(directory);
      } catch (error) {
        if (isFileNotFound(error)) return [];
        throw error;
      }

      const canvases: Canvas[] = [];
      for (const entry of entries) {
        if (!entry.endsWith('.json')) continue;
        const path = join(directory, entry);
        const raw = await readFile(path, 'utf8');
        let json: unknown;
        try {
          json = JSON.parse(raw);
        } catch {
          console.error(`[arqyx] Skipping corrupt canvas file: ${entry}`);
          continue;
        }
        const parsed = Canvas.safeParse(json);
        if (!parsed.success) {
          console.error(`[arqyx] Skipping invalid canvas file: ${entry}`);
          continue;
        }
        canvases.push(parsed.data);
      }
      return canvases;
    },
  };
}

function isFileNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'ENOENT'
  );
}
