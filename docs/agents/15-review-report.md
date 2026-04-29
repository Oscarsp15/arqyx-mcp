# 15 — Reporte de Auto-revisión

> **Todo agente debe auto-revisarse.** Si no puedes llenar cada sección honestamente, el cambio no está listo.

---

## 1. Cuándo Aplica

Cuando un agente termina un cambio, **antes de reportar "hecho"**, debe auto-revisarlo y producir este reporte.

---

## 2. Formato Obligatorio

```markdown
## Cambio: <título del cambio>

**Archivos modificados:**
- path/a/archivo.ts — qué cambió en una línea
- path/b/otro.ts — qué cambió en una línea
- ...

**Schemas afectados:** <lista o "ninguno">

**Tests añadidos/modificados:**
- describe('nombre del test suite')
  - it('caso de test 1')
  - it('caso de test 2')

**Secciones de AGENTS.md aplicadas:** 3, 4, 13.3, 14.1 (cita concreta)

**Comandos ejecutados y resultado:**
- pnpm typecheck → ✅
- pnpm lint → ✅
- pnpm test → ✅ (N tests)
- pnpm build → ✅

**Alternativas consideradas y descartadas:**
- <alternativa 1> — <por qué no>
- <alternativa 2> — <por qué no>

**Fuera de alcance (no hecho a propósito):**
- <cosa 1> — <por qué no>
- <cosa 2> — <por qué no>

**Riesgos conocidos:**
- <riesgo 1> — <cómo se detectaría>
- <riesgo 2> — <cómo se detectaría>
```

---

## 3. Sección por Sección

### Archivos Modificados

Lista cada archivo tocado con una descripción de **una línea** del cambio:

```markdown
**Archivos modificados:**
- packages/server/src/mcp/tools/erd/add-column.ts — nueva tool MCP
- packages/server/src/state/store.ts — método addColumn
- packages/shared/src/schemas/table.ts — exportar ColumnSchema
```

**Prohibido**: listar archivos sin explicar qué cambió.

### Schemas Afectados

Si el cambio modifica tipos de dominio:

```markdown
**Schemas afectados:** ColumnSchema (nuevo campo `defaultValue`)
```

Si no hay cambios de schema:

```markdown
**Schemas afectados:** ninguno
```

### Tests Añadidos

Lista los tests nuevos o modificados:

```markdown
**Tests añadidos/modificados:**
- describe('erd_add_column')
  - it('crea columna con tipo válido')
  - it('rechaza tipo inválido')
  - it('falla sin tabla existente')
```

**Prohibido**: decir "tests añadidos" sin listarlos.

### Secciones Aplicadas

Cita las secciones específicas de la documentación que aplicaste:

```markdown
**Secciones de AGENTS.md aplicadas:**
- 03 (arquitectura) — nueva tool sigue estructura de dominio
- 07 (MCP tools) — tool atómica con inputSchema Zod
- 11 (tests) — tests unitarios para la tool
```

**Prohibido**: decir "seguí las reglas" sin citar cuáles.

### Comandos Ejecutados

Muestra que corriste las verificaciones:

```markdown
**Comandos ejecutados y resultado:**
- pnpm typecheck → ✅
- pnpm lint → ✅
- pnpm test → ✅ (47 tests, 0 failed)
- pnpm build → ✅
```

**Prohibido**: reportar "hecho" sin haber corrido estos comandos.

### Alternativas Consideradas

Demuestra que pensaste en otras opciones:

```markdown
**Alternativas consideradas y descartadas:**
- Añadir columna en el mismo endpoint que crear tabla
  — viola SRP, cada tool hace una cosa
- Validar tipos de columna contra una lista hardcoded
  — preferí enum en Zod para que sea extensible
```

**Mínimo**: al menos una alternativa considerada.

### Fuera de Alcance

Documenta lo que decidiste NO hacer:

```markdown
**Fuera de alcance (no hecho a propósito):**
- UI para añadir columnas — será otro PR (#43)
- Validación de foreign keys — no está en el scope del MVP
```

Esto evita que te pregunten "¿por qué no hiciste X?"

### Riesgos Conocidos

Identifica qué podría romper:

```markdown
**Riesgos conocidos:**
- Si el schema de Column cambia, los tests fallarán
  — se detectaría en CI
- La tool no valida unicidad de nombre de columna
  — podría crear duplicados, pero el humano lo vería
```

---

## 4. Ejemplo Completo

```markdown
## Cambio: añadir herramienta erd_add_column

**Archivos modificados:**
- packages/server/src/mcp/tools/erd/add-column.ts — nueva tool MCP
- packages/server/src/mcp/tools/erd/add-column.test.ts — tests unitarios
- packages/server/src/state/store.ts — método addColumn + tests
- packages/shared/src/schemas/table.ts — exportar ColumnSchema

**Schemas afectados:** ninguno (usé ColumnSchema existente)

**Tests añadidos/modificados:**
- describe('erd_add_column')
  - it('añade columna a tabla existente')
  - it('rechaza tipo de columna inválido')
  - it('falla sin canvas activo')
  - it('falla si la tabla no existe')
- describe('store.addColumn')
  - it('añade columna y emite evento')
  - it('falla si la tabla no existe')

**Secciones de AGENTS.md aplicadas:**
- 07 (MCP tools) — tool atómica, inputSchema con Zod
- 08 (store) — mutación emite evento, devuelve copia
- 11 (tests) — tests junto al código

**Comandos ejecutados y resultado:**
- pnpm typecheck → ✅
- pnpm lint → ✅
- pnpm test → ✅ (52 tests, 0 failed)
- pnpm build → ✅

**Alternativas consideradas y descartadas:**
- Pasar columnas como array a add_table
  — viola atomicidad, add_column es operación separada
- Validar que el nombre de columna sea único
  — lo dejé fuera por YAGNI, se puede añadir después

**Fuera de alcance (no hecho a propósito):**
- UI para añadir columnas — va en PR separado
- Editar/eliminar columnas — serán otras tools

**Riesgos conocidos:**
- Nombres de columna duplicados permitidos
  — el usuario vería columnas duplicadas en el ERD
  — solución: añadir validación en PR futuro
```

---

## 5. Si No Puedes Llenar una Sección

Si no puedes responder honestamente a alguna sección:

1. **No inventes** — no llenes con texto genérico
2. **Identifica qué falta** — ¿no corriste tests? ¿no consideraste alternativas?
3. **Completa lo que falta** — antes de reportar "hecho"

> **El cambio no está listo** hasta que puedas llenar todo honestamente.

---

## 6. Cuándo NO Aplica

El reporte completo puede omitirse para:

- Fixes triviales de una línea (typo, formato)
- Actualización de deps sin cambios de código

Pero **siempre** debes correr `pnpm typecheck && pnpm lint && pnpm test`.
