import type { Tool } from './tool.js';
import { deleteCanvasTool } from './tools/canvas/delete-canvas.js';
import { listCanvasesTool } from './tools/canvas/list-canvases.js';
import { openCanvasTool } from './tools/canvas/open-canvas.js';
import { readCanvasTool } from './tools/canvas/read-canvas.js';
import { addColumnTool } from './tools/erd/add-column.js';
import { addRelationTool } from './tools/erd/add-relation.js';
import { addTableTool } from './tools/erd/add-table.js';
import { createErdCanvasTool } from './tools/erd/create-canvas.js';
import { removeColumnTool } from './tools/erd/remove-column.js';
import { removeRelationTool } from './tools/erd/remove-relation.js';
import { removeTableTool } from './tools/erd/remove-table.js';
import { addFlowNodeTool } from './tools/flow/add-node.js';
import { autoLayoutFlowTool } from './tools/flow/auto-layout.js';
import { connectFlowNodesTool } from './tools/flow/connect-nodes.js';
import { createFlowCanvasTool } from './tools/flow/create-canvas.js';
import { removeFlowEdgeTool } from './tools/flow/remove-edge.js';
import { removeFlowNodeTool } from './tools/flow/remove-node.js';
import { updateFlowNodeTool } from './tools/flow/update-node.js';

const allTools: readonly Tool[] = [
  openCanvasTool,
  readCanvasTool,
  listCanvasesTool,
  deleteCanvasTool,
  createErdCanvasTool,
  addTableTool,
  addColumnTool,
  removeColumnTool,
  addRelationTool,
  removeRelationTool,
  removeTableTool,
  createFlowCanvasTool,
  addFlowNodeTool,
  updateFlowNodeTool,
  removeFlowNodeTool,
  connectFlowNodesTool,
  removeFlowEdgeTool,
  autoLayoutFlowTool,
];

export function listTools(): readonly Tool[] {
  return allTools;
}

export function findTool(name: string): Tool | undefined {
  return allTools.find((tool) => tool.name === name);
}
