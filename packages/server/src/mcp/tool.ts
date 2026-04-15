import type { z } from 'zod';
import type { CanvasStore } from '../state/store.js';

export type ToolContext = {
  store: CanvasStore;
  getCanvasUrl: () => string;
};

export type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
};

export type ToolDefinition<TInput extends z.ZodTypeAny> = {
  name: string;
  description: string;
  inputSchema: TInput;
  handler: (input: z.infer<TInput>, context: ToolContext) => Promise<ToolResult> | ToolResult;
};

export type Tool = {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: z.ZodTypeAny;
  readonly handler: (input: unknown, context: ToolContext) => Promise<ToolResult>;
};

export function defineTool<TInput extends z.ZodTypeAny>(definition: ToolDefinition<TInput>): Tool {
  return {
    name: definition.name,
    description: definition.description,
    inputSchema: definition.inputSchema,
    handler: async (input, context) => {
      const parsed = definition.inputSchema.parse(input);
      return definition.handler(parsed, context);
    },
  };
}
