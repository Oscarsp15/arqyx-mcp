import type { CanvasId, FlowEdgeId, FlowNodeId } from '@arqyx/shared';
import { describe, expect, it } from 'vitest';
import { generateMermaidFlowchart } from './flow-mermaid.js';
import { addNodeToFlow, connectNodesInFlow, createEmptyFlowCanvas } from './flow-operations.js';

describe('generateMermaidFlowchart', () => {
  const canvasId = 'c1' as CanvasId;

  it('generates an empty flowchart with default direction', () => {
    const canvas = createEmptyFlowCanvas(canvasId, 'Mi Canvas');
    const mermaid = generateMermaidFlowchart(canvas);
    expect(mermaid).toBe('flowchart TD');
  });

  it('generates an empty flowchart with LR direction', () => {
    const canvas = createEmptyFlowCanvas(canvasId, 'Mi Canvas');
    const mermaid = generateMermaidFlowchart(canvas, 'LR');
    expect(mermaid).toBe('flowchart LR');
  });

  it('generates a flowchart with nodes of different shapes', () => {
    let canvas = createEmptyFlowCanvas(canvasId, 'Test');
    canvas = addNodeToFlow(canvas, {
      id: 'n1' as FlowNodeId,
      label: 'Start (User)',
      shape: 'rounded',
      color: 'blue',
      description: null,
      position: { x: 0, y: 0 },
    });
    canvas = addNodeToFlow(canvas, {
      id: 'n2' as FlowNodeId,
      label: 'Is valid?',
      shape: 'diamond',
      color: 'amber',
      description: null,
      position: { x: 0, y: 0 },
    });
    canvas = addNodeToFlow(canvas, {
      id: 'n3' as FlowNodeId,
      label: 'Process',
      shape: 'rectangle',
      color: 'green',
      description: null,
      position: { x: 0, y: 0 },
    });
    canvas = addNodeToFlow(canvas, {
      id: 'n4' as FlowNodeId,
      label: 'End',
      shape: 'circle',
      color: 'red',
      description: null,
      position: { x: 0, y: 0 },
    });
    canvas = addNodeToFlow(canvas, {
      id: 'n5' as FlowNodeId,
      label: 'Logging Info',
      shape: 'note',
      color: 'neutral',
      description: null,
      position: { x: 0, y: 0 },
    });

    const mermaid = generateMermaidFlowchart(canvas);
    const expected = `flowchart TD
  n1(Start _User_)
  n2{Is valid?}
  n3[Process]
  n4((End))
  n5[/Logging Info/]`;
    expect(mermaid).toBe(expected);
  });

  it('generates a flowchart with edges and labels', () => {
    let canvas = createEmptyFlowCanvas(canvasId, 'Test');
    const n1 = 'n1' as FlowNodeId;
    const n2 = 'n2' as FlowNodeId;

    canvas = addNodeToFlow(canvas, {
      id: n1,
      label: 'State A',
      shape: 'rectangle',
      color: 'neutral',
      description: null,
      position: { x: 0, y: 0 },
    });
    canvas = addNodeToFlow(canvas, {
      id: n2,
      label: 'State B',
      shape: 'rectangle',
      color: 'neutral',
      description: null,
      position: { x: 0, y: 0 },
    });

    canvas = connectNodesInFlow(canvas, {
      id: 'e1' as FlowEdgeId,
      from: n1,
      to: n2,
      label: 'Transition',
      style: 'solid',
      arrow: 'single',
    });

    canvas = connectNodesInFlow(canvas, {
      id: 'e2' as FlowEdgeId,
      from: n2,
      to: n1,
      label: null,
      style: 'dashed',
      arrow: 'none',
    });

    const mermaid = generateMermaidFlowchart(canvas);
    const expected = `flowchart TD
  n1[State A]
  n2[State B]
  n1 -->|Transition| n2
  n2 --> n1`;
    expect(mermaid).toBe(expected);
  });
});
