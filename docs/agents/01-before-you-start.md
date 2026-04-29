# 01 — Antes de Empezar

> **Checklist obligatorio antes de escribir una sola línea de código.**

---

## 1. Contexto que Debes Conocer

Este proyecto:
- Se desarrolla **100% con agentes de IA** — el humano revisa, no escribe
- Usa un **monorepo pnpm** con 3 packages: `shared`, `server`, `ui`
- Tiene un **estado centralizado** en el server, la UI es un espejo
- Las **tools MCP son atómicas** — una acción por tool

Alcance MVP actual:
- `open_canvas` — crear/abrir lienzos
- ERD básico — tablas, columnas, relaciones
- AWS básico — servicios y conexiones

**Nada más hasta que el humano lo apruebe.**

---

## 2. Lectura Obligatoria

Antes de cada tarea, lee en este orden:

1. **Este índice** ([index.md](index.md)) — para saber qué más leer
2. **[00-golden-rules](00-golden-rules.md)** — las 10 reglas irrompibles
3. **Los archivos que vas a modificar** — enteros, no solo las líneas cercanas
4. **Los schemas Zod** del dominio afectado — en `packages/shared/src/schemas/`
5. **Los tests existentes** del área — para entender el comportamiento esperado

---

## 3. Antes de Proponer un Cambio

Responde por escrito estas preguntas:

| Pregunta | Tu respuesta |
|----------|--------------|
| **Objetivo** | ¿Qué problema resuelve este cambio en una frase? |
| **Alcance** | ¿Qué archivos tocarás y cuáles NO? |
| **Contrato** | ¿Qué tipos/schemas cambian? |
| **Secciones aplicables** | ¿Qué secciones de la documentación aplican? (cita números) |
| **Plan de tests** | ¿Qué tests añades o modificas? |
| **Riesgos** | ¿Qué podría romper? |

**Si el humano no ha aprobado este plan, no escribas código.**

---

## 4. Estructura del Repositorio

```
arqyx-mcp/
├── packages/
│   ├── shared/          # Tipos, schemas Zod, contratos
│   │   └── src/schemas/ # Todo tipo de dominio vive aquí
│   ├── server/          # MCP server, estado, WebSocket
│   │   ├── src/mcp/tools/  # Tools MCP por dominio
│   │   └── src/state/      # Store centralizado
│   └── ui/              # React 19 + Vite + Tailwind
│       └── src/features/   # Componentes por dominio
├── docs/
│   ├── agents/          # Esta documentación
│   └── adr/             # Architecture Decision Records
└── .github/
    ├── workflows/       # CI
    ├── ISSUE_TEMPLATE/  # Templates de issues
    └── PULL_REQUEST_TEMPLATE.md
```

---

## 5. Dependencias entre Packages

```
shared → (no depende de nadie)
server → depende de shared
ui     → depende de shared

ui ↔ server: NUNCA importan entre sí
             Se comunican por WebSocket con mensajes tipados
```

---

## 6. Comandos Básicos

```bash
# Instalar dependencias
pnpm install

# Type check
pnpm typecheck

# Lint
pnpm lint

# Tests
pnpm test

# Build
pnpm build

# Desarrollo UI
pnpm --filter @arqyx/ui dev

# Desarrollo server
pnpm --filter @arqyx/server dev
```

---

## 7. Stack Fijo (no se cambia sin ADR)

| Área | Tecnología |
|------|------------|
| Lenguaje | TypeScript strict |
| MCP SDK | `@modelcontextprotocol/sdk` |
| Web server | `fastify` |
| WebSocket | `ws` |
| Validación | `zod` |
| UI | React 19 + Vite + Tailwind CSS v4 + shadcn/ui + Lucide |
| Canvas | `@xyflow/react` (React Flow) |
| Estado UI | `zustand` |
| Tests | `vitest` |
| Lint/format | `biome` |
| Package manager | `pnpm` |

Para añadir algo nuevo al stack, primero crea un ADR en `docs/adr/`.

---

## 8. Qué NO Hacer

- **No inventes APIs, funciones o paquetes** — si no estás seguro de que existe, búscalo o pregunta
- **No copies patrones de otros proyectos** sin verificar que encajan con esta documentación
- **No generes código de ejemplo o placeholders** — o lo implementas completo, o no lo escribes
- **No respondas "ya está hecho"** sin haber corrido tests y type-check
- **No silencies errores** de TypeScript, lint o tests para "avanzar"
