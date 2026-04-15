import { EventEmitter } from 'node:events';
import {
  type Canvas,
  type CanvasId,
  type ColumnId,
  DomainError,
  type ErdCanvas,
  type FlowCanvas,
  type FlowEdgeArrow,
  type FlowEdgeId,
  type FlowEdgeStyle,
  type FlowNodeColor,
  type FlowNodeId,
  type FlowNodeShape,
  type RelationKind,
  type SqlType,
  type TableId,
} from '@arqyx/shared';
import {
  addColumnToTable,
  addRelationToCanvas,
  addTableToCanvas,
  createEmptyErdCanvas,
  moveTableInCanvas,
  removeColumnFromTable,
  removeRelationFromCanvas,
  removeTableFromCanvas,
} from './erd-operations.js';
import {
  addNodeToFlow,
  connectNodesInFlow,
  createEmptyFlowCanvas,
  type FlowNodePatch,
  removeEdgeFromFlow,
  removeNodeFromFlow,
  updateNodeInFlow,
} from './flow-operations.js';
import type { IdGenerator } from './id-generator.js';

export type StoreEvent =
  | { type: 'canvas:created'; canvas: Canvas }
  | { type: 'canvas:updated'; canvas: Canvas }
  | { type: 'canvas:deleted'; id: CanvasId };

type StoreDeps = {
  canvasIdGenerator: IdGenerator;
  tableIdGenerator: IdGenerator;
  columnIdGenerator: IdGenerator;
  flowNodeIdGenerator: IdGenerator;
  flowEdgeIdGenerator: IdGenerator;
};

export type AddColumnInput = {
  name: string;
  type: SqlType;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
};

export type RelationEndpoints = {
  fromTable: TableId;
  fromColumn: ColumnId;
  toTable: TableId;
  toColumn: ColumnId;
};

export type AddRelationInput = RelationEndpoints & {
  kind: RelationKind;
};

export type AddFlowNodeInput = {
  shape: FlowNodeShape;
  color: FlowNodeColor;
  label: string;
  description: string | null;
  position: { x: number; y: number };
};

export type ConnectFlowNodesInput = {
  from: FlowNodeId;
  to: FlowNodeId;
  label: string | null;
  style: FlowEdgeStyle;
  arrow: FlowEdgeArrow;
};

export class CanvasStore {
  private readonly canvases = new Map<CanvasId, Canvas>();
  private readonly emitter = new EventEmitter();
  private readonly canvasIdGenerator: IdGenerator;
  private readonly tableIdGenerator: IdGenerator;
  private readonly columnIdGenerator: IdGenerator;
  private readonly flowNodeIdGenerator: IdGenerator;
  private readonly flowEdgeIdGenerator: IdGenerator;

  constructor(deps: StoreDeps) {
    this.canvasIdGenerator = deps.canvasIdGenerator;
    this.tableIdGenerator = deps.tableIdGenerator;
    this.columnIdGenerator = deps.columnIdGenerator;
    this.flowNodeIdGenerator = deps.flowNodeIdGenerator;
    this.flowEdgeIdGenerator = deps.flowEdgeIdGenerator;
  }

  on(listener: (event: StoreEvent) => void): () => void {
    this.emitter.on('event', listener);
    return () => this.emitter.off('event', listener);
  }

  rehydrate(canvas: Canvas): void {
    this.canvases.set(canvas.id, canvas);
  }

  list(): readonly Canvas[] {
    return Array.from(this.canvases.values());
  }

  get(id: CanvasId): Canvas | undefined {
    return this.canvases.get(id);
  }

  createErdCanvas(name: string): ErdCanvas {
    const id = this.canvasIdGenerator.next() as CanvasId;
    const canvas = createEmptyErdCanvas(id, name);
    this.canvases.set(id, canvas);
    this.emit({ type: 'canvas:created', canvas });
    return canvas;
  }

  addTable(
    canvasId: CanvasId,
    input: { name: string; position: { x: number; y: number } },
  ): ErdCanvas {
    const canvas = this.requireErdCanvas(canvasId);
    const tableId = this.tableIdGenerator.next() as TableId;
    const next = addTableToCanvas(canvas, {
      id: tableId,
      name: input.name,
      position: input.position,
    });
    this.canvases.set(canvasId, next);
    this.emit({ type: 'canvas:updated', canvas: next });
    return next;
  }

  addColumn(canvasId: CanvasId, tableId: TableId, input: AddColumnInput): ErdCanvas {
    const canvas = this.requireErdCanvas(canvasId);
    const columnId = this.columnIdGenerator.next() as ColumnId;
    const next = addColumnToTable(canvas, tableId, { id: columnId, ...input });
    this.canvases.set(canvasId, next);
    this.emit({ type: 'canvas:updated', canvas: next });
    return next;
  }

  removeColumn(canvasId: CanvasId, tableId: TableId, columnId: ColumnId): ErdCanvas {
    const canvas = this.requireErdCanvas(canvasId);
    const next = removeColumnFromTable(canvas, tableId, columnId);
    this.canvases.set(canvasId, next);
    this.emit({ type: 'canvas:updated', canvas: next });
    return next;
  }

