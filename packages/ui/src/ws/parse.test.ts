import { describe, expect, it } from 'vitest';
import { parseServerMessage } from './parse.js';

describe('parseServerMessage', () => {
  it('returns null for invalid JSON', () => {
    expect(parseServerMessage('not json')).toBeNull();
    expect(parseServerMessage('')).toBeNull();
    expect(parseServerMessage('{unterminated')).toBeNull();
  });

  it('returns null for JSON that does not match the schema', () => {
    expect(parseServerMessage('{}')).toBeNull();
    expect(parseServerMessage('{"type":"unknown"}')).toBeNull();
    expect(parseServerMessage('{"type":"canvas:snapshot"}')).toBeNull();
  });

  it('parses a valid canvas:snapshot message', () => {
    const payload = JSON.stringify({
      type: 'canvas:snapshot',
      canvas: {
        id: 'canvas-1',
        kind: 'erd',
        name: 'Mi base',
        tables: [],
        relations: [],
      },
    });
    const result = parseServerMessage(payload);
    expect(result?.type).toBe('canvas:snapshot');
    expect(result?.type === 'canvas:snapshot' && result.canvas.name).toBe('Mi base');
  });

  it('parses a valid canvas:cleared message', () => {
    const result = parseServerMessage('{"type":"canvas:cleared"}');
    expect(result?.type).toBe('canvas:cleared');
  });
});
