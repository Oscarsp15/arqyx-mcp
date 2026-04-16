import type { Edge } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import { reconcileEdges } from './reconcile-edges.js';

describe('reconcileEdges', () => {
  it('debe retornar las del server si el conteo cambia', () => {
    const localEdges: Edge[] = [{ id: '1', source: 'a', target: 'b' }];
    const serverEdges: Edge[] = [
      { id: '1', source: 'a', target: 'b' },
      { id: '2', source: 'b', target: 'c' },
    ];
    const result = reconcileEdges(localEdges, serverEdges);
    expect(result).toBe(serverEdges);
  });

  it('debe preservar referencia si no hay cambios', () => {
    const localEdge: Edge = { id: '1', source: 'a', target: 'b', label: 'rel' };
    const serverEdges: Edge[] = [{ id: '1', source: 'a', target: 'b', label: 'rel' }];
    const result = reconcileEdges([localEdge], serverEdges);
    expect(result[0]).toBe(localEdge);
  });

  it('debe actualizar si el label o animación cambia', () => {
    const localEdge: Edge = { id: '1', source: 'a', target: 'b', label: 'old', animated: false };
    const serverEdges: Edge[] = [
      { id: '1', source: 'a', target: 'b', label: 'new', animated: true },
    ];
    const result = reconcileEdges([localEdge], serverEdges);
    expect(result[0]?.label).toBe('new');
    expect(result[0]?.animated).toBe(true);
    expect(result[0]).not.toBe(localEdge);
  });
});
