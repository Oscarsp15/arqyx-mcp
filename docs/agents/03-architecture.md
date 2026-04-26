# 03 — Arquitectura del Monorepo

> **Entiende la estructura antes de modificar.** Las dependencias son estrictas.

---

## 1. Estructura del Monorepo

```
arqyx-mcp/
├── packages/
│   ├── shared/          # Tipos, schemas Zod, contratos
│   ├── server/          # MCP server, estado, WebSocket
│   └── ui/              # React 19 + Vite + Tailwind
├── docs/
│   ├── agents/          # Documentación para IAs
│   └── adr/             # Architecture Decision Records
└── .github/             # CI, templates
```

**Regla**: no crees un 4º package sin justificarlo en un ADR (`docs/adr/NNN-titulo.md`).

---

## 2. Dependencias entre Packages

```
┌─────────────────────────────────────────────┐
│                   shared                     │
│         (no depende de nadie)               │
└─────────────────────────────────────────────┘
           ▲                    ▲
           │                    │
    ┌──────┴──────┐      ┌──────┴──────┐
    │   server    │      │     ui      │
    │ (→ shared)  │      │ (→ shared)  │
    └─────────────┘      └─────────────┘
           │                    │
           └────── WebSocket ───┘
              (mensajes tipados)
```

### Reglas de Importación

| Desde | Puede importar de | NO puede importar de |
|-------|-------------------|---------------------|
| `shared` | — | `server`, `ui` |
| `server` | `shared` | `ui` |
| `ui` | `shared` | `server` |

**Prohibido**: `ui` importa de `server` o viceversa. Se comunican por WebSocket con mensajes definidos en `shared`.

---

## 3. Responsabilidad de Cada Package

### `packages/shared`
- **Qué contiene**: tipos de dominio, schemas Zod, contratos de mensajes WS
- **Razón para cambiar**: cambia el modelo de dominio
- **NO contiene**: lógica de negocio, efectos, estado

```
shared/src/
├── schemas/           # Schemas Zod (Table, Column, AwsService, etc.)
├── types/             # Tipos derivados con z.infer
└── messages/          # Contratos de mensajes WebSocket
```

### `packages/server`
- **Qué contiene**: MCP server, store de estado, WebSocket hub
- **Razón para cambiar**: cambia cómo se procesa una acción o cómo se persiste
- **Dueño del estado**: toda mutación pasa por aquí

```
server/src/
├── mcp/
│   ├── tools/         # Una carpeta por dominio, un archivo por tool
│   └── server.ts      # Registro de tools
├── state/
│   └── store.ts       # Única fuente de verdad
└── web/
    └── ws-hub.ts      # WebSocket para UI
```

### `packages/ui`
- **Qué contiene**: React 19, componentes, estado visual
- **Razón para cambiar**: cambia la presentación o interacción
- **NO es dueña de**: estado de dominio (tablas, servicios, conexiones)

```
ui/src/
├── features/          # Componentes por dominio
│   ├── erd/          # Nodos de tabla, columnas
│   ├── flow/         # Canvas de flujo
│   └── aws/          # Servicios AWS
├── components/        # Componentes reutilizables (shadcn/ui)
├── stores/            # Zustand: solo estado visual
└── styles/
    └── globals.css    # Design tokens
```

---

## 4. Stack Fijo

| Área | Tecnología | Versión Mínima |
|------|------------|----------------|
| Lenguaje | TypeScript | 5.x strict |
| MCP SDK | `@modelcontextprotocol/sdk` | última |
| Web server | `fastify` | 4.x |
| WebSocket | `ws` | 8.x |
| Validación | `zod` | 3.x |
| UI Framework | React | 19.x |
| Build | Vite | 6.x |
| Estilos | Tailwind CSS | 4.x |
| Componentes | shadcn/ui | última |
| Iconos | Lucide | última |
| Canvas | `@xyflow/react` | 12.x |
| Estado UI | zustand | 5.x |
| Tests | vitest | 2.x |
| Lint/format | biome | 1.x |
| Package manager | pnpm | 9.x |

**Para añadir o cambiar algo del stack**: primero crea un ADR en `docs/adr/`.

---

## 5. Carpetas Prohibidas

**No existen** en este proyecto:
- `utils/`
- `helpers/`
- `common/`
- `misc/`
- `lib/` (genérica)

Todo vive en su feature, o en `shared` si es realmente transversal y tipado.

---

## 6. Comunicación Server ↔ UI

```
┌─────────────────────────────────────────────────────────────┐
│                       Server                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ MCP Tools   │───▶│   Store     │───▶│  WS Hub     │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│                                               │              │
│                                               │ emit         │
└───────────────────────────────────────────────┼──────────────┘
                                                │
                                          WebSocket
                                                │
┌───────────────────────────────────────────────┼──────────────┐
│                                               ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  UI Store   │◀───│  WS Hook    │◀───│   WS        │      │
│  │  (visual)   │    │             │    │   Client    │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│                            UI                                │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **MCP tool** recibe una acción (ej. `add_table`)
2. Tool valida input con Zod y llama a **store**
3. Store muta el estado y **emite evento** por WS hub
4. WS hub envía mensaje tipado a todos los clientes
5. UI recibe mensaje, actualiza su copia local, re-renderiza

---

## 7. ADRs (Architecture Decision Records)

Para decisiones arquitectónicas que afectan el proyecto:

1. Crea un archivo en `docs/adr/NNN-titulo.md`
2. Usa la plantilla en `docs/adr/000-template.md`
3. Incluye: contexto, opciones consideradas, decisión, consecuencias

Ejemplos que requieren ADR:
- Añadir un nuevo package al monorepo
- Cambiar una tecnología del stack
- Modificar el flujo de datos server ↔ UI
- Añadir una dependencia mayor

---

## 8. Dependencias Externas

### Antes de Añadir una Dependencia

1. **Pregunta**: ¿es realmente necesaria?
2. **Verifica**: > 1000 descargas semanales, > 1 año de vida, mantenida activamente
3. **Licencia**: no GPL/AGPL (incompatible)
4. **Justifica** en el commit por qué se necesita

### Prohibidas por Defecto

- `lodash` — usa métodos nativos de JS
- `moment` — usa `Temporal` o `date-fns` si hace falta
- `axios` — usa `fetch` nativo
- Cualquier librería con > 6 meses sin update

### Al Añadir una Dependencia

```bash
# Instalar en el package correcto
pnpm --filter @arqyx/<package> add <dep>

# Para dev dependencies
pnpm --filter @arqyx/<package> add -D <dep>
```