  addRelation(canvasId: CanvasId, input: AddRelationInput): ErdCanvas {
    const canvas = this.requireErdCanvas(canvasId);
    const next = addRelationToCanvas(canvas, input);
    this.canvases.set(canvasId, next);
    this.emit({ type: 'canvas:updated', canvas: next });
    return next;
  }

  removeRelation(canvasId: CanvasId, endpoints: RelationEndpoints): ErdCanvas {
    const canvas = this.requireErdCanvas(canvasId);
    const next = removeRelationFromCanvas(canvas, endpoints);
    this.canvases.set(canvasId, next);
    this.emit({ type: 'canvas:updated', canvas: next });
    return next;
  }

  moveTable(canvasId: CanvasId, tableId: TableId, position: { x: number; y: number }): ErdCanvas {
    const canvas = this.requireErdCanvas(canvasId);
    const next = moveTableInCanvas(canvas, tableId, position);
    this.canvases.set(canvasId, next);
    this.emit({ type: 'canvas:updated', canvas: next });
    return next;
  }

  removeTable(canvasId: CanvasId, tableId: TableId): ErdCanvas {
    const canvas = this.requireErdCanvas(canvasId);
    const next = removeTableFromCanvas(canvas, tableId);
    this.canvases.set(canvasId, next);
    this.emit({ type: 'canvas:updated', canvas: next });
    return next;
  }

  createFlowCanvas(name: string): FlowCanvas {
    const id = this.canvasIdGenerator.next() as CanvasId;
    const canvas = createEmptyFlowCanvas(id, name);
    this.canvases.set(id, canvas);
    this.emit({ type: 'canvas:created', canvas });
    return canvas;
  }

  addFlowNode(canvasId: CanvasId, input: AddFlowNodeInput): FlowCanvas {
    const canvas = this.requireFlowCanvas(canvasId);
    const nodeId = this.flowNodeIdGenerator.next() as FlowNodeId;
    const next = addNodeToFlow(canvas, { id: nodeId, ...input });
    this.canvases.set(canvasId, next);
    this.emit({ type: 'canvas:updated', canvas: next });
    return next;
  }

  updateFlowNode(canvasId: CanvasId, nodeId: FlowNodeId, patch: FlowNodePatch): FlowCanvas {
    const canvas = this.requireFlowCanvas(canvasId);
    const next = updateNodeInFlow(canvas, nodeId, patch);
    this.canvases.set(canvasId, next);
    this.emit({ type: 'canvas:updated', canvas: next });
    return next;
  }

  removeFlowNode(canvasId: CanvasId, nodeId: FlowNodeId): FlowCanvas {
    const canvas = this.requireFlowCanvas(canvasId);
    const next = removeNodeFromFlow(canvas, nodeId);
    this.canvases.set(canvasId, next);
    this.emit({ type: 'canvas:updated', canvas: next });
    return next;
  }

  connectFlowNodes(canvasId: CanvasId, input: ConnectFlowNodesInput): FlowCanvas {
    const canvas = this.requireFlowCanvas(canvasId);
    const edgeId = this.flowEdgeIdGenerator.next() as FlowEdgeId;
    const next = connectNodesInFlow(canvas, { id: edgeId, ...input });
    this.canvases.set(canvasId, next);
    this.emit({ type: 'canvas:updated', canvas: next });
    return next;
  }

  removeFlowEdge(canvasId: CanvasId, edgeId: FlowEdgeId): FlowCanvas {
    const canvas = this.requireFlowCanvas(canvasId);
    const next = removeEdgeFromFlow(canvas, edgeId);
    this.canvases.set(canvasId, next);
    this.emit({ type: 'canvas:updated', canvas: next });
    return next;
  }

  delete(id: CanvasId): void {
    if (!this.canvases.delete(id)) return;
    this.emit({ type: 'canvas:deleted', id });
  }

  private requireFlowCanvas(id: CanvasId): FlowCanvas {
    const canvas = this.canvases.get(id);
    if (!canvas) {
      throw new DomainError('CANVAS_NOT_FOUND', 'No se encontró el lienzo solicitado.');
    }
    if (canvas.kind !== 'flow') {
      throw new DomainError(
        'CANVAS_WRONG_KIND',
        `Esta operación requiere un lienzo Flow, pero el lienzo es de tipo "${canvas.kind}".`,
      );
    }
    return canvas;
  }

  private requireErdCanvas(id: CanvasId): ErdCanvas {
    const canvas = this.canvases.get(id);
    if (!canvas) {
      throw new DomainError('CANVAS_NOT_FOUND', 'No se encontró el lienzo solicitado.');
    }
    if (canvas.kind !== 'erd') {
      throw new DomainError(
        'CANVAS_WRONG_KIND',
        `Esta operación requiere un lienzo ERD, pero el lienzo es de tipo "${canvas.kind}".`,
      );
    }
    return canvas;
  }

  private emit(event: StoreEvent): void {
    this.emitter.emit('event', event);
  }
}
