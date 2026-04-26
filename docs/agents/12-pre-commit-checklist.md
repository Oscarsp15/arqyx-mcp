# 12 — Checklist Pre-Commit

> **Revisa antes de commit.** Si algo aplica, refactoriza antes de continuar.

---

## 1. Verificación Obligatoria

Corre **en este orden** y solo continúa si todos pasan:

```bash
# 1. Type check
pnpm typecheck

# 2. Lint
pnpm lint

# 3. Tests
pnpm test

# 4. Build
pnpm build
```

Si uno falla, **arréglalo**. No reportes "hecho con N errores menores".

---

## 2. Code Smell Test

Revisa tu cambio contra esta lista. Si algo aplica, **refactoriza antes de commit**:

### Duplicación

- [ ] ¿Hay código duplicado?

> **Regla de 3**: a la tercera repetición, extrae.

### Responsabilidad

- [ ] ¿Una función hace más de una cosa?
- [ ] ¿Un archivo tiene más de 300 líneas?
- [ ] ¿Un componente tiene más de 150 líneas?

### Nombres

- [ ] ¿Hay un nombre que miente o es vago?
- [ ] ¿Hay abreviaturas crípticas (`usr`, `cfg`, `mgr`)?
- [ ] ¿Hay nombres que incluyen el tipo (`userArray`, `configObject`)?

### Comentarios

- [ ] ¿Hay un comentario explicando QUÉ hace el código?

> Si sí → reescribe el código para que sea obvio, borra el comentario.

### Tipos

- [ ] ¿Hay `any`, `as`, `@ts-ignore`?
- [ ] ¿Hay `!` (non-null assertion) sin justificación?

### Código Muerto

- [ ] ¿Hay un parámetro que nunca se usa en algún caller?
- [ ] ¿Hay una rama de código que nunca se ejecuta en tests?
- [ ] ¿Hay imports sin usar?

### TODOs

- [ ] ¿Hay un `TODO` sin issue asociado?

> Si hay un TODO, crea el issue primero. Formato: `// TODO(#123): descripción`

### Alcance

- [ ] ¿El diff toca archivos fuera del alcance de la feature?

> Si sí → esos cambios van en un commit/PR separado.

---

## 3. Prohibiciones Específicas

### Prohibido en Commits

| Elemento | Estado |
|----------|--------|
| `console.log` | ❌ Prohibido (usa el logger `pino`) |
| `debugger` | ❌ Prohibido |
| `.only` en tests | ❌ Prohibido |
| Archivos temporales | ❌ Prohibido |
| Secretos hardcodeados | ❌ Prohibido |
| Código comentado | ❌ Prohibido |

### Verificar con grep

```bash
# Buscar console.log
grep -r "console.log" packages/

# Buscar .only en tests
grep -r "\.only" packages/**/*.test.ts

# Buscar TODO sin issue
grep -r "TODO" packages/ | grep -v "TODO(#"
```

---

## 4. Verificación Visual (Si Aplica)

Si el cambio toca UI:

- [ ] Abrí el componente en navegador con tema **claro**
- [ ] Abrí el componente en navegador con tema **oscuro**
- [ ] El contraste es suficiente en ambos
- [ ] No hay texto invisible (blanco/blanco, negro/negro)
- [ ] Los iconos son visibles en ambos temas
- [ ] El componente es usable solo con teclado

---

## 5. Checklist de Agente IA

### Antes de Reportar "Hecho"

- [ ] Leí los archivos completos que modifiqué (no solo líneas cercanas)
- [ ] Mi rama tiene formato `<tipo>/<N>-<slug>`
- [ ] No hay `any`, `as`, `@ts-ignore` en mi código
- [ ] Validé inputs con Zod en el borde
- [ ] Escribí tests para la lógica nueva
- [ ] `pnpm typecheck && pnpm lint && pnpm test` pasan
- [ ] Mi commit sigue Conventional Commits en español
- [ ] Respeté todas las reglas de AGENTS.md

### Prohibiciones de Agente

- [ ] No inventé APIs, funciones o paquetes
- [ ] No copié patrones sin verificar que encajan
- [ ] No dejé código de ejemplo o placeholders
- [ ] No silencié errores para "avanzar"
- [ ] No marqué checkboxes que requieren acción humana

---

## 6. Verificación MCP (Si Aplica)

Si el cambio toca tools MCP:

- [ ] La tool tiene nombre formato `<dominio>_<accion>`
- [ ] La `description` explica cuándo usarla
- [ ] El `inputSchema` valida con Zod
- [ ] Los errores usan `McpError` con código apropiado
- [ ] Hay test unitario en `*.test.ts`
- [ ] Probé manualmente con MCP Inspector

---

## 7. Verificación Store (Si Aplica)

Si el cambio toca el store:

- [ ] Toda mutación pasa por método del store
- [ ] Los métodos emiten eventos al EventEmitter
- [ ] Los getters devuelven copias o `readonly`
- [ ] Hay tests para cada mutación nueva

---

## 8. Si el Checklist Falla

1. **No commitees**
2. **Arregla el problema**
3. **Vuelve a verificar**
4. **Ahora sí commit**

No hay "commit temporal para después arreglar". El commit debe estar limpio desde el inicio.

---

## 9. Resumen Rápido

```
┌─────────────────────────────────────────────────────────┐
│                    PRE-COMMIT                            │
├─────────────────────────────────────────────────────────┤
│  1. pnpm typecheck    → ✅ cero errores                 │
│  2. pnpm lint         → ✅ cero warnings                │
│  3. pnpm test         → ✅ todos pasan                  │
│  4. pnpm build        → ✅ build limpia                 │
│  5. Code smell test   → ✅ nada aplica                  │
│  6. Visual (si UI)    → ✅ ambos temas OK               │
│  7. MCP Inspector     → ✅ tools funcionan (si aplica)  │
├─────────────────────────────────────────────────────────┤
│  TODO VERDE → COMMIT                                     │
│  ALGO FALLA → ARREGLAR PRIMERO                          │
└─────────────────────────────────────────────────────────┘
```
