# 22 — Configuración de GitHub

> **Estructura estándar.** CI, templates, protección de branches.

---

## 1. Estructura Esperada

```
.github/
├── workflows/
│   └── ci.yml                     # Lint + typecheck + test + build
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   ├── feature_request.md
│   └── config.yml                 # Desactiva blank issues
├── PULL_REQUEST_TEMPLATE.md
├── dependabot.yml
└── CODEOWNERS                     # Opcional
```

---

## 2. CI Workflow

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
```

### Reglas

- **Ningún paso puede fallar** para merge
- **Prohibido** bypass (`--no-verify`, `CI=false`)
- Si CI es flaky, arreglar o cuarentenar el test

---

## 3. Templates de Issues

### Bug Report

`.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Reportar un bug
title: 'fix(<scope>): '
labels: type:fix
---

## Descripción del Bug

[Descripción clara y concisa]

## Pasos para Reproducir

1. Ir a '...'
2. Hacer click en '...'
3. Ver error

## Comportamiento Esperado

[Qué debería pasar]

## Comportamiento Actual

[Qué pasa en realidad]

## Entorno

- OS: [Windows/Mac/Linux]
- Node: [versión]
- Browser: [si aplica]

## Logs/Screenshots

[Si aplica]
```

### Feature Request

`.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature Request
about: Proponer una nueva funcionalidad
title: 'feat(<scope>): '
labels: type:feat
---

## Problema que Resuelve

[¿Qué problema tiene el usuario?]

## Solución Propuesta

[¿Cómo lo resolverías?]

## Alternativas Consideradas

[¿Qué otras opciones hay?]

## Alcance Propuesto

- [ ] Paso 1
- [ ] Paso 2
- [ ] Paso 3

## Contexto Adicional

[Cualquier otra información]
```

### Config

`.github/ISSUE_TEMPLATE/config.yml`:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Documentación
    url: https://github.com/owner/repo/tree/main/docs
    about: Lee la documentación antes de abrir un issue
```

---

## 4. PR Template

`.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Resumen

[Una o dos frases sobre qué hace este PR y por qué]

## Issue relacionado

Closes #

## Cambios

- Cambio 1
- Cambio 2

## Secciones de AGENTS.md aplicadas

[Cita números: 03, 07, 11, etc.]

## Test plan

- [ ] `pnpm typecheck` verde
- [ ] `pnpm lint` verde
- [ ] `pnpm test` verde
- [ ] Prueba manual: [qué probaste]

## Revisión visual (si aplica UI)

- [ ] He abierto el componente en el navegador con tema claro Y oscuro
      y confirmé que el contraste es suficiente y no hay texto invisible
- [ ] No aplica, PR sin impacto visual

## Fuera de alcance

[Lo que decidiste NO hacer aquí y por qué]

## Riesgos

[Qué podría romper y cómo lo detectarías]
```

---

## 5. Dependabot

`.github/dependabot.yml`:

```yaml
version: 2
updates:
  # npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      dev-dependencies:
        patterns:
          - "*"
        update-types:
          - "minor"
          - "patch"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## 6. Branch Protection

Configurar en Settings → Branches → Add rule para `main`:

| Setting | Estado |
|---------|--------|
| Require a pull request before merging | ✅ |
| Require status checks to pass before merging | ✅ |
| Require branches to be up to date before merging | ✅ |
| Require linear history | ✅ |
| Do not allow force pushes | ✅ |
| Do not allow deletions | ✅ |
| Include administrators | ✅ |

### Status Checks Requeridos

- `build` (el job del CI workflow)

---

## 7. Archivos en la Raíz

### `.gitattributes`

```
* text=auto eol=lf
*.png binary
*.jpg binary
*.ico binary
```

Crítico en Windows para evitar diffs por CRLF vs LF.

### `.editorconfig`

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

### `CHANGELOG.md`

Vacío hasta el primer release. Formato Keep a Changelog.

### `LICENSE`

Aunque sea privado, define qué pasa si se abre.

---

## 8. Security Features

Activar en Settings → Code security and analysis:

| Feature | Estado |
|---------|--------|
| Dependency graph | ✅ |
| Dependabot alerts | ✅ |
| Dependabot security updates | ✅ |
| Secret scanning | ✅ |
| Push protection | ✅ |

---

## 9. Labels Estándar

Crear en Issues → Labels:

### Tipo

- `type:feat` — Nueva funcionalidad
- `type:fix` — Corrección de bug
- `type:refactor` — Reestructuración
- `type:docs` — Documentación
- `type:chore` — Mantenimiento

### Prioridad

- `priority:high` — Bloqueante/urgente
- `priority:normal` — Flujo normal
- `priority:low` — Nice to have

### Área

- `area:erd` — Diagramas ERD
- `area:flow` — Flow canvas
- `area:aws` — Servicios AWS
- `area:ui` — Frontend
- `area:server` — Backend
- `area:shared` — Tipos compartidos
- `area:ci` — GitHub Actions
- `area:agents` — Documentación IA

### Estado

- `status:blocked` — Esperando algo externo
- `status:in-progress` — Trabajo activo
- `status:needs-review` — Listo para revisión

---

## 10. Qué NO Poner

| Elemento | Razón |
|----------|-------|
| Secretos | Seguridad |
| `.vscode/settings.json` personal | IDE específico |
| `.idea/` | IDE específico |
| `node_modules/` | Deps descargadas |
| `dist/`, `build/` | Output generado |
| `.DS_Store`, `Thumbs.db` | OS específico |
| `coverage/` | Output de tests |
| `*.bak`, `*~` | Backups |

Todo esto debe estar en `.gitignore`.

---

## 11. Checklist de Configuración

Verificar que el repo tiene:

- [ ] `.github/workflows/ci.yml` con todos los checks
- [ ] `.github/ISSUE_TEMPLATE/` con bug y feature
- [ ] `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] `.github/dependabot.yml`
- [ ] Branch protection en `main`
- [ ] Secret scanning activado
- [ ] Push protection activado
- [ ] `.gitattributes` con `* text=auto eol=lf`
- [ ] Labels estándar creados
