# 14 — Pull Requests

> **Todo cambio va por PR.** El humano mergea, el agente propone.

---

## 1. Principio Fundamental

- **Nada se commitea directamente a `main`**
- Todo pasa por rama + Pull Request
- El agente crea el PR, el humano aprueba y mergea

---

## 2. Tamaño del PR

- **Objetivo**: < 400 líneas de diff
- Si es más grande, **justifica** por qué no pueden ser varios PRs

> Un PR gigante es más difícil de revisar que 3 PRs pequeños.

---

## 3. Título del PR

Mismo formato que commit:

```
<tipo>(<scope>): <mensaje en español>
```

Si el PR tiene un solo commit, título y commit coinciden.

### Ejemplos

```
feat(erd): añadir herramienta add_column
fix(ui): corregir contraste en tema oscuro
refactor(store): extraer generadores de id
docs(agents): documentar reglas de design system
chore(deps): actualizar vitest a 2.2.0
```

---

## 4. Cuerpo del PR (Template Obligatorio)

```markdown
## Resumen

Una o dos frases sobre qué hace este PR y por qué.

## Issue relacionado

Closes #N

## Cambios

- Cambio 1 importante
- Cambio 2 importante
- ...

## Secciones de AGENTS.md aplicadas

Cita números: 3, 4, 13.3, 20.1, etc.

## Test plan

- [ ] `pnpm typecheck` verde
- [ ] `pnpm lint` verde
- [ ] `pnpm test` verde (N tests)
- [ ] Prueba manual: [qué probaste y qué viste]
- [ ] Revisión visual (si aplica): [confirmé contraste en ambos temas]

## Fuera de alcance

Lo que decidiste NO hacer aquí y por qué.

## Riesgos

Qué podría romper y cómo lo detectarías.
```

### Reglas

- Si una sección queda vacía, **explica por qué** ("no aplica, PR solo de docs")
- No borres secciones
- `Closes #N` es **obligatorio** si hay issue asociado

---

## 5. Checklist de Revisión Visual

Si el PR toca UI:

```markdown
- [ ] He abierto el componente en el navegador con tema claro Y oscuro
      y confirmé que el contraste es suficiente y no hay texto invisible
```

Si no hay impacto visual:

```markdown
- [x] No aplica, PR sin impacto visual
```

---

## 6. Instrucciones para el Humano

Si el PR requiere acción humana (validación visual, prueba manual), incluye instrucciones **auto-contenidas**:

```markdown
## Pasos para validar

1. Cambia a la rama:
   ```bash
   cd "C:\Users\sentinel\arqyx-mcp"
   git fetch origin feat/42-add-column
   git checkout feat/42-add-column
   pnpm install
   ```

2. Arranca el dev server:
   ```bash
   pnpm --filter @arqyx/ui dev
   ```

3. Abre http://localhost:5173

4. Verifica:
   - El nuevo botón "Añadir columna" aparece en cada tabla
   - Funciona en tema claro Y oscuro
   - El contraste del texto es legible

5. Si todo OK, comenta "✅ validado" y mergea.

6. Si algo falla, comenta "❌ [qué falló]".
```

---

## 7. Draft PRs

### Cuándo Usar Draft

- Trabajo en progreso (> 30 minutos)
- Quieres feedback temprano
- Señalar a otros agentes que el issue está tomado

### Crear Draft

```bash
gh pr create --draft --title "feat(erd): añadir add_column" --body "WIP"
```

### Marcar como Ready

```bash
gh pr ready <N>
```

---

## 8. CI Obligatorio

Todo PR dispara GitHub Actions que corre:

1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test`
5. `pnpm build`

**Ningún paso puede fallar** para que el PR sea mergeable.

### Prohibido

- `--no-verify`
- `CI=false`
- Cualquier bypass del CI

---

## 9. Branch Protection

Configuración en `main`:

| Setting | Estado |
|---------|--------|
| Require PR before merge | ✅ |
| Require status checks | ✅ |
| Require up to date | ✅ |
| Require linear history | ✅ |
| No force pushes | ✅ |
| No deletions | ✅ |
| Include administrators | ✅ |

---

## 10. Estrategia de Merge

**Squash and merge** preferido:

- Historial de `main` limpio: 1 PR = 1 commit
- El commit usa el título del PR
- Commits intermedios accesibles via link del PR

---

## 11. Reglas para Agentes

| Regla | Detalle |
|-------|---------|
| Nunca push a `main` | Siempre rama + PR |
| Nunca merge propio | El humano aprueba |
| Siempre llenar template | Completo, sin secciones vacías |
| Siempre `Closes #N` | Si hay issue asociado |
| Draft si WIP | Señal para otros agentes |
| Correr checks locales | Antes de push |

### Antes de Crear PR

```bash
# Verificar que todo pasa
pnpm typecheck && pnpm lint && pnpm test
```

---

## 12. Crear PR con gh CLI

```bash
gh pr create --title "feat(erd): añadir add_column" --body "$(cat <<'EOF'
## Resumen

Añade la herramienta MCP `erd_add_column` para agregar columnas a tablas ERD.

## Issue relacionado

Closes #42

## Cambios

- Nueva tool `erd_add_column` en `packages/server/src/mcp/tools/erd/`
- Tests unitarios para la tool
- Método `addColumn` en el store

## Secciones de AGENTS.md aplicadas

3, 4, 7, 11

## Test plan

- [x] `pnpm typecheck` verde
- [x] `pnpm lint` verde
- [x] `pnpm test` verde (45 tests)
- [x] Prueba manual con MCP Inspector

## Fuera de alcance

- Validación de tipos de columna (va en otro PR)
- UI para añadir columnas (issue #43)

## Riesgos

- Si el schema de Column cambia, los tests fallarán
EOF
)"
```

---

## 13. Checklist Final

Antes de marcar PR como ready:

- [ ] Título sigue formato `<tipo>(<scope>): <mensaje>`
- [ ] Body tiene todas las secciones del template
- [ ] `Closes #N` incluido si hay issue
- [ ] CI pasó (typecheck, lint, test, build)
- [ ] Instrucciones para validación visual (si aplica)
- [ ] No hay archivos temporales en el diff
- [ ] No hay secretos en el diff
