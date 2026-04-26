# 02 — Flujo de Issues y Branches

> **Todo trabajo empieza con un issue.** Sin issue, no hay branch ni PR.

---

## 1. Flujo Obligatorio

```
1. Revisar backlog → 2. Elegir issue sin asignar → 3. Auto-asignarse
       ↓                                                    ↓
4. Crear rama con número de issue → 5. Trabajar → 6. PR
```

---

## 2. Revisar el Backlog

Antes de empezar cualquier trabajo:

```bash
# Ver issues abiertos
gh issue list --state open

# O ver el Project Board en GitHub
```

**Regla**: si todos los issues están asignados a otros agentes, **no hay trabajo disponible**. No inventes tareas.

---

## 3. Elegir un Issue

Criterios para elegir:
- Issue **sin asignar** (`--assignee ""`)
- Tiene **labels** claros (`type:*`, `priority:*`, `area:*`)
- Tamaño razonable (completable en < 1 día)

**Prohibido**:
- Trabajar en un issue asignado a otro agente, aunque parezca inactivo
- Si sospechas abandono, comenta en el issue y espera respuesta del humano

---

## 4. Auto-asignarse

Una vez elegido el issue:

```bash
gh issue edit <N> --add-assignee @me
```

Esto **declara intención pública** de que vas a trabajar en el issue.

**Límite**: máximo 2 issues asignados simultáneamente. WIP pequeño a propósito (Kanban sobre Scrum).

---

## 5. Crear la Rama

**Formato obligatorio** (cuando hay issue):
```
<tipo>/<N>-<slug-corto>
```

| Elemento | Descripción |
|----------|-------------|
| `<tipo>` | `feat`, `fix`, `refactor`, `docs`, `chore`, `test` |
| `<N>` | Número del issue |
| `<slug-corto>` | Descripción breve en inglés ASCII, kebab-case |

**Ejemplos correctos**:
- `feat/51-list-canvases`
- `fix/72-theme-toggle-persistence`
- `chore/33-deps-lucide`

**Ejemplos prohibidos**:
- `feature/add-stuff` — falta número de issue
- `fix/arreglar-bug` — slug en español
- `42-fix` — falta tipo

```bash
# Crear y cambiar a la rama
git checkout -b feat/51-list-canvases
```

---

## 6. Formato Alternativo (Sin Issue)

Solo para excepciones documentadas en la sección de excepciones:

```
<tipo>/<slug-corto-en-ingles>
```

Cuándo aplica:
- Fixes triviales de una línea (typo, formato)
- Respuestas urgentes a CI roto en `main`
- Tareas pedidas explícitamente por el humano "ahora mismo"

Ejemplos:
- `fix/ci-lint-format`
- `docs/typo-readme`

**Todo lo demás requiere issue.**

---

## 7. Crear un Issue Nuevo

Un agente puede proponer un issue cuando:
- Encuentra un bug mientras trabaja en otra cosa
- Identifica una refactorización necesaria fuera del alcance actual
- Detecta una regla que falta en la documentación
- El humano lo pide explícitamente

**Requisitos**:

1. **Usa la plantilla** apropiada (bug_report o feature_request)
2. **Título**: formato Conventional Commits en español
   - `feat(erd): añadir export_sql_ddl para PostgreSQL`
3. **Labels obligatorios**:
   - Un `type:*` (feat, fix, refactor, docs, chore)
   - Un `priority:*` (high, normal, low)
   - Al menos un `area:*` (erd, flow, aws, ui, server, shared, ci, agents)
4. **No auto-asignarse** al crearlo — entra al backlog sin asignar
5. **Tamaño razonable** — completable en < 1 día

**Antes de crear**, verifica que no exista:
```bash
gh issue list --search "<palabra-clave>"
```

---

## 8. Labels del Proyecto

### Tipo (obligatorio, uno solo)
- `type:feat` — nueva funcionalidad
- `type:fix` — corrección de bug
- `type:refactor` — reestructuración sin cambio de comportamiento
- `type:docs` — documentación
- `type:chore` — mantenimiento, deps, config

### Prioridad (obligatorio, uno solo)
- `priority:high` — bloqueante o urgente
- `priority:normal` — flujo normal
- `priority:low` — nice to have

### Área (obligatorio, uno o más)
- `area:erd` — diagramas entidad-relación
- `area:flow` — flow canvas
- `area:aws` — servicios AWS
- `area:ui` — frontend
- `area:server` — backend
- `area:shared` — tipos compartidos
- `area:ci` — GitHub Actions
- `area:agents` — documentación para IAs

### Estado (opcional)
- `status:blocked` — esperando algo externo
- `status:in-progress` — trabajo activo
- `status:needs-review` — listo para revisión

---

## 9. Draft PR como Señal de WIP

Si el trabajo lleva > 30 minutos o cruza más de un commit:

1. **Abre un Draft PR inmediatamente** aunque no esté listo
2. El Draft es señal pública: "este issue está siendo trabajado"
3. Cuando esté listo: `gh pr ready <N>`

**Regla**: no tengas cambios locales > 2 horas sin un Draft PR que los represente.

---

## 10. Cerrar Issues

**Correcto**: el PR que resuelve el issue incluye `Closes #N` en el body → GitHub cierra automáticamente al mergear.

**Prohibido**: cerrar manualmente issues que no creaste tú, salvo que el PR tenga `Closes #N`.
