import type { Node } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import { reconcileNodes } from './reconcile-nodes.js';

describe('reconcileNodes', () => {
  it('debe retornar el nodo del server si no existe localmente (nodo nuevo)', () => {
    const localNodes: Node[] = [];
    const serverNodes: Node[] = [
      { id: '1', type: 'table', position: { x: 0, y: 0 }, data: { label: 'T1', columns: [] } },
    ];
    const result = reconcileNodes(localNodes, serverNodes);
    expect(result).toEqual(serverNodes);
  });

  it('debe retornar el nodo local si no hay cambios relevantes (preservar referencia)', () => {
    const localNode: Node = {
      id: '1',
      type: 'table',
      position: { x: 10, y: 10 },
      data: { label: 'T1', columns: [] },
      measured: { width: 100, height: 100 },
    };
    const serverNodes: Node[] = [
      { id: '1', type: 'table', position: { x: 10, y: 10 }, data: { label: 'T1', columns: [] } },
    ];
    const result = reconcileNodes([localNode], serverNodes);
    expect(result[0]).toBe(localNode); // Referencia idéntica
  });

  it('debe actualizar si el label cambia', () => {
    const localNode: Node = {
      id: '1',
      type: 'table',
      position: { x: 10, y: 10 },
      data: { label: 'Old', columns: [] },
    };
    const serverNodes: Node[] = [
      { id: '1', type: 'table', position: { x: 10, y: 10 }, data: { label: 'New', columns: [] } },
    ];
    const result = reconcileNodes([localNode], serverNodes);
    expect((result[0]?.data as Record<string, unknown>)['label']).toBe('New');
    expect(result[0]).not.toBe(localNode); // Nueva referencia
  });

  it('debe ignorar cambio de posición si dragging=true (anti-jitter)', () => {
    const localNode: Node = {
      id: '1',
      type: 'table',
      position: { x: 100, y: 100 }, // Posición actual del drag
      data: { label: 'T1', columns: [] },
      dragging: true,
    };
    const serverNodes: Node[] = [
      { id: '1', type: 'table', position: { x: 50, y: 50 }, data: { label: 'T1', columns: [] } }, // Snapshot antiguo
    ];
    const result = reconcileNodes([localNode], serverNodes);
    expect(result[0]?.position).toEqual({ x: 100, y: 100 });
  });

  it('debe actualizar si las columnas cambian en ERD', () => {
    const localNode: Node = {
      id: '1',
      type: 'table',
      position: { x: 0, y: 0 },
      data: { label: 'T1', columns: [{ id: 'c1', name: 'id' }] },
    };
    const serverNodes: Node[] = [
      {
        id: '1',
        type: 'table',
        position: { x: 0, y: 0 },
        data: {
          label: 'T1',
          columns: [
            { id: 'c1', name: 'id' },
            { id: 'c2', name: 'name' },
          ],
        },
      },
    ];
    const result = reconcileNodes([localNode], serverNodes);
    expect((result[0]?.data as Record<string, unknown>)['columns']).toHaveLength(2);
  });

  it('debe actualizar propiedades visuales en nodos Flow', () => {
    const localNode: Node = {
      id: 'flow1',
      type: 'flow',
      position: { x: 0, y: 0 },
      data: { label: 'F1', shape: 'rectangle', color: 'blue', description: null },
    };
    const serverNodes: Node[] = [
      {
        id: 'flow1',
        type: 'flow',
        position: { x: 0, y: 0 },
        data: { label: 'F1', shape: 'circle', color: 'red', description: 'desc' },
      },
    ];
    const result = reconcileNodes([localNode], serverNodes);
    expect((result[0]?.data as Record<string, unknown>)['shape']).toBe('circle');
    expect((result[0]?.data as Record<string, unknown>)['color']).toBe('red');
  });
});
