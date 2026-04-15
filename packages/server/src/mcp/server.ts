import { DomainError } from '@arqyx/shared';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { CanvasStore } from '../state/store.js';
import { findTool, listTools } from './tool-registry.js';
import type { ToolContext } from './tool.js';

type McpServerDeps = {
  store: CanvasStore;
  getCanvasUrl: () => string;
};

export function createMcpServer(deps: McpServerDeps): Server {
  const server = new Server({ name: 'arqyx', version: '0.0.1' }, { capabilities: { tools: {} } });

  const context: ToolContext = {
    store: deps.store,
    getCanvasUrl: deps.getCanvasUrl,
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: listTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema, { $refStrategy: 'none' }) as Record<
        string,
        unknown
      >,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = findTool(request.params.name);
    if (!tool) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Herramienta desconocida: ${request.params.name}`,
          },
        ],
      };
    }

    try {
      const result = await tool.handler(request.params.arguments ?? {}, context);
      return result;
    } catch (error) {
      if (error instanceof DomainError) {
        return {
          isError: true,
          content: [{ type: 'text', text: `[${error.code}] ${error.message}` }],
        };
      }
      if (error instanceof Error) {
        return {
          isError: true,
          content: [{ type: 'text', text: error.message }],
        };
      }
      throw error;
    }
  });

  return server;
}

export async function startMcpServer(deps: McpServerDeps): Promise<void> {
  const server = createMcpServer(deps);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
