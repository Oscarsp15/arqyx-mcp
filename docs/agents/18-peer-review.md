# 18 — Peer Review entre Agentes

> **Reportar, no fixear.** El auditor señala problemas, el autor los corrige.

---

## 1. Principio Fundamental

Cuando un agente audita el trabajo de otro:

- **Reporta** los problemas encontrados
- **No fixea** directamente (salvo excepciones)
- **Cita** secciones de la documentación
- Deja que el **autor original** corrija

---

## 2. Qué Puede Hacer un Auditor

| Acción | Permitido |
|--------|-----------|
| Leer código, commits, PR body | ✅ |
| Comentar con objeciones técnicas | ✅ |
| Citar secciones de la documentación | ✅ |
| Revisar formalmente (`gh pr review`) | ✅ |
| Proponer ediciones al PR body | ✅ |
| Crear PR nuevo que corrige otro PR | ✅ |

---

## 3. Qué NO Puede Hacer un Auditor

| Acción | Por qué |
|--------|---------|
| Editar código de otro sin autorización | Confunde autoría |
| Mergear sin humano | Solo el humano mergea |
| Cerrar PR de otro | Requiere autorización |
| Decir "esto no me gusta" sin referencia | Debe citar reglas |

---

## 4. Estructura del Review

Para cada finding:

```markdown
### Finding: [título corto]

**Severidad:** 🔴 high / 🟠 medium / 🟡 low

**Ubicación:** `packages/server/src/file.ts:42`

**Regla:** §07 (MCP tools)

**Problema:**
La tool no valida que el canvas esté activo antes de operar.

**Fix sugerido:**
```typescript
const canvas = store.getActiveCanvas();
if (!canvas) {
  throw new McpError(ErrorCode.InvalidRequest, 'No hay canvas activo');
}
```
```

---

## 5. Sección Obligatoria: Lo Que Está Bien

Un review que solo lista problemas desmoraliza. Incluye:

```markdown
## Lo que está bien

- La estructura de la tool sigue §07 correctamente
- Los tests cubren el happy path y casos de error
- El naming es claro y sigue §06
```

---

## 6. Cuándo el Auditor SÍ Puede Editar

### Con Delegación Explícita

El humano dice:
> "Auditor, arregla el bug X del PR #Y"

A partir de esa frase, el auditor puede commitear sobre la rama del autor.

### Autor Abandonó (Handoff)

Si el autor hizo handoff (§17), el siguiente agente toma el trabajo completo.

### Fix Puramente Mecánico

- Lint autofix (`pnpm lint:fix`)
- Formato automático
- Reorder de imports
- Typos en comentarios

**Nunca** lógica de negocio.

### Correcciones al PR Body

- Sección faltante del template
- Checkbox mal marcado
- Descripción incompleta

El body es metadata, no el deliverable.

---

## 7. Cuándo el Auditor NO Debe Editar

- **Por defecto** (si no aplica excepción)
- Fix involucra lógica de negocio
- Fix cambia la intención del autor
- Fix puede interpretarse de múltiples maneras
- El autor aún está activo

---

## 8. Patrón Correcto de Colaboración

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  1. Autor A entrega PR                                      │
│          ↓                                                   │
│  2. Auditor B hace review estructurado                      │
│          ↓                                                   │
│  3. Humano decide:                                          │
│     ├─▶ "A, arregla los findings"                           │
│     │       → A commitea nueva versión                      │
│     ├─▶ "B, arregla tú"                                     │
│     │       → B commitea con autorización                   │
│     └─▶ "Mergea tal cual, findings a follow-ups"            │
│             → Se crean issues y se mergea                   │
│          ↓                                                   │
│  4. Auditor B re-revisa (si aplica)                         │
│          ↓                                                   │
│  5. Humano mergea                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Checklist de UI para Auditor

Si el PR toca UI, verificar que el autor incluyó:

- [ ] Instrucciones de validación visual (§19)
- [ ] Comandos con rutas absolutas
- [ ] URL/puerto donde validar
- [ ] Qué verificar específicamente
- [ ] Qué hacer si algo falla

Si faltan, es un **finding** que el autor debe corregir.

---

## 10. Por Qué Esta Regla Importa

### Aprendizaje del Autor

Si el auditor limpia silenciosamente, el autor no aprende qué hizo mal.

### Trazabilidad

Un review estructurado deja en el historial **qué** se detectó, **por qué**, y **qué** se decidió.

### Sostenibilidad

Si el auditor hace el 15% del trabajo del autor, el patrón no escala.

### Autoría Clara

Un PR debe ser atribuible. Dos agentes commiteando sin coordinación confunde el blame.

---

## 11. Formato de Severidad

| Severidad | Cuándo usar | Ejemplo |
|-----------|-------------|---------|
| 🔴 high | Bloquea merge, bug crítico, viola regla dura | Falta validación Zod, error en producción |
| 🟠 medium | Debería arreglarse, pero no bloquea | Nombre poco claro, test incompleto |
| 🟡 low | Sugerencia, nice to have | Podría ser más idiomático |

---

## 12. Ejemplo de Review Completo

```markdown
## Review de PR #42: feat(erd): añadir add_column

### Lo que está bien

- La estructura de la tool sigue §07 correctamente
- Schema Zod bien definido con mensajes de error en español
- Tests cubren happy path y errores principales

---

### Finding 1: Falta validación de canvas activo

**Severidad:** 🔴 high

**Ubicación:** `packages/server/src/mcp/tools/erd/add-column.ts:15`

**Regla:** §07.6 (manejo de errores en tools)

**Problema:**
El handler no verifica que haya un canvas ERD activo antes de operar.

**Fix sugerido:**
```typescript
const canvas = store.getActiveCanvas();
if (!canvas || canvas.type !== 'erd') {
  throw new McpError(ErrorCode.InvalidRequest, 'Requiere canvas ERD activo');
}
```

---

### Finding 2: Test no verifica caso de tabla inexistente

**Severidad:** 🟠 medium

**Ubicación:** `packages/server/src/mcp/tools/erd/add-column.test.ts`

**Regla:** §11 (tests)

**Problema:**
No hay test para el caso donde `tableId` no existe.

**Fix sugerido:**
Añadir:
```typescript
it('falla si la tabla no existe', async () => {
  await expect(handler({ tableId: 'invalid', ... }))
    .rejects.toThrow('tabla no encontrada');
});
```

---

**Resumen:**
- 1 finding 🔴 high (bloquea merge)
- 1 finding 🟠 medium

Esperando correcciones del autor antes de aprobar.
```

---

## 13. Comandos Útiles

```bash
# Dejar review con comentarios
gh pr review <N> --comment --body "..."

# Aprobar
gh pr review <N> --approve

# Solicitar cambios (si la cuenta lo permite)
gh pr review <N> --request-changes --body "..."
```
