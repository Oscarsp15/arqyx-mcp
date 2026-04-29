# 19 — Comunicación con el Humano

> **Asume cero contexto.** El humano puede estar en otra máquina, desde el móvil, o sin recordar el proyecto.

---

## 1. Principio Fundamental

El agente tiene contexto completo del repo. El humano puede no tenerlo.

**La carga de claridad la lleva siempre el agente.**

---

## 2. Cuándo Comunicar al Humano

| Situación | Acción |
|-----------|--------|
| PR listo para review | Comentario con pasos de validación |
| Necesito decisión técnica | Comentario con opciones claras |
| Encontré bloqueo | Comentario explicando el problema |
| Acción destructiva requerida | Pedir confirmación explícita |
| Trabajo terminado | Resumen de lo hecho |

---

## 3. Estructura de un Comentario

### Verbo de Acción Inicial

```markdown
**Validar visualmente los iconos del PR #40 en ambos temas**
```

No: "Hice unos cambios y quizá deberías..."

### Pasos Numerados con Comandos Exactos

```markdown
1. Cambia a la rama y baja deps:
   ```bash
   cd "C:\Users\sentinel\arqyx-mcp"
   git fetch origin chore/33-deps-lucide
   git checkout chore/33-deps-lucide
   pnpm install
   ```

2. Arranca el dev server:
   ```bash
   pnpm --filter @arqyx/ui dev
   ```
```

### URL, Puerto o Ruta

```markdown
3. Abre `http://localhost:5173` en el navegador
```

### Qué Observar Específicamente

```markdown
4. Verifica:
   - El icono de llave (🗝️) aparece junto a columnas con `isPrimaryKey: true`
   - Los iconos Moon/Sun aparecen en el toggle de tema
   - Ambos iconos son visibles en tema claro Y oscuro
```

No: "Verifica que está bien"

### Qué Hacer si Falla

```markdown
5. Si todo OK: comenta "✅ validado" y yo procedo al merge

6. Si algo falla: comenta "❌ [qué falló]" y haremos rollback
```

---

## 4. Ejemplo Completo

```markdown
## Pasos para validar el bump de lucide-react en PR #40

1. Cambia a la rama y baja deps:
   ```bash
   cd "C:\Users\sentinel\arqyx-mcp"
   git fetch origin chore/33-deps-lucide
   git checkout chore/33-deps-lucide
   pnpm install
   ```

2. Arranca Vite (en otra terminal):
   ```bash
   pnpm --filter @arqyx/ui dev
   ```

3. Abre `http://localhost:5173` y verifica:
   - El icono de llave (🗝️) aparece junto a las columnas con
     `isPrimaryKey: true` en los nodos de tabla
   - Los iconos Moon (🌙) y Sun (☀️) aparecen en el toggle de tema
     arriba a la derecha

4. Alterna a tema oscuro con el toggle y verifica que los 3 iconos
   siguen visibles y con buen contraste

5. Si todo OK: comenta "✅ validado en ambos temas" y procedo al merge

6. Si algún icono falla (desapareció, cambió forma, o contraste roto):
   comenta "❌ icono <nombre>" y haremos downgrade
```

---

## 5. Prohibiciones

| Prohibido | Por qué | Correcto |
|-----------|---------|----------|
| "Verifica que está bien" | No dice qué verificar | "Verifica que el icono X aparece en posición Y" |
| `cd path` sin ruta absoluta | El humano no sabe el cwd | `cd "C:\Users\sentinel\arqyx-mcp"` |
| Tecnicismos sin explicar | "El WS hub" | "El servidor WebSocket (`ws-hub.ts`)" |
| Asumir alias del shell | `ll`, `gco` | `ls -la`, `git checkout` |
| Omitir cómo iniciar servicios | El humano no sabe si Vite corre | Incluir `pnpm dev` |

---

## 6. Criterio de Prueba

> Lee el comentario como si fueras alguien que **nunca ha tocado este repo**.
> ¿Puedes ejecutar todos los pasos sin abrir otro archivo?

Si no, falta contexto.

---

## 7. Acciones Destructivas

Si la acción es destructiva (force push, delete branch, drop table):

### Explicar Consecuencias

```markdown
⚠️ **Acción destructiva**

Voy a ejecutar `git push --force` en la rama `feat/42-add-column`.

**Qué pasa:**
- El historial de commits de la rama se reescribe
- Si alguien más hizo pull, sus cambios se pierden

**Cómo recuperar si sale mal:**
- El reflog local tiene los commits originales por 30 días
- Podemos restaurar con `git reflog` + `git reset`

**¿Confirmas? Responde "sí, procede" para ejecutar.**
```

### Esperar Confirmación Explícita

No ejecutar hasta que el humano responda afirmativamente.

---

## 8. Pedir Decisión Técnica

Cuando necesitas que el humano elija:

```markdown
## Decisión requerida: estrategia de validación

**Contexto:**
Necesito validar nombres de columna en `add_column`.

**Opciones:**

1. **Validar unicidad por tabla**
   - Pro: Evita columnas duplicadas
   - Con: Más lógica en el store

2. **Permitir duplicados, validar en UI**
   - Pro: Store simple
   - Con: Posibles errores confusos

3. **No validar (YAGNI)**
   - Pro: Más rápido de implementar
   - Con: El usuario podría crear duplicados

**Mi recomendación:** Opción 1, la validación en el store es más robusta.

**¿Cuál prefieres?**
```

---

## 9. Reportar Bloqueo

```markdown
## Bloqueado: error de tipos en React Flow

**Qué intenté:**
Implementar el nodo custom de tabla siguiendo §09.

**Error encontrado:**
```
Type 'TableNodeData' is not assignable to type 'Node<unknown>'.
```

**Dónde:**
`packages/ui/src/features/erd/table-node.tsx:15`

**Hipótesis:**
Los tipos de React Flow 12.x cambiaron y la documentación está desactualizada.

**Opciones:**
1. Usar `as any` temporal (viola §05)
2. Investigar los tipos correctos (necesito más tiempo)
3. Downgrade a React Flow 11.x

**¿Cómo procedo?**
```

---

## 10. Resumen de Trabajo Terminado

```markdown
## Completado: feat(erd): añadir add_column

**Qué hice:**
- Creé tool MCP `erd_add_column`
- Añadí método `addColumn` al store
- Escribí 6 tests unitarios

**PR:** #42

**Próximos pasos:**
- [ ] Validación visual por ti (instrucciones en el PR)
- [ ] Merge cuando apruebes

**Comandos para validar:**
```bash
cd "C:\Users\sentinel\arqyx-mcp"
git checkout feat/42-add-column
pnpm install
pnpm test  # Ver tests pasar
```
```

---

## 11. Checklist de Comunicación

Antes de enviar un comentario al humano:

- [ ] ¿Empieza con verbo de acción?
- [ ] ¿Los comandos tienen rutas absolutas?
- [ ] ¿Incluí cómo iniciar servicios necesarios?
- [ ] ¿Dije qué verificar específicamente?
- [ ] ¿Expliqué qué hacer si falla?
- [ ] ¿Puede ejecutarse sin abrir otros archivos?
- [ ] ¿Evité tecnicismos sin explicar?
