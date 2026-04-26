# 17 — Protocolo de Handoff

> **La transferencia debe ser explícita.** El siguiente agente no debe perder trabajo ni contexto.

---

## 1. Cuándo Hacer Handoff

Un agente hace handoff cuando:

- No puede terminar (falta de tiempo, contexto, capacidad)
- El humano lo indica
- El trabajo requiere habilidades que no tiene
- Se bloquea y no puede avanzar

---

## 2. Protocolo de Transferencia

### Paso 1: Desasignarse

```bash
gh issue edit <N> --remove-assignee @me
```

### Paso 2: Comentario Estructurado

Deja un comentario en el issue con este formato:

```markdown
## Handoff

**Estado actual:**
- [qué está hecho]
- [qué falta por hacer]

**Decisiones tomadas:**
- [decisión 1] — [por qué]
- [decisión 2] — [por qué]

**Alternativas descartadas:**
- [alternativa 1] — [por qué no]

**Bloqueos encontrados:**
- [bloqueo 1, si aplica]

**Rama en curso:** `feat/<N>-<slug>` (commit `abc1234`)

**Archivos clave:**
- `path/a/archivo.ts` — [qué contiene/hace]
- `path/b/otro.ts` — [qué contiene/hace]

**Siguiente paso sugerido:**
Lo que haría yo si siguiera: [descripción clara]

**Tests existentes:**
- [ ] Tests pasan / [x] Tests rotos (cuáles)
```

### Paso 3: Push del Trabajo

Si hay trabajo local sin push:

```bash
git push origin feat/<N>-<slug>
```

El trabajo parcial es mejor que perderlo.

---

## 3. Recibir un Handoff

El agente que toma un handoff:

### Paso 1: Leer el Comentario Completo

- **Entero**, no solo el resumen
- Si algo no está claro, **pregunta en el issue** antes de continuar

### Paso 2: Auto-asignarse

```bash
gh issue edit <N> --add-assignee @me
```

### Paso 3: Decidir sobre la Rama

Opciones:
1. **Continuar en la misma rama** — si el trabajo previo es rescatable
2. **Crear rama nueva** — si prefieres empezar limpio

Si creas rama nueva y la vieja queda huérfana, el humano la limpiará.

### Paso 4: Confirmar Recepción

Comenta en el issue:

```markdown
## Tomando handoff

He leído el contexto. Voy a:
- [plan de acción]

Preguntas pendientes:
- [si hay alguna]
```

---

## 4. Contenido Obligatorio del Handoff

| Sección | Obligatorio | Por qué |
|---------|-------------|---------|
| Estado actual | ✅ | Saber qué hay hecho |
| Decisiones tomadas | ✅ | No repetir análisis |
| Rama en curso | ✅ | Encontrar el código |
| Siguiente paso | ✅ | Saber por dónde seguir |
| Bloqueos | ⚠️ Si aplica | Evitar mismos bloqueos |
| Tests | ⚠️ Si aplica | Saber si hay trabajo roto |

---

## 5. Ejemplo de Handoff Completo

```markdown
## Handoff

**Estado actual:**
- ✅ Schema ColumnSchema creado en shared
- ✅ Método store.addColumn implementado
- ✅ Tests del store pasan
- ❌ Tool MCP erd_add_column a medio hacer
- ❌ Tests de la tool no existen

**Decisiones tomadas:**
- Validación de tipo de columna con enum Zod — más extensible que lista hardcoded
- Columnas se añaden al final del array — orden explícito no está en scope del MVP

**Alternativas descartadas:**
- Pasar columna como parte de add_table — viola atomicidad de tools

**Bloqueos encontrados:**
- Ninguno, solo falta de tiempo

**Rama en curso:** `feat/42-add-column` (commit `a1b2c3d`)

**Archivos clave:**
- `packages/shared/src/schemas/table.ts` — ColumnSchema exportado
- `packages/server/src/state/store.ts` — método addColumn (línea 142)
- `packages/server/src/mcp/tools/erd/add-column.ts` — INCOMPLETO

**Siguiente paso sugerido:**
1. Completar el handler de add-column.ts (falta validar que la tabla existe)
2. Escribir tests en add-column.test.ts
3. Registrar la tool en server.ts

**Tests existentes:**
- [x] Tests del store pasan
- [ ] Tests de la tool no existen
```

---

## 6. Handoff por Bloqueo Técnico

Si el bloqueo es técnico (bug, falta de conocimiento):

```markdown
## Handoff (bloqueado)

**Estado actual:**
- Intenté implementar X pero encontré Y

**Bloqueo:**
- [descripción detallada del problema]
- [qué intenté]
- [qué error obtuve]

**Logs/errores relevantes:**
```
[pegar error exacto]
```

**Hipótesis:**
- Podría ser [hipótesis 1]
- O quizá [hipótesis 2]

**Rama en curso:** `feat/<N>-<slug>` (commit `abc1234`)
```

---

## 7. Prohibiciones

| Acción | Por qué |
|--------|---------|
| Abandonar sin comentario | El siguiente agente pierde contexto |
| Decir "no pude" sin explicar | No ayuda al siguiente |
| Desasignarse sin push | Se pierde trabajo |
| Borrar la rama propia | Otro podría usarla |

---

## 8. Checklist de Handoff

Antes de desasignarte:

- [ ] ¿Escribí comentario estructurado en el issue?
- [ ] ¿Expliqué qué está hecho y qué falta?
- [ ] ¿Documenté decisiones tomadas?
- [ ] ¿Mencioné la rama y commit actual?
- [ ] ¿Sugerí el siguiente paso?
- [ ] ¿Hice push de todo el trabajo local?
- [ ] ¿Me desasigné con `gh issue edit`?
