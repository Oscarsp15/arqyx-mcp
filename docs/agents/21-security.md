# 21 — Seguridad

> **Cero secretos en el repo.** Validar todo input externo.

---

## 1. Principio Fundamental

- **Cero secretos** en el repositorio. Jamás. Nunca.
- **Validar** todo input externo con Zod
- **Sanitizar** contenido que pueda ejecutarse
- **No ejecutar** código del usuario

---

## 2. Secretos

### Prohibido en el Repo

| Elemento | Estado |
|----------|--------|
| API keys | ❌ Nunca |
| Tokens de acceso | ❌ Nunca |
| Credenciales de BD | ❌ Nunca |
| Passwords | ❌ Nunca |
| `.env` con valores reales | ❌ Nunca |
| Certificados privados | ❌ Nunca |

### Alternativas

```
.env.example      ← Con valores placeholder, SÍ commitear
.env              ← Con valores reales, en .gitignore

# Ejemplo de .env.example
DATABASE_URL=postgres://user:password@localhost:5432/db
API_KEY=your-api-key-here
```

### Si un Secreto se Coló

1. **Rotar inmediatamente** el secreto
2. Luego limpiar el historial de git si es necesario
3. El secreto ya está comprometido, rotarlo es lo primero

### Secretos de CI

Usar **GitHub Secrets**:
- Settings → Secrets and variables → Actions
- Referenciar en workflows: `${{ secrets.NAME }}`

---

## 3. Validación de Input

### Todo Input Externo se Valida con Zod

| Borde | Qué validar |
|-------|-------------|
| MCP Tool call | `input` del handler |
| WebSocket message | Mensaje entrante |
| HTTP endpoint | Body, query, headers |
| Formulario UI | Datos antes de enviar |

### Patrón

```typescript
import { z } from 'zod';

const InputSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['varchar', 'int', 'boolean']),
});

export const handler = async (rawInput: unknown) => {
  // Validar ANTES de usar
  const input = InputSchema.parse(rawInput);

  // A partir de aquí, `input` tiene tipo garantizado
  // ...
};
```

---

## 4. Sanitización

### SVGs

Sanitizar cualquier SVG antes de servirlo o renderizarlo:

```typescript
import DOMPurify from 'dompurify';

const sanitizedSvg = DOMPurify.sanitize(userSvg, {
  USE_PROFILES: { svg: true },
});
```

### HTML (si aplica)

```typescript
// Solo si realmente necesitas renderizar HTML del usuario
const sanitizedHtml = DOMPurify.sanitize(userHtml);
```

---

## 5. No Ejecutar Código del Usuario

### Prohibido

| Patrón | Por qué |
|--------|---------|
| `eval(userInput)` | Ejecución arbitraria |
| `new Function(userInput)` | Ejecución arbitraria |
| `child_process.exec(userInput)` | Command injection |
| `require(userPath)` | Carga arbitraria de módulos |

### Si Necesitas Ejecutar Comandos

```typescript
// MAL: concatenar input directo
exec(`ls ${userPath}`);  // Command injection!

// BIEN: validar primero
const SafePathSchema = z.string().regex(/^[a-z0-9_/-]+$/i);
const validPath = SafePathSchema.parse(userPath);
exec(`ls ${validPath}`);

// MEJOR: no usar shell
execFile('ls', [validPath]);  // Array de argumentos, no shell
```

---

## 6. Path Traversal

### Validar Paths de Persistencia

```typescript
import path from 'node:path';

const DATA_DIR = '/app/data';

function resolveSafePath(userPath: string): string {
  const resolved = path.resolve(DATA_DIR, userPath);

  // Verificar que está dentro del directorio esperado
  if (!resolved.startsWith(DATA_DIR)) {
    throw new Error('Path traversal detectado');
  }

  return resolved;
}

// Uso
const safePath = resolveSafePath(userInput);
fs.readFileSync(safePath);
```

### Patrón de Ataque que Previene

```
userInput = "../../../etc/passwd"
resolved  = "/etc/passwd"  ← NO empieza con /app/data
→ Error lanzado
```

---

## 7. GitHub Security Features

### Activar en el Repo

| Feature | Dónde |
|---------|-------|
| Secret scanning | Settings → Code security |
| Push protection | Settings → Code security |
| Dependabot alerts | Settings → Code security |
| Dependabot security updates | Settings → Code security |

### Push Protection

Bloquea commits que contengan tokens detectados **antes** de que lleguen al server.

---

## 8. Dependencias

### Antes de Añadir

- ¿> 1000 descargas semanales?
- ¿> 1 año de vida?
- ¿Mantenida activamente (< 6 meses sin update)?
- ¿Licencia compatible (no GPL/AGPL)?
- ¿Maintainer único? → Investigar más

### Dependabot

Configurado en `.github/dependabot.yml`:
- Revisa PRs de Dependabot como cualquier otro
- No auto-merge ciego
- Leer changelog en upgrades mayores

---

## 9. Checklist de Seguridad

Antes de commit:

- [ ] ¿Hay secretos hardcodeados? → ❌
- [ ] ¿Inputs externos validados con Zod? → ✅
- [ ] ¿SVGs sanitizados? → ✅
- [ ] ¿Paths validados contra traversal? → ✅
- [ ] ¿Ningún `eval`, `Function`, `exec` con input usuario? → ✅
- [ ] ¿`.env` en `.gitignore`? → ✅

---

## 10. OWASP Top 10 (Aplicables)

| Vulnerabilidad | Mitigación |
|----------------|------------|
| Injection (SQL, Command) | Zod validation, no concatenar |
| XSS | Sanitizar, no `dangerouslySetInnerHTML` |
| Broken Access Control | Validar permisos en cada operación |
| Security Misconfiguration | Configuración explícita, no defaults |
| Vulnerable Components | Dependabot, auditoría de deps |
| Identification Failures | (No aplica aún, no hay auth) |
| Integrity Failures | `npm audit`, lockfile |
| Logging Failures | Logs estructurados con pino |
| SSRF | (No aplica, no fetch a URLs de usuario) |
| Insecure Design | Validación en el borde, parse don't validate |

---

## 11. Qué NO Poner en el Repo

| Elemento | Por qué |
|----------|---------|
| Secretos, tokens, API keys | Compromiso de seguridad |
| Datos personales reales | Privacidad, GDPR |
| Binarios generados | Pueden contener código malicioso |
| `.env` con valores reales | Secretos |
| Credenciales de testing | Podrían ser reales |

Todo esto está en `.gitignore`, pero la regla es: **si tienes duda, no lo commitees**.
