import type { Edge } from '@xyflow/react';

/**
 * Reconcilia las aristas (edges) locales con las del servidor.
 * Mantiene la referencia original si no hay cambios estructurales o visuales.
 */
export function reconcileEdges(localEdges: Edge[], serverEdges: Edge[]): Edge[] {
  // Si no hay aristas locales o el número cambió, reemplazo total
  if (localEdges.length === 0 || localEdges.length !== serverEdges.length) {
    return serverEdges;
  }

  return serverEdges.map((serverEdge) => {
    const localEdge = localEdges.find((e) => e.id === serverEdge.id);
    if (!localEdge) return serverEdge;

    // Comparamos propiedades estructurales y visuales clave
    const changed =
      localEdge.source !== serverEdge.source ||
      localEdge.target !== serverEdge.target ||
      localEdge.label !== serverEdge.label ||
      localEdge.animated !== serverEdge.animated;

    return changed ? serverEdge : localEdge;
  });
}
