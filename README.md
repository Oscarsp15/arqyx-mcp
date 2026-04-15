# Arqyx

**MCP para diseñar bases de datos y arquitecturas AWS en vivo**, con lienzo
editable en el navegador. Compatible con Claude Desktop, Claude Code (CLI) y
cualquier cliente MCP.

> ⚠️ **Lee [`AGENTS.md`](./AGENTS.md) antes de tocar una sola línea.** Este
> proyecto lo desarrollan agentes de IA siguiendo reglas estrictas.

## Arquitectura

Monorepo pnpm con 3 packages:

- **`@arqyx/shared`** — tipos y schemas Zod del dominio (canvas, ERD, AWS).
  Sin dependencias a otros packages.
- **`@arqyx/server`** — MCP server (stdio) + Fastify + WebSocket hub. Fuente
  única de verdad del estado.
- **`@arqyx/ui`** — React 19 + Vite + Tailwind v4 + shadcn/ui + React Flow.
  Lienzo editable con tema claro/oscuro.

El server y la UI se comunican **solo por WebSocket** con mensajes tipados
definidos en `shared`.

## Stack

| Capa              | Elección                                 |
|-------------------|------------------------------------------|
| Lenguaje          | TypeScript strict                        |
| MCP SDK           | `@modelcontextprotocol/sdk`              |
| Web server        | `fastify`                                |
| WebSocket         | `ws`                                     |
| Validación        | `zod`                                    |
| UI framework      | React 19 + Vite                          |
| Styling           | Tailwind CSS v4 + shadcn/ui + Lucide     |
| Canvas            | `@xyflow/react` (React Flow)             |
| Estado UI         | `zustand`                                |
| Tests             | `vitest`                                 |
| Lint/format       | `biome`                                  |
| Package manager   | `pnpm`                                   |

## Alcance del MVP

3 casos, ni uno más hasta aprobación explícita:

1. **`open_canvas`** — abre el navegador con el lienzo.
2. **ERD mínimo** — `add_table`, `add_column`, `add_relation`, `read_canvas`.
3. **AWS mínimo** — `add_aws_service`, `connect_aws`, `group_vpc`.

## Comandos

```bash
pnpm install           # instalar dependencias
pnpm dev               # desarrollo en todos los packages
pnpm typecheck         # TypeScript strict en todos
pnpm lint              # biome check
pnpm test              # vitest
pnpm build             # build de producción
```

## Instalación en clientes MCP

### Claude Desktop
Edita `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "arqyx": {
      "command": "node",
      "args": ["<ruta-absoluta>/packages/server/dist/index.js"]
    }
  }
}
```

### Claude Code (CLI)
```bash
claude mcp add arqyx -- node <ruta-absoluta>/packages/server/dist/index.js
```
