# 13 — Mensajes de Commit

> **Conventional Commits en español.** Un commit = un cambio lógico atómico.

---

## 1. Formato

```
<tipo>(<scope>): <mensaje en español>

<cuerpo opcional: explica el porqué>

Co-Authored-By: <nombre> <email>
Made-with: <herramienta>
```

---

## 2. Tipos Válidos

| Tipo | Cuándo usar |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Reestructuración sin cambio de comportamiento |
| `docs` | Solo documentación |
| `chore` | Mantenimiento, deps, config |
| `test` | Solo tests |
| `perf` | Mejora de performance |
| `style` | Formato, espacios (sin cambio de código) |
| `build` | Sistema de build, dependencias |
| `ci` | Configuración de CI |
| `revert` | Revierte un commit anterior |

---

## 3. Scopes Válidos

| Scope | Package/Dominio |
|-------|-----------------|
| `shared` | `packages/shared` |
| `server` | `packages/server` |
| `ui` | `packages/ui` |
| `erd` | Dominio ERD (tablas, columnas) |
| `flow` | Dominio Flow Canvas |
| `aws` | Dominio AWS |
| `mcp` | Tools MCP |
| `ws` | WebSocket |
| `persistence` | Persistencia |
| `ci` | GitHub Actions |
| `agents` | Documentación para IAs |

---

## 4. Ejemplos Correctos

```
feat(flow): añadir dominio FlowCanvas con 5 shapes
```

```
fix(ws): validar mensajes entrantes antes de mutar el store

El servidor crasheaba cuando recibía JSON malformado.
Ahora valida con Zod antes de procesar.

Co-Authored-By: Claude <noreply@anthropic.com>
Made-with: Claude Code
```

```
refactor(store): extraer generadores de id a una interfaz

Preparación para permitir inyectar generadores determinísticos
en tests.

Co-Authored-By: Claude <noreply@anthropic.com>
Made-with: Claude Code
```

```
chore(deps): actualizar vitest a 2.2.0
```

```
docs(agents): añadir reglas de design system
```

---

## 5. Ejemplos Prohibidos

| Commit | Problema |
|--------|----------|
| `update stuff` | Sin tipo, sin descripción clara |
| `WIP` | No se commitea trabajo a medias |
| `feat: cosas y más cosas` | Múltiples cambios en un commit |
| `Feat: Added flow canvas` | En inglés, capitalizado, sin scope |
| `fix: arreglar bug` | Descripción inútil |
| `feat(ui): add button and fix header and refactor utils` | Tres cambios = tres commits |

---

## 6. Reglas Duras

### Un Commit = Un Cambio Lógico

Si el mensaje necesita "y", **divide**:

```
# MAL: dos cambios
feat(ui): añadir botón de eliminar y corregir estilos del header

# BIEN: dos commits
feat(ui): añadir botón de eliminar tabla
fix(ui): corregir estilos del header en tema oscuro
```

### El Cuerpo Explica el Porqué

El **qué** lo muestra el diff. El cuerpo explica:
- Por qué se hizo este cambio
- Qué problema resolvía
- Qué decisiones se tomaron
- Qué alternativas se descartaron

### Atribución Obligatoria (para IAs)

```
Co-Authored-By: Claude <noreply@anthropic.com>
Made-with: Claude Code
```

| Campo | Propósito |
|-------|-----------|
| `Co-Authored-By` | Atribución (aparece en GitHub) |
| `Made-with` | Trazabilidad de herramienta |

Herramientas válidas: `Claude Code`, `Cursor`, `Codex CLI`, `Aider`, `Copilot`, etc.

---

## 7. Formato Técnico

Usa HEREDOC para evitar problemas de escape:

```bash
git commit -m "$(cat <<'EOF'
feat(erd): añadir validación de nombres de tabla

Las tablas ahora requieren nombres en formato snake_case.
Rechaza nombres con espacios, mayúsculas o caracteres especiales.

Co-Authored-By: Claude <noreply@anthropic.com>
Made-with: Claude Code
EOF
)"
```

---

## 8. Prohibiciones

| Acción | Estado |
|--------|--------|
| `git commit --amend` después de push | ❌ Prohibido |
| `git push --force` a `main` | ❌ Prohibido |
| `git push --force` a rama de feature | ⚠️ Solo si nadie más ha pulled |
| Commits vacíos | ❌ Prohibido |
| Commits con solo whitespace | ❌ Prohibido |

---

## 9. Checklist Pre-Commit

Antes de escribir el mensaje:

- [ ] ¿Es un solo cambio lógico?
- [ ] ¿El tipo es correcto?
- [ ] ¿El scope es correcto?
- [ ] ¿El mensaje está en español?
- [ ] ¿El mensaje es descriptivo (no "arreglar bug")?
- [ ] ¿Incluí Co-Authored-By y Made-with? (si soy IA)

---

## 10. Ejemplos por Tipo

### feat

```
feat(erd): añadir herramienta add_column para tablas ERD

Co-Authored-By: Claude <noreply@anthropic.com>
Made-with: Claude Code
```

### fix

```
fix(ui): corregir contraste de texto en tema oscuro

El texto de las columnas era invisible (blanco sobre blanco).

Co-Authored-By: Claude <noreply@anthropic.com>
Made-with: Claude Code
```

### refactor

```
refactor(mcp): extraer validación común a helper compartido

Co-Authored-By: Claude <noreply@anthropic.com>
Made-with: Claude Code
```

### docs

```
docs(agents): documentar reglas de design system
```

### chore

```
chore(deps): actualizar lucide-react a 0.469.0
```

### test

```
test(store): añadir tests para mutaciones de tabla
```

### ci

```
ci: añadir job de lint al workflow de PR
```
