import type { FlowCanvas, FlowEdge, FlowNode } from '@arqyx/shared';

export function generateMermaidFlowchart(
  canvas: FlowCanvas,
  direction: 'TD' | 'LR' = 'TD',
): string {
  const lines: string[] = [];
  lines.push(`flowchart ${direction}`);

  for (const node of canvas.nodes) {
    lines.push(`  ${generateNode(node)}`);
  }

  for (const edge of canvas.edges) {
    lines.push(`  ${generateEdge(edge)}`);
  }

  return lines.join('\n');
}

function generateNode(node: FlowNode): string {
  const safeLabel = sanitizeMermaidText(node.label);
  switch (node.shape) {
    case 'rectangle':
      return `${node.id}[${safeLabel}]`;
    case 'rounded':
      return `${node.id}(${safeLabel})`;
    case 'diamond':
      return `${node.id}{${safeLabel}}`;
    case 'circle':
      return `${node.id}((${safeLabel}))`;
    case 'note':
      return `${node.id}[/${safeLabel}/]`;
    default:
      // Fallback
      return `${node.id}[${safeLabel}]`;
  }
}

function generateEdge(edge: FlowEdge): string {
  const line = `${edge.from} -->`;

  if (edge.label) {
    return `${line}|${sanitizeMermaidText(edge.label)}| ${edge.to}`;
  }

  return `${line} ${edge.to}`;
}

function sanitizeMermaidText(text: string): string {
  return text.trim().replace(/["\[\](){}|]/g, '_');
}
