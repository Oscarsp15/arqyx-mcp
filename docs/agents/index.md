# Guía para Agentes de IA — Índice Central

> **Este índice es el router semántico del proyecto.** Si eres un agente de IA
> trabajando en este repositorio, empieza aquí.

---

## Router Rápido

| Si vas a...                                      | Lee primero                                      |
|--------------------------------------------------|--------------------------------------------------|
| Empezar a trabajar en cualquier tarea            | [00-golden-rules](00-golden-rules.md)            |
| Entender el setup inicial y contexto             | [01-before-you-start](01-before-you-start.md)    |
| Tomar un issue y crear una rama                  | [02-issue-workflow](02-issue-workflow.md)        |
| Entender la arquitectura del monorepo            | [03-architecture](03-architecture.md)            |
| Aplicar principios SOLID                         | [04-solid-principles](04-solid-principles.md)    |
| Trabajar con tipos y Zod                         | [05-types-validation](05-types-validation.md)    |
| Escribir código (funciones, nombres, estilo)     | [06-code-style](06-code-style.md)                |
| Crear o modificar tools MCP                      | [07-mcp-tools](07-mcp-tools.md)                  |
| Trabajar con el store inmutable                  | [08-state-store](08-state-store.md)              |
| Escribir componentes React / UI                  | [09-frontend-react](09-frontend-react.md)        |
| Usar el design system (colores, temas, iconos)   | [10-design-system](10-design-system.md)          |
| Escribir o modificar tests                       | [11-tests](11-tests.md)                          |
| Verificar antes de commit                        | [12-pre-commit-checklist](12-pre-commit-checklist.md) |
| Escribir mensajes de commit                      | [13-commit-messages](13-commit-messages.md)      |
| Crear o actualizar un PR                         | [14-pull-requests](14-pull-requests.md)          |
| Auto-revisar tu trabajo                          | [15-review-report](15-review-report.md)          |
| Coordinar con otros agentes                      | [16-multi-agent-basics](16-multi-agent-basics.md)|
| Transferir trabajo a otro agente                 | [17-handoff-protocol](17-handoff-protocol.md)    |
| Revisar el trabajo de otro agente                | [18-peer-review](18-peer-review.md)              |
| Comunicarte con el humano                        | [19-human-communication](19-human-communication.md) |
| Usar el idioma correcto (inglés/español)         | [20-idioma](20-idioma.md)                        |
| Manejar secretos y seguridad                     | [21-security](21-security.md)                    |
| Configurar archivos de GitHub                    | [22-github-config](22-github-config.md)          |

---

## 10 Reglas Irrompibles (Quick Reference)

Estas reglas son **absolutas**. Lee el detalle en [00-golden-rules](00-golden-rules.md).

1. **Lee antes de escribir** — Lee AGENTS.md completo, los archivos que modificarás, y los schemas del dominio.
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

1. **AGENTS.md** — Máxima prioridad, siempre gana
2. **Issue description** — Segunda prioridad
3. **Prompt del humano en la sesión** — Tercera
4. **Comentarios de otros agentes** — Cuarta

Si el conflicto es irreconciliable: **detente**, comenta en el issue explicando el conflicto, y espera decisión del humano.

---

## Índice por Fases del Ciclo de Desarrollo

### Fase 1: Antes de Empezar
- [00-golden-rules](00-golden-rules.md) — Las 10 reglas irrompibles
- [01-before-you-start](01-before-you-start.md) — Setup inicial y contexto
- [02-issue-workflow](02-issue-workflow.md) — Issues, branches y asignación

### Fase 2: Mientras Diseñas
- [03-architecture](03-architecture.md) — Monorepo, stack, dependencias
- [04-solid-principles](04-solid-principles.md) — SOLID aplicado a este proyecto
- [05-types-validation](05-types-validation.md) — TypeScript strict y Zod

### Fase 3: Mientras Escribes
- [06-code-style](06-code-style.md) — Funciones, nombres, control de flujo
- [07-mcp-tools](07-mcp-tools.md) — Cómo escribir tools MCP atómicas
- [08-state-store](08-state-store.md) — El store inmutable del server
- [09-frontend-react](09-frontend-react.md) — React 19, Zustand, efectos
- [10-design-system](10-design-system.md) — Tokens, temas, iconos, accesibilidad
- [11-tests](11-tests.md) — Vitest y cobertura obligatoria

### Fase 4: Antes de Commit
- [12-pre-commit-checklist](12-pre-commit-checklist.md) — Verificación final
- [13-commit-messages](13-commit-messages.md) — Conventional Commits en español

### Fase 5: PR y Review
- [14-pull-requests](14-pull-requests.md) — Template, CI, tamaño
- [15-review-report](15-review-report.md) — Auto-revisión obligatoria

### Fase 6: Multi-agente
- [16-multi-agent-basics](16-multi-agent-basics.md) — Un issue = un agente
- [17-handoff-protocol](17-handoff-protocol.md) — Transferencia de trabajo
- [18-peer-review](18-peer-review.md) — Auditoría entre agentes
- [19-human-communication](19-human-communication.md) — Comentarios al humano

### Referencia Transversal
- [20-idioma](20-idioma.md) — Cuándo inglés, cuándo español
- [21-security](21-security.md) — Secretos y validación
- [22-github-config](22-github-config.md) — Archivos en `.github/`

---

## Keywords para Búsqueda

| Keywords                          | Documento                     |
|-----------------------------------|-------------------------------|
| empezar, setup, contexto          | 01-before-you-start           |
| issue, branch, asignar, backlog   | 02-issue-workflow             |
| monorepo, package, stack, deps    | 03-architecture               |
| SOLID, SRP, composición           | 04-solid-principles           |
| Zod, schema, tipos, validación    | 05-types-validation           |
| función, nombre, async, import    | 06-code-style                 |
| MCP, tool, handler, atómica       | 07-mcp-tools                  |
| store, estado, inmutable, emit    | 08-state-store                |
| React, componente, hook, useEffect| 09-frontend-react             |
| tema, color, token, dark, icono   | 10-design-system              |
| test, vitest, cobertura           | 11-tests                      |
| checklist, smell, verificar       | 12-pre-commit-checklist       |
| commit, mensaje, conventional     | 13-commit-messages            |
| PR, merge, CI, squash             | 14-pull-requests              |
| review, reporte, alternativas     | 15-review-report              |
| multi-agente, coordinar           | 16-multi-agent-basics         |
| handoff, transferir, abandonar    | 17-handoff-protocol           |
| auditar, peer review              | 18-peer-review                |
| humano, comunicación, pasos       | 19-human-communication        |
| idioma, inglés, español, ASCII    | 20-idioma                     |
| secreto, seguridad, .env          | 21-security                   |
| GitHub, workflow, template        | 22-github-config              |
