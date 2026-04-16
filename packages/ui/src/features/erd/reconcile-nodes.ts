import type { Node } from '@xyflow/react';
import type { FlowNodeData } from '../flow/flow-node.js';
import type { TableNodeData } from './table-node.js';

/**
 * Reconcilia los nodos locales con los del servidor para evitar re-renders innecesarios.
 * Mantiene la referencia original del nodo si no hay cambios relevantes.
 * Prioriza la posición local si el nodo está siendo arrastrado (anti-jitter).
 */
export function reconcileNodes(localNodes: Node[], serverNodes: Node[]): Node[] {
  // Si no hay nodos locales, usamos los del servidor directamente
  if (localNodes.length === 0) return serverNodes;

  return serverNodes.map((serverNode) => {
    const localNode = localNodes.find((n) => n.id === serverNode.id);
    if (!localNode) return serverNode;

    const dataA = localNode.data as Record<string, unknown>;
    const dataB = serverNode.data as Record<string, unknown>;

    const labelChanged = dataA['label'] !== dataB['label'];
    const posChanged =
      localNode.position.x !== serverNode.position.x ||
      localNode.position.y !== serverNode.position.y;

    let specificChanged = false;

    // Comparación profunda por tipo de nodo (§5 TypeScript strict)
    if (serverNode.type === 'table') {
      const dataA = localNode.data as TableNodeData;
      const dataB = serverNode.data as TableNodeData;
      // Comparamos columnas (JSON.stringify es aceptable para este nivel de profundidad §20.5)
      specificChanged = JSON.stringify(dataA.columns) !== JSON.stringify(dataB.columns);
    } else if (serverNode.type === 'flow') {
      const dataA = localNode.data as FlowNodeData;
      const dataB = serverNode.data as FlowNodeData;
      specificChanged =
        dataA.shape !== dataB.shape ||
        dataA.color !== dataB.color ||
        dataA.description !== dataB.description;
    }

    if (labelChanged || posChanged || specificChanged) {
      return {
        ...localNode,
        data: serverNode.data,
        // Si estamos arrastrando, ignoramos la posición del servidor para evitar jitter
        position: localNode.dragging ? localNode.position : serverNode.position,
      };
    }

    return localNode;
  });
}
