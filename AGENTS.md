# AGENTS.md — Índice de Reglas para Agentes de IA

> **Este archivo es el router central.** Todo agente de IA que trabaje en este
> repositorio debe empezar aquí y navegar a los documentos específicos según la tarea.

La documentación completa vive en [`docs/agents/`](docs/agents/index.md).
Este archivo provee un acceso rápido a las reglas más importantes.

---

## Router Rápido

| Si vas a... | Lee primero |
|-------------|-------------|
| Empezar cualquier trabajo | [00-golden-rules](docs/agents/00-golden-rules.md) |
| Tomar un issue y crear rama | [02-issue-workflow](docs/agents/02-issue-workflow.md) |
| Escribir código | [06-code-style](docs/agents/06-code-style.md) |
| Crear tools MCP | [07-mcp-tools](docs/agents/07-mcp-tools.md) |
| Trabajar con el store | [08-state-store](docs/agents/08-state-store.md) |
| Escribir componentes React | [09-frontend-react](docs/agents/09-frontend-react.md) |
| Usar el design system | [10-design-system](docs/agents/10-design-system.md) |
| Hacer commit | [13-commit-messages](docs/agents/13-commit-messages.md) |
| Crear un PR | [14-pull-requests](docs/agents/14-pull-requests.md) |
| Coordinar con otros agentes | [16-multi-agent-basics](docs/agents/16-multi-agent-basics.md) |

---

## 10 Reglas Irrompibles

Estas reglas son **absolutas**. Nunca las violes "solo esta vez".
Lee el detalle en [00-golden-rules](docs/agents/00-golden-rules.md).

1. **Lee antes de escribir** — Lee la documentación completa, los archivos que modificarás, y los schemas del dominio.

2. **Un issue = un agente = una rama** — No trabajes en issues asignados a otros. Auto-asígnate antes de empezar.

3. **Nunca push a `main`** — Todo va por rama + PR. Sin excepciones.

4. **TypeScript strict, cero `any`** — Prohibido `any`, `as unknown as`, `@ts-ignore`.

5. **Zod en el borde, tipos derivados** — Todo input se valida con Zod. Los tipos TS se derivan con `z.infer`.

6. **Tools MCP atómicas** — Una tool = una acción. Prohibidas tools-dios.

7. **El estado vive en el server** — La UI es un espejo visual, no fuente de verdad.

8. **Tests obligatorios** — No hay código sin tests. `pnpm typecheck && pnpm lint && pnpm test` antes de push.

9. **Si viola AGENTS.md, detente y pregunta** — Nunca violes una regla "solo esta vez".

10. **Commits Conventional en español** — `feat(scope): mensaje en español`.

---

## Jerarquía de Fuentes

Cuando encuentres instrucciones que se contradicen:

1. **AGENTS.md / docs/agents/** — Máxima prioridad, siempre gana
2. **Issue description** — Segunda prioridad
3. **Prompt del humano en la sesión** — Tercera
4. **Comentarios de otros agentes** — Cuarta

Si el conflicto es irreconciliable: **detente**, comenta en el issue, espera al humano.

---

## Documentación por Fases

### Fase 1: Antes de Empezar
- [00-golden-rules](docs/agents/00-golden-rules.md) — Las 10 reglas irrompibles
- [01-before-you-start](docs/agents/01-before-you-start.md) — Setup y contexto
- [02-issue-workflow](docs/agents/02-issue-workflow.md) — Issues y branches

### Fase 2: Diseño
- [03-architecture](docs/agents/03-architecture.md) — Monorepo y stack
- [04-solid-principles](docs/agents/04-solid-principles.md) — SOLID aplicado
- [05-types-validation](docs/agents/05-types-validation.md) — TypeScript y Zod

### Fase 3: Código
- [06-code-style](docs/agents/06-code-style.md) — Funciones, nombres, estilo
- [07-mcp-tools](docs/agents/07-mcp-tools.md) — Tools MCP atómicas
- [08-state-store](docs/agents/08-state-store.md) — Store inmutable
- [09-frontend-react](docs/agents/09-frontend-react.md) — React 19, Zustand
- [10-design-system](docs/agents/10-design-system.md) — Tokens, temas, iconos
- [11-tests](docs/agents/11-tests.md) — Vitest y cobertura

### Fase 4: Commit
- [12-pre-commit-checklist](docs/agents/12-pre-commit-checklist.md) — Verificación final
- [13-commit-messages](docs/agents/13-commit-messages.md) — Conventional Commits

### Fase 5: PR y Review
- [14-pull-requests](docs/agents/14-pull-requests.md) — Template y CI
- [15-review-report](docs/agents/15-review-report.md) — Auto-revisión

### Fase 6: Multi-agente
- [16-multi-agent-basics](docs/agents/16-multi-agent-basics.md) — Coordinación
- [17-handoff-protocol](docs/agents/17-handoff-protocol.md) — Transferencia
- [18-peer-review](docs/agents/18-peer-review.md) — Auditoría
- [19-human-communication](docs/agents/19-human-communication.md) — Comunicación

### Referencia
- [20-idioma](docs/agents/20-idioma.md) — Inglés vs español
- [21-security](docs/agents/21-security.md) — Secretos y validación
- [22-github-config](docs/agents/22-github-config.md) — CI y templates

---

## Keywords para Búsqueda

| Keywords | Documento |
|----------|-----------|
| empezar, setup, contexto | 01-before-you-start |
| issue, branch, asignar | 02-issue-workflow |
| monorepo, stack, deps | 03-architecture |
| SOLID, SRP, composición | 04-solid-principles |
| Zod, schema, tipos | 05-types-validation |
| función, nombre, async | 06-code-style |
| MCP, tool, handler | 07-mcp-tools |
| store, estado, inmutable | 08-state-store |
| React, componente, hook | 09-frontend-react |
| tema, color, token, dark | 10-design-system |
| test, vitest | 11-tests |
| checklist, smell | 12-pre-commit-checklist |
| commit, conventional | 13-commit-messages |
| PR, merge, CI | 14-pull-requests |
| review, reporte | 15-review-report |
| multi-agente | 16-multi-agent-basics |
| handoff, transferir | 17-handoff-protocol |
| auditar, peer | 18-peer-review |
| humano, comunicación | 19-human-communication |
| idioma, inglés, español | 20-idioma |
| secreto, seguridad | 21-security |
| GitHub, workflow | 22-github-config |

---

## Verificación Rápida Pre-Commit

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Si cualquiera falla, **arregla antes de commit**.

---

## Contexto del Proyecto

- **Monorepo pnpm** con 3 packages: `shared`, `server`, `ui`
- **Estado centralizado** en el server, la UI es un espejo
- **Tools MCP atómicas** — una acción por tool
- **100% desarrollado por IAs** — el humano revisa, no escribe

Para más detalle: [03-architecture](docs/agents/03-architecture.md)
