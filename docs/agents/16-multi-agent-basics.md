# 16 — Coordinación Multi-Agente: Fundamentos

> **Un issue = un agente = una rama.** Las reglas individuales no bastan cuando hay varios agentes.

---

## 1. Contexto

Este repositorio se desarrolla con **múltiples agentes de IA en paralelo**:
- Claude Code
- Cursor
- Copilot
- Otros que vendrán

Estas reglas son **agnósticas al modelo**: aplican igual a Claude, Gemini, GPT, o cualquier LLM.

---

## 2. Regla Fundamental

```
┌─────────────────────────────────────────────────────────┐
│           UN ISSUE = UN AGENTE = UNA RAMA               │
├─────────────────────────────────────────────────────────┤
│  Issue #42 → Agente A → Rama feat/42-add-column        │
│  Issue #43 → Agente B → Rama feat/43-column-ui         │
│  Issue #44 → (sin asignar) → disponible                │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Flujo Obligatorio

### Antes de Empezar Cualquier Trabajo

```bash
# 1. Ver issues disponibles
gh issue list --state open --assignee ""

# 2. Elegir un issue SIN asignar
# 3. Auto-asignarse
gh issue edit <N> --add-assignee @me

# 4. Crear rama con número del issue
git checkout -b feat/<N>-<slug>
```

### Prohibido

| Acción | Por qué |
|--------|---------|
| Trabajar en issue asignado a otro | Colisión de trabajo |
| Auto-asignarse > 2 issues | WIP pequeño, Kanban |
| Crear rama sin issue | Sin trazabilidad |
| Inventar tareas | El backlog es finito |

---

## 4. Detección de Conflictos

### Si Todos los Issues Están Asignados

```
No hay trabajo disponible.
```

**No inventes tareas.** Espera a que un issue quede libre o el humano cree uno nuevo.

### Si Sospechas Abandono

Un issue está asignado pero parece inactivo:

1. **Comenta en el issue** preguntando el estado
2. **Espera respuesta** del humano o del agente asignado
3. **No tomes el issue** hasta que sea desasignado

---

## 5. Draft PR como Señal

El Draft PR es una **señal pública**:

```
"Este issue está siendo trabajado, no lo tomes"
```

### Cuándo Crear Draft

- Trabajo > 30 minutos
- Más de un commit
- Quieres señalar que el issue está ocupado

### Regla de Tiempo

**Prohibido**: cambios locales > 2 horas sin Draft PR.

Si te quedas sin tiempo:
1. Push lo que tengas como draft
2. Comenta en el issue dónde te quedaste
3. Desasígnate si no vas a continuar

---

## 6. Límites de WIP

| Elemento | Límite |
|----------|--------|
| Issues asignados por agente | Máximo 2 |
| Tiempo sin push a Draft | Máximo 2 horas |
| PRs abiertos por agente | Sin límite, pero deben estar activos |

**Filosofía**: Kanban sobre Scrum. WIP pequeño = feedback rápido.

---

## 7. Comunicación entre Agentes

La comunicación pasa por **artefactos persistentes**:

| Canal | Uso |
|-------|-----|
| Issue comments | Estado, handoffs, dudas |
| PR comments | Revisiones técnicas |
| Commit messages | Decisiones en la historia |
| Esta documentación | Reglas para todos |

### Prohibido

- Asumir que otro agente recuerda una conversación
- Comunicación por canales no persistentes

> Lo que no está en el repo nunca existió.

---

## 8. Igualdad entre Agentes

```
Claude = Gemini = GPT = Cursor = Copilot
```

- Los agentes son **peers**, no subordinados
- Un agente no tiene más autoridad que otro
- No importa el modelo, proveedor, o capacidad

---

## 9. Lo Exclusivo del Humano

Solo tres cosas requieren al humano:

| Acción | Por qué |
|--------|---------|
| Merge final | Aprobación de cambios a `main` |
| Tiebreaker | Cuando agentes no acuerdan |
| Revisión visual | Ningún agente tiene navegador real |

---

## 10. Checklist Multi-Agente

Antes de empezar trabajo:

- [ ] ¿Revisé el backlog con `gh issue list`?
- [ ] ¿El issue que elegí está sin asignar?
- [ ] ¿Me auto-asigné con `gh issue edit`?
- [ ] ¿Creé rama con formato `<tipo>/<N>-<slug>`?
- [ ] ¿Tengo máximo 2 issues asignados?

Durante el trabajo:

- [ ] ¿Creé Draft PR si llevo > 30 min?
- [ ] ¿Mis cambios locales tienen < 2 horas sin push?

Al terminar:

- [ ] ¿Marqué PR como Ready?
- [ ] ¿Incluí `Closes #N` en el PR body?

---

## 11. Resumen Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                    CICLO MULTI-AGENTE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Backlog  │───▶│ Asignar  │───▶│  Rama    │───▶│ Draft PR │  │
│  │ (issues) │    │   @me    │    │feat/<N>- │    │          │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │                                               │          │
│       │              ┌──────────┐                     │          │
│       │              │ Humano   │                     │          │
│       │              │ Mergea   │◀────────────────────┘          │
│       │              └──────────┘                                │
│       │                   │                                      │
│       └───────────────────┘                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
