# 00 — Las 10 Reglas Irrompibles

> **Estas reglas son absolutas.** Nunca las violes "solo esta vez". Si una tarea
> requiere violar alguna, **detente y pregunta al humano**.

---

## 1. Lee antes de escribir

Antes de tocar una sola línea de código:

1. Lee el índice de documentación ([index.md](index.md)) completo
2. Lee los archivos que vas a modificar **enteros**, no solo líneas cercanas
3. Lee los schemas Zod del dominio afectado en `packages/shared/src/schemas/`
4. Lee los tests existentes del área afectada

**Si no tienes claro QUÉ hacer y POR QUÉ, pregunta al humano. No adivines.**

---

## 2. Un issue = un agente = una rama

- Todo trabajo empieza con un issue en GitHub
- Auto-asígnate con `gh issue edit <N> --add-assignee @me` **antes** de crear rama
- Crea la rama con el número del issue: `<tipo>/<N>-<slug-corto>`
- **Nunca** trabajes en un issue asignado a otro agente
- **Nunca** te asignes más de 2 issues simultáneamente

Ver detalle en [02-issue-workflow](02-issue-workflow.md).

---

## 3. Nunca push a `main`

- `main` es sagrada. Siempre desplegable, siempre verde
- **Nada** se commitea directamente a `main`
- Todo pasa por rama + Pull Request
- El humano es quien mergea, nunca el agente

Ver detalle en [14-pull-requests](14-pull-requests.md).

---

## 4. TypeScript strict, cero `any`

Configuración obligatoria:
- `"strict": true`
- `"noUncheckedIndexedAccess": true`
- `"exactOptionalPropertyTypes": true`

**Prohibido**:
- `any`
- `as unknown as`
- `@ts-ignore`

Si de verdad hace falta suprimir un error, usa `// @ts-expect-error RAZÓN` con la razón explícita.

---

## 5. Zod en el borde, tipos derivados

- Todo input externo (tool calls MCP, mensajes WS, formularios) se valida con Zod
- Los schemas de dominio viven en `packages/shared/src/schemas/`
- El tipo TypeScript se deriva con `z.infer<typeof Schema>`, **nunca** se duplica manualmente

Ver detalle en [05-types-validation](05-types-validation.md).

---

## 6. Tools MCP atómicas

- Una tool = una acción
- Inputs mínimos, responsabilidad clara
- Cada tool vive en su archivo: `packages/server/src/mcp/tools/<dominio>/<accion>.ts`

**Prohibido**: tools-dios tipo `execute(action, params)`, `do(type, data)`, `manage(...)`.

Ver detalle en [07-mcp-tools](07-mcp-tools.md).

---

## 7. El estado vive en el server

- Única fuente de verdad: `packages/server/src/state/store.ts`
- El store es inmutable por fuera: devuelve copias o `readonly`
- Toda mutación pasa por métodos del store
- La UI **no** es dueña de estado de dominio — solo estado visual (selección, zoom, tema)
- Tras cada mutación, el store emite un evento por WebSocket

Ver detalle en [08-state-store](08-state-store.md).

---

## 8. Tests obligatorios

No hay código sin tests:
- Toda tool MCP tiene test unitario
- El store tiene tests de todas sus mutaciones
- Los schemas Zod tienen tests de casos válidos e inválidos

**Antes de push**, corre:
```bash
pnpm typecheck && pnpm lint && pnpm test
```

Si uno falla, arréglalo. No reportes "hecho con N errores menores".

Ver detalle en [11-tests](11-tests.md).

---

## 9. Si viola AGENTS.md, detente y pregunta

- Si una instrucción del issue contradice estas reglas, **AGENTS.md gana**
- Si no hay forma de cumplir ambos, **detente**
- Escribe un comentario en el issue explicando el conflicto
- Espera decisión del humano — nunca tomes por tu cuenta

Jerarquía de fuentes:
1. AGENTS.md (máxima prioridad)
2. Issue description
3. Prompt del humano en la sesión
4. Comentarios de otros agentes

---

## 10. Commits Conventional en español

Formato estricto: `<tipo>(<scope>): <mensaje en español>`

**Tipos válidos**: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `style`, `build`, `ci`, `revert`

**Scopes válidos**: nombre de package o dominio (`shared`, `server`, `ui`, `erd`, `flow`, `persistence`, `mcp`, `ws`)

Ejemplos:
- `feat(flow): añadir dominio FlowCanvas con 5 shapes`
- `fix(ws): validar mensajes entrantes antes de mutar el store`

Un commit = un cambio lógico atómico. Si el mensaje necesita "y", **divide**.

Ver detalle en [13-commit-messages](13-commit-messages.md).

---

## Verificación Rápida

Antes de reportar "hecho", verifica que puedes responder **sí** a todo:

- [ ] ¿Leí los archivos completos que modifiqué?
- [ ] ¿Mi rama tiene el formato `<tipo>/<N>-<slug>`?
- [ ] ¿Cero `any`, `as`, `@ts-ignore` en mi código?
- [ ] ¿Validé inputs con Zod en el borde?
- [ ] ¿Escribí tests para la lógica nueva?
- [ ] ¿`pnpm typecheck && pnpm lint && pnpm test` pasan?
- [ ] ¿Mi commit sigue Conventional Commits en español?
- [ ] ¿Respeté todas las reglas de AGENTS.md?
