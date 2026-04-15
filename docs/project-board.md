# Project board — Arqyx roadmap

El roadmap activo del proyecto vive en el **GitHub Project v2**
`Arqyx roadmap` bajo el owner `Oscarsp15`:

**URL**: https://github.com/users/Oscarsp15/projects/1

Este documento explica cómo usarlo siguiendo las reglas de AGENTS.md §23
(coordinación multi-agente) sin que el trabajo se bloquee.

## Filosofía — Kanban, no Scrum

No hay sprints, ni velocity, ni standups. El trabajo fluye de forma
continua. Un agente toma un issue del backlog, trabaja, abre PR, mergea, y
pasa al siguiente. Si se queda sin contexto, hace handoff (§23.3) y otro
agente lo retoma.

**WIP máximo por agente**: 2 issues simultáneos. Lee §23.1.

## Columnas del board

El board usa el campo `Status` con los valores por defecto de GitHub
Projects v2:

| Columna | Qué significa |
|---|---|
| **Todo** | Issue listo para tomar. Sin asignar. El backlog priorizado. |
| **In Progress** | Issue con un agente trabajándolo. Rama abierta, draft PR si lleva > 30 min. |
| **Done** | Issue cerrado por un PR mergeado. Auto-movido por GitHub al cerrar. |

Cuando el board necesite más granularidad (ej. `Blocked`, `In Review`), se
añade con `gh project field-create` o desde la UI.

## Ciclo de vida de un issue

1. **Creación**: manual o propuesta por un agente (§23.5). Labels
   obligatorios: `type:*`, `priority:*`, al menos un `area:*`.
2. **Entra al board automáticamente** cuando se añade como item.
3. **Backlog**: columna `Todo`, sin asignar.
4. **Toma**:
   - Un agente hace `gh issue edit N --add-assignee @me`.
   - Arrastra manualmente a `In Progress` en la UI o con
     `gh project item-edit`.
5. **Trabajo**: rama `<tipo>/<N>-<slug>`, commits con
   Conventional Commits en español (§21.3), draft PR cuando corresponda
   (§23.2).
6. **Review**: marca el PR como ready. El humano lo revisa.
7. **Merge**: squash-merge. Al mergear, el PR cierra el issue vía
   `Closes #N` y GitHub lo mueve a `Done` automáticamente.
8. **Rama eliminada** (automática por el setting
   `delete_branch_on_merge`).

## Comandos útiles

```bash
# Ver el backlog completo
gh project item-list 1 --owner Oscarsp15

# Filtrar issues por label
gh issue list --label "priority:high"
gh issue list --label "area:deps"
gh issue list --search "no:assignee"

# Tomar un issue (§23.1)
gh issue edit N --add-assignee @me
gh issue view N

# Crear un issue nuevo desde la línea de comandos (§23.5)
gh issue create --label "type:feat,priority:normal,area:erd" \
  --title "feat(erd): ..." --body "..."

# Añadir un issue existente al board
gh project item-add 1 --owner Oscarsp15 \
  --url https://github.com/Oscarsp15/arqyx-mcp/issues/N

# Liberar un issue (handoff, §23.3)
gh issue edit N --remove-assignee @me
gh issue comment N --body "## Handoff\n\n**Estado:** ..."
```

## Labels disponibles

### type (uno por issue)
- `type:feat` — feature nueva
- `type:fix` — bug fix
- `type:refactor` — refactor sin cambio de comportamiento
- `type:docs` — solo documentación
- `type:chore` — mantenimiento, deps, config
- `type:test` — solo tests
- `type:perf` — mejora de rendimiento

### priority (uno por issue)
- `priority:high`
- `priority:normal`
- `priority:low`

### area (uno o más)
- `area:erd`, `area:flow`, `area:aws` — dominios
- `area:ui`, `area:server`, `area:shared` — packages
- `area:ci` — GitHub Actions y workflows
- `area:agents` — AGENTS.md y reglas
- `area:deps` — dependencias

### status (opcional)
- `status:blocked` — bloqueado por otra cosa (con referencia en el cuerpo)
- `status:needs-review` — listo para revisar

## Backlog inicial (2026-04-15)

12 issues creados como base del roadmap:

- **#26** chore(deps): migrar a zod 4 — `priority:high`, `status:blocked`
- **#27** chore(deps): grupo C pino + @types/node — `priority:low`
- **#28** chore(deps): grupo A vite + plugin-react — `priority:normal`
- **#29** chore(deps): grupo B biome 2.x — `priority:normal`
- **#30** chore(deps): typescript 6 — `priority:normal`
- **#31** chore(deps): vitest 4 — `priority:normal`
- **#32** chore(deps-dev): jsdom 29 — `priority:low`
- **#33** chore(deps): lucide-react 1.x — `priority:low`
- **#34** feat(erd): rename_table — `priority:normal`
- **#35** feat(erd): rename_column — `priority:normal`
- **#36** feat(erd): edit_column — `priority:normal`
- **#37** feat(erd): export_sql_ddl PostgreSQL — `priority:high`

## Automatizaciones

- **Auto-delete de ramas al mergear**: configurado vía
  `delete_branch_on_merge: true`.
- **Squash merge obligatorio**: ruleset de main.
- **Auto-cierre de issue al mergear PR con `Closes #N`**: feature nativa
  de GitHub.

Dependabot sigue abriendo PRs automáticos; el proceso §21.9 los canaliza
a issues dedicados cuando son majors que necesitan revisión manual.
