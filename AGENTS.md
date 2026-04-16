# AGENTS.md — Reglas del proyecto `arqyx`

Este archivo es **obligatorio** para cualquier agente de IA (Claude, Cursor,
Copilot, etc.) que escriba código en este repositorio. Las reglas NO son
sugerencias. Este proyecto se desarrolla **100% con agentes de IA**; el humano
revisa, no escribe. Por eso todo debe estar explícito aquí.

---

## 0. Antes de escribir código

1. Lee este archivo **completo**. Cada vez. Sin atajos.
2. Lee el `README.md` y la estructura del repo.
3. Lee los archivos que vas a modificar **enteros**, no solo líneas cercanas.
4. Si una tarea contradice estas reglas, **detente y pregunta**. No las violes
   "solo esta vez".

---

## 1. Arquitectura

- **Monorepo pnpm** con 3 packages: `shared`, `server`, `ui`. No crees un 4º
  sin justificarlo en un ADR (`docs/adr/NNN-titulo.md`).
- **Dependencias permitidas entre packages**:
  - `shared` → no depende de nadie.
  - `server` → depende de `shared`.
  - `ui` → depende de `shared`.
  - `ui` **nunca** importa de `server` ni viceversa. Se comunican por
    WebSocket con mensajes tipados definidos en `shared`.
- **Stack fijo** (no se cambia sin ADR):
  - Lenguaje: TypeScript strict en todos los packages.
  - MCP SDK: `@modelcontextprotocol/sdk`.
  - Web server: `fastify`.
  - WebSocket: `ws`.
  - Validación: `zod`.
  - UI: React 19 + Vite + Tailwind CSS v4 + shadcn/ui + Lucide.
  - Canvas: `@xyflow/react` (React Flow).
  - Estado UI: `zustand`.
  - Tests: `vitest`.
  - Lint/format: `biome`.
  - Package manager: `pnpm`.
- **No hay carpetas `utils/`, `helpers/`, `common/` globales.** Todo vive en
  su feature, o en `shared` si es realmente transversal y tipado.

---

## 2. Responsabilidad única

- Un archivo = una responsabilidad clara expresada en su nombre.
- Un package = una razón para cambiar.
- Una función = un verbo. Si necesitas "and" en el nombre, divídela.
- **Prohibido**: archivos `index.ts` que contengan lógica. `index.ts` solo
  reexporta.

---

## 3. Herramientas MCP (tools)

- Cada tool es **atómica**: hace una cosa, con inputs mínimos.
- **Prohibidas** tools-dios tipo `execute(action, params)`, `do(type, data)`,
  `manage(...)`.
- Cada tool vive en su propio archivo:
  `packages/server/src/mcp/tools/<dominio>/<accion>.ts`.
- Cada tool exporta: `name`, `description`, `inputSchema` (Zod), `handler`.
- La `description` explica **cuándo usarla**, no solo qué hace. El LLM la lee
  para decidir.
- Toda entrada se valida con Zod antes de tocar el estado. Sin excepciones.
- Errores: lanza `McpError` con código JSON-RPC apropiado y mensaje accionable.

---

## 4. Estado

- **Una sola fuente de verdad**: `packages/server/src/state/store.ts`.
- El store es **inmutable por fuera**: devuelve copias o `readonly`.
- Toda mutación pasa por un método del store (`store.addTable(...)`), nunca se
  toca el objeto directo.
- La UI **no** es dueña de estado de dominio. Solo estado visual (selección,
  zoom, tema). El resto llega por WebSocket.
- Tras cada mutación, el store emite un evento por WebSocket a todos los
  clientes conectados.

---

## 5. Tipos y validación

- TypeScript strict: `"strict": true`, `"noUncheckedIndexedAccess": true`,
  `"exactOptionalPropertyTypes": true`.
- **Prohibido**: `any`, `as unknown as`, `@ts-ignore`. Si de verdad hace falta,
  usa `// @ts-expect-error RAZÓN` con la razón.
- Todo tipo de dominio (Table, Column, AwsService, Edge) se define **una sola
  vez** con Zod en `packages/shared/src/schemas/`.
- El tipo TS se deriva con `z.infer`, nunca se duplica manualmente.

---

## 6. Estilo de código

- **Sin comentarios** salvo invariantes no obvias o workarounds documentados.
- **Sin docstrings multi-línea.** Una línea como máximo si es necesario.
- Nombres descriptivos > comentarios.
- **Prohibidas** abreviaturas (`usr`, `cfg`, `mgr`). Nombres completos.
- Funciones < 40 líneas. Si crece, divide.
- Archivos < 300 líneas. Si crece, divide.

---

## 7. Errores

- **Fail loud, fail early.** Nada de `try/catch` que traga errores.
- `try/catch` solo en el borde del sistema (handler MCP, handler WS) para
  convertir a respuesta protocolar.
- Nunca `catch (e) {}`. Nunca `catch (e) { console.log(e) }`. O lo manejas de
  verdad o lo dejas propagar.

---

## 8. Tests

- Toda tool MCP tiene test unitario en `*.test.ts` junto al archivo.
- El store tiene tests de todas sus mutaciones.
- Los schemas Zod tienen tests de casos válidos e inválidos.
- **No se mergea código sin tests** para la lógica que añade.
- Los tests no mockean el store — usan una instancia real en memoria.

---

## 9. Dependencias

- **Pregunta antes de añadir una dependencia nueva.** Justifica en el commit.
- Prohibidas por defecto: `lodash`, `moment`, `axios` (usa `fetch`), cualquier
  librería con > 6 meses sin update.
- Cero dependencias con licencia GPL/AGPL.

---

## 10. Seguridad

- Valida todo input externo con Zod (tool calls MCP, mensajes WS).
- Sanitiza cualquier SVG antes de servirlo.
- No ejecutes código del usuario. Nunca `eval`, `Function()`, ni
  `child_process` con input sin validar.
- Paths de persistencia se resuelven con `path.resolve` y se verifica que
  estén dentro del directorio de datos esperado (anti path-traversal).

---

## 11. Cómo añadir una feature nueva (checklist)

1. ¿Hay un ADR o issue que la describa? Si no, créalo.
2. Define/actualiza los schemas en `shared/`.
3. Añade los métodos del store en `server/src/state/`.
4. Escribe los tests del store.
5. Crea las tools MCP en `server/src/mcp/tools/`.
6. Escribe los tests de las tools.
7. Añade los componentes UI en `ui/src/features/`.
8. Prueba manualmente con MCP Inspector **y** con Claude Desktop.
9. Actualiza `README.md` si cambia la instalación o uso.

---

## 12. Qué NO hacer

- No crear "modo compatibilidad" para features viejas mientras iteramos.
  Rompe y adapta.
- No añadir feature flags para cosas que no están en producción.
- No escribir código "por si acaso". **YAGNI estricto.**
- No refactorizar fuera del alcance del cambio que estás haciendo.
- No commitear `console.log`. Usa el logger (`pino`) si hace falta.
- No mezclar múltiples features en un commit.

---

## 13. Principios de ingeniería (nivel senior, no negociables)

### 13.1 SOLID aplicado
- **S — Single Responsibility**: un módulo/función cambia por **una sola
  razón**. Si al describirlo usas "y", divídelo.
- **O — Open/Closed**: extiende por composición, no modificando código que ya
  funciona. Para añadir GCP, **no tocas** el código de AWS.
- **L — Liskov**: si defines una interfaz, toda implementación debe ser
  intercambiable sin sorpresas. Nada de subclases que lanzan
  `NotImplementedError`.
- **I — Interface Segregation**: interfaces pequeñas y específicas. Mejor 3
  interfaces de 2 métodos que 1 de 6.
- **D — Dependency Inversion**: los módulos de alto nivel no dependen de
  detalles. El store **no importa** WebSocket; recibe un `EventEmitter` por
  constructor.

### 13.2 Composición sobre herencia
- **Prohibido** usar herencia de clases para reutilizar código. Usa
  composición de funciones, tipos discriminados, o inyección.
- Herencia permitida **solo** para extender clases de librerías externas que
  lo exigen.

### 13.3 Pure functions por defecto
- La lógica de dominio son **funciones puras**: mismos inputs → mismos
  outputs, sin efectos secundarios.
- Los efectos (IO, red, disco, reloj) viven en el borde y se inyectan.
- Prohibido `Date.now()` o `Math.random()` dentro de lógica de dominio — se
  reciben por parámetro o se inyecta un `clock`/`idGenerator`.

### 13.4 Inmutabilidad
- Los datos de dominio son inmutables. Usa `readonly` en TypeScript y devuelve
  copias nuevas en las mutaciones del store.
- **Prohibido** mutar parámetros de función.

### 13.5 Parse, don't validate
- En el borde, **parseas** input crudo a un tipo de dominio con Zod. A partir
  de ahí el tipo es prueba de validez.
- Prohibido validar "por las dudas" en capas internas si el tipo ya garantiza
  el invariante.

### 13.6 Make illegal states unrepresentable
- Si dos campos no pueden coexistir, el tipo lo prohíbe (union discriminada),
  no un `if` en runtime.
- Ejemplo:
  `type Edge = { kind: 'erd', from: TableId, to: TableId } | { kind: 'aws', from: ServiceId, to: ServiceId }`.
  **No** un `Edge` genérico con `any`.

### 13.7 Boundaries explícitos
- Cada capa declara su contrato con tipos. Si una función cruza un límite
  (MCP→store, store→WS, WS→UI), el contrato está en `shared`.
- Nada de "objetos que se van llenando" a medida que pasan capas.

---

## 14. Cómo escribir código (reglas concretas)

### 14.1 Funciones
- Máximo **4 parámetros**. Si necesitas más, pasa un objeto tipado.
- Una función hace **una** cosa, en **un** nivel de abstracción. No mezcles
  "abrir archivo" con "parsear JSON" con "validar schema".
- **Return temprano.** Prohibido anidar más de 2 niveles de `if`. Si necesitas
  más, extrae funciones.
- **Sin flags booleanos** en la firma. Si un `boolean` cambia el
  comportamiento, son **dos** funciones.

### 14.2 Nombres
- Funciones: verbo en imperativo (`addTable`, `parseAwsService`), no
  sustantivos.
- Variables: sustantivos descriptivos. `user` no `u`. `tableCount` no `tc`.
- Booleanos: prefijo `is`, `has`, `can`, `should` (`isConnected`,
  `hasColumns`).
- Constantes: `SCREAMING_SNAKE` solo para valores verdaderamente constantes
  del módulo.
- **Prohibido**: nombres que mencionan el tipo (`userArray`, `configObject`).
- **Prohibido**: `data`, `info`, `value`, `result`, `temp`, `foo` como
  nombres finales. Aceptables solo en callbacks de 1 línea.

### 14.3 Control de flujo
- **Prohibido** `else` después de `return`. Return temprano y sigue.
- **Prohibido** `switch` sin `default` exhaustivo. Usa `assertNever` para
  forzar exhaustividad en uniones discriminadas.
- Prefiere `map`/`filter`/`reduce` sobre `for` cuando transformas datos. Usa
  `for` cuando hay efectos o early exit.

### 14.4 Async
- Todo lo async es `async/await`, no `.then()`.
- Nunca `async` sin `await` dentro. Si no esperas nada, no es async.
- Errores en async: `try/catch` solo en el borde. Dentro, propaga.
- **Prohibido** Promise floating (`somePromise()` sin `await` ni `.catch`).
  El linter debe bloquearlo.

### 14.5 Clases (cuando son necesarias)
- Solo si hay estado + comportamiento cohesivos (ej. `CanvasStore`). Si es
  solo datos, usa tipo. Si es solo comportamiento, usa función.
- Constructor **solo asigna**. Lógica pesada va en factory function
  (`CanvasStore.create(...)`).
- Usa `private` de TS, no `_prefijo`.
- **Prohibido** getters/setters que hacen lógica. Son métodos, llámalos
  `getX()` o `setX()`.

### 14.6 Imports
- Orden: (1) builtins Node, (2) dependencias externas, (3) `@shared/*`,
  (4) imports relativos. Biome lo ordena.
- **Prohibido** imports relativos que suben 2+ niveles (`../../..`). Usa path
  aliases.
- **Prohibido** `import *`. Importa lo que usas.

---

## 15. Code smell test

Antes de cerrar un cambio, revísalo contra esta lista. Si algo aplica,
refactoriza **antes** de commit:

- [ ] ¿Hay código duplicado? (Regla de 3: a la tercera repetición, extrae.)
- [ ] ¿Una función hace más de una cosa?
- [ ] ¿Un nombre miente o es vago?
- [ ] ¿Hay un comentario explicando QUÉ hace el código? → reescribe el código,
      borra el comentario.
- [ ] ¿Hay `any`, `as`, `@ts-ignore`?
- [ ] ¿Hay un parámetro que nunca se usa en algún caller?
- [ ] ¿Hay una rama de código que nunca se ejecuta en tests?
- [ ] ¿Hay un `TODO` sin issue asociado?
- [ ] ¿El diff toca archivos fuera del alcance de la feature?

---

## 16. Revisión como senior

Cuando un agente termina un cambio, **debe auto-revisarlo** y reportar:

1. **Qué cambió y por qué** — una línea por archivo tocado.
2. **Qué principios de este AGENTS.md aplicó** — concreto, no genérico.
3. **Qué alternativas consideró y descartó** — al menos una.
4. **Qué queda fuera del alcance** — lo que decidió NO hacer y por qué.
5. **Riesgos conocidos** — qué podría romper y cómo se detectaría.

Si no puede responder honestamente a estos 5 puntos, el cambio **no está
listo**.

---

## 17. Commits y PRs

- Un commit = un cambio lógico atómico. Si el mensaje necesita "y", divide.
- Formato Conventional Commits: `feat(erd): add relation validation`.
- El cuerpo del commit explica el **porqué**, no el qué.
- PRs < 400 líneas de diff cuando sea posible. Si es más, justifica.
- Un PR que toca 3 packages necesita justificar por qué no son 3 PRs.

---

## 18. Reglas para agentes de IA que programan este repo

Este proyecto se desarrolla 100% con agentes de IA. El humano revisa, no
escribe. Por lo tanto cada agente debe cumplir estas reglas al pie de la letra.

### 18.1 Antes de escribir una sola línea
1. Lee `AGENTS.md` completo. Cada vez. Sin atajos.
2. Lee los archivos que vas a modificar **enteros**.
3. Lee los schemas Zod del dominio afectado.
4. Lee los tests existentes del área afectada.
5. Si después de leer no tienes claro QUÉ hacer y POR QUÉ, **pregunta al
   humano**. No adivines.

### 18.2 Antes de proponer un cambio, responde por escrito
- **Objetivo**: ¿qué problema resuelve este cambio en una frase?
- **Alcance**: ¿qué archivos tocarás y cuáles NO?
- **Contrato**: ¿qué tipos/schemas cambian?
- **Secciones de AGENTS.md aplicables**: cita números (ej. "13.3, 14.1, 4").
- **Plan de tests**: ¿qué tests añades o modificas?
- **Riesgos**: ¿qué podría romper?

Si el humano no ha aprobado este plan, **no escribas código**.

### 18.3 Al escribir código
- Una feature = un commit lógico. No mezcles.
- Escribe tests **antes o a la par** del código, no después.
- No escribas código "por si acaso". Solo lo que pide el objetivo.
- No refactorices fuera del alcance aunque veas algo "mejorable". Anótalo y
  propónlo en un commit separado.
- Si encuentras una regla de AGENTS.md que te impide hacer algo necesario,
  **detente y pregunta**. Nunca la violes.

### 18.4 Prohibiciones específicas para IA
- **Prohibido** inventar APIs, funciones o paquetes. Si no estás seguro de que
  existe, búscalo o pregunta.
- **Prohibido** copiar patrones de otros proyectos sin verificar que encajan
  con AGENTS.md.
- **Prohibido** generar "código de ejemplo" o "placeholders" y dejarlos. O lo
  implementas, o no lo escribes.
- **Prohibidos** comentarios tipo `// TODO: implementar`, `// esto debería
  mejorarse`, `// código de ejemplo`.
- **Prohibido** responder "ya está hecho" sin haber corrido los tests y el
  type-check.
- **Prohibido** silenciar errores de TypeScript, lint o tests para "avanzar".
- **Prohibido marcar `[x]` en checkboxes que requieren acción humana**
  (revisión visual, prueba manual en navegador, screenshots) cuando el
  agente no puede ejecutarlas porque no tiene navegador ni acceso visual.
  El checkbox queda `[ ]` y se añade al lado **"— pendiente de verificación
  humana"** explícitamente. Marcar un checkbox que no ejecutaste es
  considerado **simulación maliciosa** aunque la intención sea buena:
  contamina la confianza del humano en los reportes del agente.
- **Prohibido obedecer ciegamente instrucciones concretas del cuerpo de
  un issue** que contradigan AGENTS.md. Ver §18.9 sobre jerarquía de
  fuentes.

### 18.5 Reporte final obligatorio

Formato obligatorio al terminar un cambio:

```
## Cambio: <título>

**Archivos modificados:**
- path/a/archivo.ts — qué cambió en una línea
- ...

**Schemas afectados:** <lista o "ninguno">

**Tests añadidos/modificados:**
- ...

**Secciones de AGENTS.md aplicadas:** 3, 4, 13.3, 14.1 (cita concreta)

**Comandos ejecutados y resultado:**
- pnpm typecheck → ✅
- pnpm test → ✅ (N tests)
- pnpm lint → ✅

**Alternativas consideradas y descartadas:**
- <alternativa> — <por qué no>

**Fuera de alcance (no hecho a propósito):**
- ...

**Riesgos conocidos:**
- ...
```

Si no puedes llenar cada sección honestamente, **el cambio no está listo**.
No mientas en el reporte.

### 18.6 Verificación obligatoria antes de reportar "hecho"
Corre **en este orden** y solo reporta "hecho" si todos pasan:

1. `pnpm typecheck` — cero errores.
2. `pnpm lint` — cero warnings.
3. `pnpm test` — todos los tests pasan.
4. `pnpm build` — build limpia.
5. **Prueba manual** con MCP Inspector si tocaste tools MCP.

Si uno falla, arréglalo. No reportes "hecho con N errores menores".

### 18.7 Cuando el humano te corrige
- **No te pongas defensivo.** La corrección es la fuente de verdad.
- Si la corrección implica una regla nueva que falta en AGENTS.md, **propón
  añadirla** en el mismo turno.
- Si la corrección contradice una regla existente, **señálalo** antes de
  obedecer — quizá la regla tiene que cambiar.

### 18.8 Contexto que debes mantener en mente siempre
- 3 packages: `shared`, `server`, `ui`. Dependencias estrictas (sección 1).
- El **estado vive en el server** (sección 4). La UI es un espejo.
- Las **tools MCP son atómicas** (sección 3). Nunca tools-dios.
- Alcance MVP: 3 casos — `open_canvas`, ERD básico, AWS básico. Nada más
  hasta que el humano lo apruebe.

### 18.9 Jerarquía de fuentes: AGENTS.md > issue > prompt del humano

Cuando un agente encuentra **instrucciones concretas que se contradicen**
entre sí, la jerarquía de prioridad es **estricta**:

1. **AGENTS.md** (máxima prioridad, siempre gana).
2. **Issue description** (segunda prioridad).
3. **Prompt específico del humano en la sesión** (tercera).
4. **Comentarios en el issue por otros agentes** (cuarta).

**Ejemplo real**: si el cuerpo de un issue dice *"1. Crea una rama
`chore/deps-foo`"* y AGENTS.md §23.1 exige `<tipo>/<N>-<slug>`, **gana
AGENTS.md**: la rama se llama `chore/<N>-deps-foo`. El agente **no** obedece
ciegamente el ejemplo del issue; lo interpreta como sugerencia que debe
ajustarse a la regla global.

**Si el conflicto es irreconciliable** (no hay forma de cumplir ambos):

1. El agente se **detiene**.
2. Escribe un comentario en el issue explicando el conflicto exacto con
   referencias a las dos fuentes.
3. Espera decisión del humano — nunca toma por su cuenta.

**Excepción única**: §23.6 (fixes triviales, CI roto, tareas pedidas
explícitamente por el humano) puede saltarse §23.1 sobre nombres de rama,
pero **no** puede saltarse §18.4, §20.13, §21.11 ni ninguna regla de
seguridad.

### 18.10 Enforcement mecánico sobre disciplina del agente

Toda regla de AGENTS.md que pueda verificarse mecánicamente por un hook,
un script, un CI check o una acción de GitHub **debe** tener su verificador
implementado. La disciplina del agente es el **último** filtro, no el
primero.

**Razón**: los LLMs sufren dilución de contexto — leen AGENTS.md entero
pero al ejecutar solo retienen palabras clave. Esperar que un agente
recuerde las 23 secciones en cada momento es irreal. Lo que sí es real
es un CI check que bloquea el merge si se incumplió la regla.

**Aplicación concreta**:

- Nombre de rama que no cumple §23.1 → bloqueado por CI.
- PR body que no contiene las 6 secciones de §21.4 → bloqueado por CI.
- Diff que toca `packages/ui/**` sin sección de revisión visual (§20.13)
  → bloqueado por CI.
- Commit message que no sigue Conventional Commits (§21.3) → bloqueado
  por commitlint en CI.
- PR que intenta mergear con tests rojos → bloqueado por §21.6 branch
  protection.

**Cuándo NO aplica**:

- Reglas que dependen del juicio humano (ej. §14.2 "nombres descriptivos",
  §13.1 SOLID). No hay cómo medirlas mecánicamente; ahí sí se confía en
  la disciplina del agente + el code review.

**Al añadir una regla nueva a AGENTS.md**, el autor debe preguntarse:
*"¿puede un CI check verificarla?"*. Si la respuesta es sí, el PR que
introduce la regla **también** debe incluir el verificador, en el mismo
commit o en un PR dependiente inmediato.

---

## 19. Idioma

Este proyecto mezcla dos audiencias: el código lo leen herramientas y
desarrolladores internacionales, el producto lo usa un equipo hispanohablante.
Por eso el idioma se separa estrictamente por capa.

### 19.1 Identificadores (inglés ASCII, obligatorio)
- Nombres de packages, archivos, carpetas, clases, tipos, funciones,
  variables, constantes, branches, tags: **inglés ASCII puro**.
- **Prohibido** `ñ`, tildes o caracteres no-ASCII en identificadores. Rompen
  npm, PATH en Windows, imports, y búsquedas.
- Ejemplos válidos: `addTable`, `AwsService`, `design-canvas`, `user-id`.
- Ejemplos prohibidos: `añadirTabla`, `diseño`, `conexión`.

### 19.2 Texto visible al usuario (español correcto)
Todo lo que un humano lee en su idioma debe estar en **español correcto con
ñ, tildes y signos de apertura (¿¡)**:

- Textos de la UI (`ui/`): etiquetas, botones, tooltips, mensajes de error.
- `description` de las tools MCP (el LLM las lee para decidir cuándo usarlas,
  y el usuario las ve).
- Mensajes de error mostrados al usuario final.
- README, docs, ADRs, comentarios en documentación.

Ejemplos: *"Añadir tabla"*, *"Conexión establecida"*, *"¿Eliminar este
nodo?"*, *"No se encontró el lienzo"*.

### 19.3 Logs internos (inglés corto)
- Logs del server (pino), mensajes de debug, stack traces internos: **inglés
  corto**. Son grep-friendly y neutrales para cualquier desarrollador.
- Ejemplo: `logger.info({ canvasId }, 'canvas created')`.

### 19.4 Commits y ADRs
- Mensaje de commit: **español**, formato Conventional Commits. Ejemplo:
  `feat(erd): añadir validación de relaciones`.
- Cuerpo del commit: español.
- ADRs (`docs/adr/*`): español.

### 19.5 Errores tipados
Cuando un error se lanza desde el dominio, lleva un **código en inglés** (para
programación) y un **mensaje en español** (para mostrar):

```ts
throw new McpError('TABLE_NOT_FOUND', 'No se encontró la tabla solicitada.');
```

El código es estable y grepeable; el mensaje puede ajustarse sin romper nada.

---

## 20. Reglas senior de frontend (`packages/ui`)

El frontend es donde más fácil se cuela código mediocre. Estas reglas son
estrictas y específicas para React 19 + Vite + Tailwind v4 + React Flow +
Zustand.

### 20.1 Componentes
- Un componente = **un archivo**. Nombre del archivo en `kebab-case.tsx`,
  nombre del componente en `PascalCase`.
- Componente < **150 líneas**. Si crece, extrae subcomponentes o hooks.
- **Un solo `export`** por archivo. Nada de mezclar `Button` + `ButtonGroup`
  + `useButton` en el mismo archivo.
- Prefiere **function components** con props tipadas explícitamente. Prohibido
  `React.FC` (obsoleto, añade children implícito).
- Props: tipo nombrado (`type FooProps = ...`) al principio del archivo, no
  inline en la firma.

### 20.2 Estado UI
- Regla dura: **la UI no es dueña de estado de dominio**. Todo lo que define
  "qué existe" (tablas, servicios AWS, conexiones) vive en el server y llega
  por WebSocket.
- Zustand se usa **solo** para estado visual: selección, zoom, tema, toggles,
  paneles abiertos. Nada de `tables: Table[]` en el store de Zustand.
- **Prohibido** `useState` para estado compartido entre 2+ componentes.
  Levántalo a Zustand o recíbelo por props.
- **Prohibido** duplicar estado del server en React (`useState` sincronizado
  con WebSocket). La única copia del dominio vive en el hook que escucha el WS.

### 20.3 Efectos (`useEffect`)
- **`useEffect` es el último recurso**, no el primero. Antes de usarlo,
  pregúntate: ¿se puede calcular en render? ¿se puede derivar de props? ¿es
  un event handler disfrazado?
- Regla de oro: **no sincronices estado con efectos**. Si ves
  `useEffect(() => setX(derivado), [y])`, refactoriza a `const x = derivado`.
- Todo `useEffect` debe tener **array de dependencias exhaustivo**. El linter
  lo exige. Prohibido ignorar la regla `react-hooks/exhaustive-deps`.
- Los efectos que crean suscripciones/listeners **deben devolver cleanup**.
  Sin excepciones.

### 20.4 Hooks personalizados
- Si dos componentes comparten lógica, extrae un hook `useNombre` en
  `ui/src/features/<dominio>/use-nombre.ts`.
- Un hook = una responsabilidad. No crees hooks-dios tipo `useEverything()`.
- Los hooks que tocan IO (fetch, WS, localStorage) son **thin wrappers**
  sobre una función pura + efecto. La lógica está en la función pura, el
  hook solo la conecta a React.

### 20.5 Renderizado y performance
- **No optimices antes de medir.** Prohibido `useMemo`, `useCallback`,
  `React.memo` especulativos. Solo se añaden cuando hay un profile que
  demuestra la necesidad (y se documenta en un comentario de una línea).
- **Listas con `key` estable**. Nunca `key={index}` si la lista puede
  reordenarse.
- Evita re-renders innecesarios por crear objetos inline en props
  (`style={{...}}`) cuando el componente hijo es caro. Extrae al módulo.

### 20.6 Estilos (Tailwind v4)
- **Solo Tailwind** para estilos. Prohibido `style={{...}}` salvo valores
  verdaderamente dinámicos (ej. `transform: translate(${x}px, ${y}px)`).
- **Prohibido** `!important` (`!` en Tailwind) salvo para sobreescribir
  estilos de librerías externas, y siempre con comentario de una línea que
  explique la razón.
- Usa **tokens del design system** (variables CSS en `globals.css`), no
  valores hex ni rgb hardcodeados. Si un color nuevo hace falta, añádelo a
  `globals.css` como variable primero.
- Tema claro/oscuro: **todo** componente debe verse correctamente en ambos
  temas. Prohibido asumir fondo blanco o texto negro.
- **Prohibido** `className` dinámico con template strings que el compilador
  de Tailwind no puede leer estáticamente. Usa `clsx` o un mapa.

### 20.7 Accesibilidad (no negociable)
- **Todo elemento interactivo** es un `<button>`, `<a>` o input real, no un
  `<div onClick>`.
- Todo botón icon-only tiene `aria-label` en español.
- Todo input tiene `<label>` asociado (o `aria-label`).
- Contraste AA mínimo en ambos temas. Si no estás seguro, verifica.
- Foco visible: no remuevas `outline` sin reemplazarlo.
- Navegación por teclado: todo flujo debe ser usable solo con teclado.

### 20.8 React Flow específico
- **Nodos custom en archivos separados**: `features/<dominio>/<tipo>-node.tsx`.
- Un `nodeType` = un componente = un archivo.
- Los nodos reciben sus datos por `data` prop tipada (nunca `any`). Define
  un tipo por cada nodeType: `type TableNodeData = {...}`.
- **Prohibido** mutar `nodes` o `edges` directamente. Usa los setters de
  React Flow o despacha eventos al server.
- Los cambios de posición del usuario (drag) viajan al server por WebSocket,
  el server actualiza el estado y lo reemite. **Nunca** los guardes solo en
  la UI.

### 20.9 Formularios
- Validación con **Zod** (el mismo schema que usa el server si aplica,
  importado de `@arqyx/shared`).
- **Prohibido** validación manual con `if (x.length < 3)`. Todo pasa por un
  schema.
- Mensajes de error **en español**, mapeados desde el error de Zod.

### 20.10 Imports en UI
- Path alias `@/` para imports internos de `ui/`. Prohibido `../../../`.
- Imports de React Flow: estilos en el **punto de entrada** (`App.tsx`), no
  en cada componente.
- `import type` obligatorio para imports solo de tipo (Biome lo exige).

### 20.11 Tests de UI
- Los componentes que tienen **lógica** (condicionales, efectos, hooks
  custom) tienen tests con Vitest + Testing Library.
- Componentes puramente presentacionales (solo reciben props y renderizan)
  no necesitan test propio, pero sí tests de integración del feature que los
  usa.
- **Prohibido** testar implementación (`expect(useState).toHaveBeenCalled`).
  Testea comportamiento visible: "aparece este texto", "click dispara esta
  acción".

### 20.12 Anti-patrones prohibidos
- `dangerouslySetInnerHTML` salvo para SVGs ya sanitizados.
- `useRef` para guardar estado que debería ser `useState`.
- Mezclar server state + UI state en el mismo hook sin separar.
- Componentes con más de 5 props booleanas (señal de que son N componentes).
- `{condition && <Component />}` cuando `condition` puede ser `0` o `""`
  (renderiza el valor). Usa `{condition ? <Component /> : null}`.
- Callbacks async en event handlers sin manejo de error.

### 20.13 Revisión visual obligatoria en ambos temas

Todo PR que toque código de UI (componentes, estilos, `globals.css`, nuevos
shapes o colores) debe incluir en el cuerpo del PR el checkbox:

> *He abierto el componente en el navegador con tema claro Y oscuro y
> confirmé que el contraste es suficiente y que no hay texto invisible
> (blanco sobre blanco, negro sobre negro, o similar).*

Esta regla existe porque Tailwind permite construir combinaciones que
compilan y pasan el lint, pero producen contrastes inválidos en uno de los
dos temas. El único filtro real es la revisión humana en el navegador.

Si el cambio es solo código sin impacto visual (lógica, tests, refactor no
UI), no aplica y se marca explícitamente: *"no aplica, PR sin impacto
visual"*.

**Responsabilidad del autor**: cuando el PR requiere validación visual, el
**autor** es responsable de incluir en el cuerpo del PR instrucciones
completas para el humano siguiendo §23.8. Estas instrucciones deben
especificar:
- Comandos exactos para levantar el entorno (con rutas absolutas)
- URL/puerto donde validar
- Qué elementos visuales verificar específicamente (no genérico)
- Qué hacer si algo falla

El auditor (§23.9) verifica que estas instrucciones estén presentes y sean
adecuadas como parte del checklist de revisión.

---

## 21. GitHub y control de versiones (nivel senior)

Estas reglas aplican a todos los agentes y humanos que trabajen con este repo.
Están pensadas para un proyecto privado con un único mantenedor humano y
colaboración principal de agentes de IA — pero siguen los estándares que un
senior aplicaría en un equipo grande.

### 21.1 Flujo de trabajo — trunk-based con ramas efímeras

- **`main` es sagrada**. Siempre desplegable, siempre verde, siempre lista
  para ser usada por Claude Desktop / CLI.
- **Nada se commitea directamente a `main`**. Todo pasa por una rama de
  feature + Pull Request, incluso cuando el único revisor eres tú.
- **Ramas efímeras**: vida corta (horas a 2-3 días), un propósito, se borran
  al mergear.
- **No hay ramas `develop` / `staging` / `release` permanentes**. Si
  necesitas congelar una versión, usa **tags**, no ramas.

### 21.2 Nombres de ramas

**Formato principal** (cuando hay issue asociado — ver §23.1):
`<tipo>/<N>-<slug-corto>` donde `<N>` es el número del issue.

- `feat/51-list-canvases` — feature del issue #51
- `fix/72-theme-toggle-persistence` — bug fix del issue #72
- `chore/33-deps-lucide` — mantenimiento del issue #33

**Formato alternativo** (solo para excepciones de §23.6 — sin issue):
`<tipo>/<slug-corto-en-ingles>`

- `fix/ci-lint-format` — fix urgente de CI roto
- `docs/typo-readme` — fix trivial de una línea

Slug en **inglés ASCII** (§19.1), kebab-case, corto, descriptivo.

> **Jerarquía**: §23.1 manda cuando hay issue. Este formato alternativo solo
> aplica a las excepciones documentadas en §23.6.

### 21.3 Commits — Conventional Commits en español (refuerzo §17 + §19.4)

Formato estricto: `<tipo>(<scope>): <mensaje en español>`

**Tipos válidos**: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`,
`style`, `build`, `ci`, `revert`.

**Scopes válidos**: nombre de package o dominio (`shared`, `server`, `ui`,
`erd`, `flow`, `persistence`, `mcp`, `ws`).

**Ejemplos correctos**:
- `feat(flow): añadir dominio FlowCanvas con 5 shapes`
- `fix(ws): validar mensajes entrantes antes de mutar el store`
- `refactor(store): extraer generadores de id a una interfaz`
- `chore(deps): actualizar vitest a 2.2.0`

**Ejemplos prohibidos**:
- `update stuff` → sin tipo ni descripción clara
- `WIP` → no se commitea trabajo a medias
- `feat: cosas y más cosas` → múltiples cambios en un commit
- `Feat: Added flow canvas` → en inglés, capitalizado, sin scope

**Reglas duras**:
- Un commit = un cambio lógico atómico. Si el mensaje necesita "y", **divide**.
- El **cuerpo** del commit explica el **porqué** (la motivación, la
  restricción, el incidente, la decisión), no el qué (eso lo muestra el diff).
- **Prohibido** `git commit --amend` en commits ya pusheados a `main` o a
  una PR abierta (rompe el historial que otros pueden haber fetched).
- **Prohibido** `git push --force` a `main`. A ramas de feature propias, solo
  si estás seguro de que nadie más ha pulled.

### 21.4 Pull Requests

**Todo cambio va por PR**, incluso tus propios cambios como único mantenedor.
Razones:
- Te obliga a revisar el diff completo como si fueras otro.
- Dispara CI (lint + typecheck + tests) antes de tocar `main`.
- Crea un historial navegable de decisiones, no solo de código.

**Tamaño**: PRs **< 400 líneas** de diff cuando sea posible. Si un PR toca
más, **justifica** por qué no podían ser varios PRs. Un PR gigante es más
difícil de revisar que 3 PRs pequeños.

**Título**: mismo formato que un commit — `<tipo>(<scope>): <mensaje>`. Si la
PR tiene un solo commit, título y commit coinciden.

**Cuerpo obligatorio**: debe incluir estas secciones en español:

```markdown
## Resumen
Una o dos frases sobre qué hace este PR y por qué.

## Cambios
- Lista puntual de los cambios importantes.
- Agrupados por package si tocan varios.

## Secciones de AGENTS.md aplicadas
Cita números: 3, 13.3, 20.1, etc.

## Test plan
- [ ] `pnpm typecheck` verde
- [ ] `pnpm lint` verde
- [ ] `pnpm test` verde (N tests)
- [ ] Prueba manual: qué probaste y qué viste
- [ ] Screenshots de UI si hay cambios visuales

## Fuera de alcance
Lo que decidiste NO hacer aquí y por qué.

## Riesgos
Qué podría romper y cómo lo detectarías.
```

Si alguna sección queda vacía, **explica por qué** ("no aplica, PR solo de
docs") en vez de borrarla.

### 21.5 CI — requisito obligatorio

- Toda PR dispara un workflow de **GitHub Actions** que corre en este orden:
  1. `pnpm install --frozen-lockfile`
  2. `pnpm typecheck`
  3. `pnpm lint`
  4. `pnpm test`
  5. `pnpm build`
- **Ningún paso puede fallar** para que el PR sea mergeable.
- **Prohibido** `--no-verify`, `CI=false`, o cualquier bypass del CI.
- Si el CI es flaky (falla intermitente), **arréglalo o cuarentena el test**,
  nunca lo ignores.
- El CI corre en Node LTS actual (20+), Windows + Linux si aplica.

### 21.6 Branch protection en `main`

Configurar en GitHub (Settings → Branches → Add rule):
- **Require pull request before merging**: ✅
- **Require status checks to pass**: ✅ (todos los jobs del CI)
- **Require branches to be up to date before merging**: ✅
- **Require linear history**: ✅ (squash o rebase, nunca merge commits)
- **Do not allow force pushes**: ✅
- **Do not allow deletions**: ✅
- **Include administrators**: ✅ (tú tampoco te saltas las reglas)

**Estrategia de merge preferida**: **Squash and merge**. Razones:
- Historial de `main` limpio: 1 PR = 1 commit.
- El commit resultante usa el título del PR (Conventional Commit).
- Los commits intermedios de la rama quedan accesibles vía el link del PR.

### 21.7 Issues

- Todo trabajo > 30 minutos debería tener un issue asociado.
- Los issues se referencian en los PRs con `Closes #N` en el cuerpo — GitHub
  los cierra automáticamente al mergear.
- **Labels mínimos**:
  - `type:feat`, `type:fix`, `type:refactor`, `type:docs`, `type:chore`
  - `priority:high`, `priority:normal`, `priority:low`
  - `status:blocked`, `status:in-progress`, `status:needs-review`
  - `area:erd`, `area:flow`, `area:aws`, `area:ui`, `area:server`
- **Plantilla de issue obligatoria** en `.github/ISSUE_TEMPLATE/`:
  - `bug_report.md` — pasos para reproducir, comportamiento esperado vs
    actual, entorno.
  - `feature_request.md` — problema que resuelve, alternativas consideradas,
    alcance propuesto.

### 21.8 Secretos y seguridad

- **Cero secretos en el repo.** Jamás. Nunca. Ni siquiera "temporalmente".
- **Nada de `.env` commiteado.** Usa `.env.example` con valores placeholder.
- **Escaneo secreto activo** (GitHub → Settings → Code security →
  Secret scanning): activado.
- **Push protection**: activado. Bloquea commits que contengan tokens
  detectados antes de que lleguen al server.
- Si un secreto **se coló por error**: rotación inmediata del secreto (no
  `git filter-branch`, el secreto ya está comprometido), luego limpieza del
  historial si es sensible.
- **Secrets de CI** (tokens de npm, API keys): **GitHub Secrets** del repo,
  referenciados en workflows con `${{ secrets.NAME }}`.

### 21.9 Dependencias y Dependabot

- **Dependabot activado** en `.github/dependabot.yml`:
  - `npm` semanal para `package.json` de cada package del monorepo.
  - `github-actions` semanal para workflows.
- **PRs de Dependabot se revisan** igual que cualquier otro PR — no auto-merge
  ciego. Leer el changelog, correr tests locales si es mayor.
- **Upgrades mayores** (ej. React 19→20) van en PR propio con nota de
  migración.
- **No descargues deps sin revisar**: si una dep tiene < 1000 descargas
  semanales, < 1 año de vida, o mantainer único, **investiga** antes de
  añadirla (supply chain).

### 21.10 Versionado y releases

- **Semantic Versioning estricto** (`MAJOR.MINOR.PATCH`):
  - `PATCH`: fix sin cambios de API (`0.1.0` → `0.1.1`).
  - `MINOR`: feature nueva compatible (`0.1.1` → `0.2.0`).
  - `MAJOR`: breaking change en la API pública (tools MCP, schemas) (`0.2.0`
    → `1.0.0`).
- **Hasta `1.0.0`** (MVP en desarrollo), breaking changes van en `MINOR`. Eso
  es lo que dice la semver spec para el pre-release.
- **Releases**: crear con `gh release create vX.Y.Z --generate-notes`.
- **Changelog**: `CHANGELOG.md` en la raíz, formato
  [Keep a Changelog](https://keepachangelog.com/). Se actualiza al crear el
  release, no antes.
- **Tags** son inmutables: nunca se re-apuntan. Si algo sale mal, se crea un
  tag nuevo (`v0.1.1` → `v0.1.2`).

### 21.11 Reglas específicas para agentes de IA en GitHub

Refuerzo de §18 aplicado a control de versiones. Un agente de IA que trabaje
con este repo:

1. **Nunca push directo a `main`**. Crea siempre rama de feature.
2. **Nunca `git commit --amend`** después de push, salvo que el humano lo
   pida explícitamente.
3. **Nunca `git push --force`** en ninguna rama sin aprobación del humano
   para esa rama específica.
4. **Nunca `git reset --hard`** sin permiso explícito.
5. **Nunca merge un PR propio** sin que el humano lo apruebe, aunque el CI
   esté verde.
6. **Nunca borra una rama** que no haya creado el mismo agente en la sesión
   actual.
7. **Siempre crea el PR como draft** si el trabajo aún no está terminado.
8. **Siempre llena la plantilla del PR** completa (§21.4). Si falta info,
   pregunta al humano antes de abrir el PR.
9. **Siempre corre `pnpm typecheck && pnpm lint && pnpm test`** localmente
   antes de pushear, no dependas del CI para saber si rompiste algo.
10. **Siempre incluye `Co-Authored-By: Claude <noreply@anthropic.com>`** al
    final del mensaje de commit cuando el agente es quien escribe.
11. **Siempre menciona las secciones de AGENTS.md aplicadas** en el cuerpo
    del PR (sección "Secciones de AGENTS.md aplicadas").
12. Si el humano pide una acción destructiva (force push, delete branch,
    rewrite history), el agente **repite la intención en voz alta** y pide
    confirmación explícita antes de ejecutar.

### 21.12 Archivos de GitHub que este repo debe tener

Estructura esperada en `.github/`:

```
.github/
├── workflows/
│   └── ci.yml                     # lint + typecheck + test + build en cada PR
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   ├── feature_request.md
│   └── config.yml                 # desactiva blank issues
├── PULL_REQUEST_TEMPLATE.md
├── dependabot.yml
└── CODEOWNERS                     # opcional, útil cuando haya > 1 mantenedor
```

Archivos en la raíz:
- `.gitattributes` — normaliza line endings (`* text=auto eol=lf`). Crítico
  en Windows para evitar diffs por CRLF vs LF.
- `.editorconfig` — alineado con `biome.json` para editores que no leen biome.
- `CHANGELOG.md` — vacío hasta el primer release.
- `LICENSE` — aunque sea privado, define qué pasa si algún día se abre.

### 21.13 Qué NO poner nunca en el repo

- Secretos, tokens, API keys, credenciales de BD.
- Archivos con datos personales reales (ni siquiera de prueba).
- Binarios generados (`dist/`, `build/`, `*.exe`).
- Dependencias descargadas (`node_modules/`).
- IDE state (`.vscode/settings.json` específico del usuario, `.idea/`).
- Archivos `.DS_Store`, `Thumbs.db`.
- Backups (`*.bak`, `*~`).
- Carpetas de salida de tests (`coverage/`, `.nyc_output/`).

Todo esto ya está en `.gitignore`, pero la regla aquí es: **si tienes duda,
no lo commitees, pregunta**.

### 21.14 Prohibido crear archivos temporales en el working tree

Cuando un agente necesita escribir texto largo — el body de un PR, una
respuesta formateada, un plan de trabajo intermedio, output de debug —
**nunca** lo escribe en un archivo dentro del working tree del repo, ni
siquiera con intención de borrarlo después.

**Por qué**:

- Los temp files son la causa raíz de commits sucios. Un `git add -A` los
  stagea sin que el agente lo note.
- Ensucian `git status` y confunden los reviews.
- Empujan al agente hacia atajos destructivos como `git push --force`
  para limpiar el error después (caso real: PR #33).
- **Añadirlos a `.gitignore` es un anti-patrón**: normaliza el mal
  hábito y no soluciona el problema de raíz. El agente sigue creando
  basura, solo que ahora la basura es invisible.

**Alternativas permitidas (todas sin tocar el working tree)**:

1. **Inline con `gh pr create --body "texto..."`**. El body va directo al
   comando, sin archivo intermedio.
2. **Heredoc en bash**:
   ```bash
   gh pr create --body "$(cat <<'EOF'
   ## Resumen
   ...
   EOF
   )"
   ```
   El texto vive en el shell, no en disco.
3. **Rutas del sistema fuera del repo**:
   - Linux/Mac: `/tmp/foo.md`, `$HOME/.cache/foo.md`
   - Windows cmd: `%TEMP%\foo.md`
   - Windows PowerShell: `$env:TEMP\foo.md`
   - **Nunca** dentro del working tree del repo, aunque sea "por un momento".
4. **Memoria del agente** para texto corto. Los LLMs pueden mantener
   plantillas y estructuras en su propio context sin necesidad de
   escribirlas a disco.

**Prohibido explícitamente**:

- Crear `pr_body.md`, `scratch.md`, `notes.txt`, `plan.md`, `tmp.json`,
  o cualquier archivo similar dentro del working tree.
- Añadir patrones de temp files al `.gitignore` para ocultar el problema.
  Si la basura existe, la acción correcta es **no crearla** en primer
  lugar.
- Crear archivos "de apoyo" que el agente planea borrar al final.
  Cualquier cosa que "se borra al final" no debería haberse creado en
  primer lugar dentro del working tree.

**Si un agente detecta que creó un temp file por error**:

1. `rm <archivo>` inmediatamente, **antes** de cualquier `git add`.
2. **No** lo commitea.
3. **No** lo añade a `.gitignore`.
4. Verifica con `git status` que el working tree vuelve a estar limpio
   (solo los cambios legítimos del deliverable).

Esta regla nace del caso real del PR #33 (force-push para borrar un
`pr_body.md` commiteado por error) y del PR #44 (mismo patrón, esta vez
detenido antes del commit pero aún contaminando `git status`).

---

## 22. Design system y tema visual

Este proyecto mezcla tema claro y oscuro, múltiples tipos de lienzo y cientos
de combinaciones de color. Para que todo se vea consistente y sin bugs de
contraste, estas reglas son obligatorias para cualquier cambio de UI.

### 22.1 Design tokens — fuente única de color

- **Todo color** usado en la UI vive primero como **variable CSS en
  `packages/ui/src/styles/globals.css`**, con variante clara y oscura
  definidas en el mismo commit.
- Las clases Tailwind que uses en componentes **deben resolver a estos
  tokens**: `bg-background`, `text-foreground`, `border-border`,
  `bg-muted`, etc.
- **Prohibido** usar clases Tailwind de color directas (`bg-blue-500`,
  `text-red-700`) en componentes de dominio salvo excepciones documentadas
  en un comentario de una línea.
- Excepción permitida: paletas semáforo (verde éxito, amber advertencia,
  rojo error) cuando el significado es intrínseco al color y no decorativo.
  Aun así, deben probarse en ambos temas.
- Si necesitas un color nuevo, **primero lo añades como token** (con su
  variante oscura), y después lo usas. No al revés.

### 22.2 Contrato claro/oscuro

Regla dura: **ningún componente puede asumir el color de fondo**. Si un
componente define un color de texto, también es responsable de garantizar
que contrasta con el fondo sobre el que se renderizará, **en los dos temas**.

Aplicación concreta:

- Si añades una variable CSS en `:root`, añades **inmediatamente** su
  contraparte en `[data-theme='dark']` en el mismo cambio. No se aceptan
  PRs que definan solo una variante "para después".
- Nunca hardcodees `bg-white`, `bg-black`, `text-white`, `text-black` en un
  componente. Usa los tokens del design system.
- **Contraste mínimo AA** (4.5:1 para texto normal, 3:1 para texto grande)
  en ambos temas. Si no estás seguro, usa un checker (ej. DevTools →
  Lighthouse).
- Los colores con significado semántico (iconos de estado, badges) deben
  elegirse para ser legibles en **ambos fondos**, no solo el tema por
  defecto.

Esta regla existe porque Tailwind permite escribir combinaciones que
compilan y pasan el lint pero producen texto invisible en uno de los dos
temas. El filtro es la revisión visual (§20.13).

### 22.3 Iconografía

- **Única librería de iconos permitida: Lucide** (`lucide-react`). No se
  añaden otras sin ADR.
- **Prohibido** SVG custom inline dentro de componentes salvo que el icono
  no exista en Lucide y el caso esté justificado en un comentario.
- Tamaños consistentes alineados a la tipografía:
  - `h-3 w-3` para texto `text-xs`
  - `h-4 w-4` para texto `text-sm` y `text-base`
  - `h-5 w-5` para texto `text-lg` en adelante
- **Color**: siempre `currentColor` (heredado del texto). No hardcodees un
  color en el SVG del icono.
- **Iconos decorativos** (al lado de un texto que ya dice lo mismo):
  `aria-hidden="true"`.
- **Iconos interactivos** (botón icon-only): el elemento contenedor lleva
  `aria-label` descriptivo en español, el icono lleva `aria-hidden="true"`.
- **Iconos con significado único** (no acompañados de texto): su contenedor
  lleva `aria-label` descriptivo en español.

### 22.4 Estados de componentes async

Todo componente que obtiene datos de fuente externa (WebSocket, fetch,
MCP, disco) tiene **4 estados explícitos**:

1. **loading** — mientras los datos no han llegado todavía.
2. **empty** — cuando llegaron pero no hay nada que mostrar.
3. **error** — cuando la fuente falló.
4. **success** — el happy path.

Reglas duras:

- **Prohibido** renderizar `null` silenciosamente durante loading. Siempre
  hay un skeleton, spinner o texto de "Cargando…".
- **Prohibido** asumir que los datos llegan. Todo tipo que puede no existir
  es `T | null` o `T | undefined`, nunca se usa `!`.
- **Empty states** tienen un **CTA claro en español** que le dice al usuario
  qué hacer. Ejemplo: *"No hay lienzos todavía. Pídele a Claude que cree
  uno con `create_flow_canvas`."*
- **Error states** tienen:
  - Mensaje en español que explica qué pasó.
  - Botón de reintentar cuando la operación es reintentable.
  - Código de error tipado (§19.5) por debajo para debugging.
- **Nunca** un `try/catch` silencia un error async sin mostrarlo al usuario
  de alguna forma (log + UI + ambos).

### 22.5 Jerarquía visual vs legibilidad

El contenido **secundario** (etiquetas de edge, metadatos, anotaciones,
hints, tooltips, breadcrumbs) debe ser visualmente distinto del **primario**
(labels de nodo, títulos, acciones), pero la **legibilidad AA nunca se
sacrifica para señalar secundariedad**.

**Señales permitidas para marcar "secundario"**:

- Tamaño de fuente menor (ej. `0.7rem` vs `0.875rem`).
- Ausencia de borde cuando el primario sí lo tiene.
- Transparencia del fondo (`fill-opacity: 0.85-0.9`, nunca 100% opaco, nunca
  menos de 0.7).
- Tipografía menos pesada (`font-normal` vs `font-medium`).
- Posición "flotante" encima de otro elemento (sobre una línea, junto a un
  icono).
- Esquinas redondeadas diferentes del primario (pill vs caja).

**Señales prohibidas**:

- Bajar el contraste del texto por debajo de **4.5:1** (AA normal) para
  atenuar visualmente.
- Usar `--color-muted-foreground` para texto que el usuario necesita leer
  rápido sin zoom. Ese token es para texto verdaderamente accesorio
  (placeholders, hints de form, timestamps).
- Opacidad agresiva (< 0.7) que haga el texto difícil de leer sobre fondos
  complejos.

**Criterio de decisión**: si necesitas acercarte a la pantalla para leer el
texto secundario, la jerarquía está mal. Súbelo a `--color-foreground` (o el
tono equivalente en tu tema) y compensa la secundariedad con las otras
señales permitidas.

### 22.6 Librerías externas y mapeo al design system

Toda librería externa que inyecte su propio CSS (React Flow, shadcn/ui,
Radix, Tailwind defaults, Mermaid, Excalidraw…) debe ser **mapeada
explícitamente a los tokens del design system** en `globals.css`, para
ambos temas, en el **mismo commit** que integra la librería.

**No se acepta** "dejar los defaults por ahora". Los defaults son casi
siempre colores hardcoded (`white`, `black`, `#fff`, `rgb(...)`, o
`prefers-color-scheme`) y rompen §22.2.

**Aplicación concreta**:

- Usa las **variables CSS que exponga la librería** cuando existan
  (ej. `--xy-*` en React Flow, `--radix-*` en Radix UI). Las asignas en
  `:root` y `[data-theme='dark']` con los tokens de tu design system.
- Si la librería no expone variables, **escribe selectores directos** sobre
  sus clases en `globals.css` (ej. `.react-flow__edge-textbg { fill: ... }`).
- Para cada elemento visible o interactivo de la librería, define su
  apariencia en **claro Y oscuro** antes de commitear la integración.
- Mantén todas las overrides **agrupadas en `globals.css`**, no dispersas
  por componentes, para que auditar el contrato claro/oscuro sea una sola
  lectura.
- Documenta cada bloque con un comentario de una línea indicando qué
  librería y qué elemento cubre.

**Por qué**: los bugs de texto invisible en nodos flow y de edge labels
con fondo blanco hardcoded vinieron ambos de dejar defaults de React Flow
sin mapear. Esta regla los habría prevenido.

---

Estas subsecciones (§22.1-22.6) son la base del design system.
Las siguientes (tipografía escalonada, espaciado, responsive, animaciones,
semántica HTML) se añadirán cuando empiecen a doler. YAGNI (§12).

---

## 23. Coordinación multi-agente

Este repositorio se desarrolla con **múltiples agentes de IA en paralelo**:
Claude Code, Antigravity (con Gemini/GPT/Claude internamente), Cursor,
Copilot en modo agente, y otros que vendrán. Las reglas de §18 (comportamiento
individual del agente) no bastan cuando hay dos o más trabajando en el mismo
repo al mismo tiempo. Estas reglas son para evitar que se pisen entre ellos.

Son **agnósticas al modelo**: aplican igual a Claude, Gemini, GPT, o cualquier
LLM que corra dentro de cualquier IDE agéntico.

### 23.1 Un issue, un agente, un branch

Regla dura: **todo trabajo empieza con un issue en GitHub**. Sin issue, no
hay branch ni PR (salvo fixes triviales de una línea).

Flujo obligatorio antes de tocar código:

1. **Revisar el backlog** con `gh issue list --state open` o el Project
   board.
2. **Elegir un issue sin asignar**. Si todos están asignados a otros
   agentes, no hay trabajo disponible — no inventes tareas.
3. **Auto-asignarse** con `gh issue edit <N> --add-assignee @me`. Esto
   declara intención pública de trabajar en el issue.
4. **Crear la rama** con el número del issue en el nombre:
   `<tipo>/<N>-<slug-corto>` — ejemplo: `feat/42-add-sql-export`.
5. **A partir de ahí, el workflow de §21 aplica normal**.

**Prohibido**:

- Trabajar en un issue ya asignado a otro agente, aunque el otro agente
  parezca inactivo. Si sospechas abandono, comenta en el issue preguntando
  y espera respuesta del humano.
- Auto-asignarse más de **2 issues simultáneamente**. El WIP (work in
  progress) por agente es pequeño a propósito: Kanban sobre Scrum.
- Crear una rama sin issue asociado, salvo excepción documentada en la
  sección §23.5.

### 23.2 Draft PR como señal de "work in progress"

- Si el trabajo lleva > 30 minutos o cruza más de un commit, **abre un
  Draft PR inmediatamente** — aunque no esté listo para review.
- El Draft PR es una señal pública para otros agentes: *"este issue está
  siendo trabajado, no lo tomes".*
- Cuando el trabajo esté listo, márcalo como "Ready for review" con
  `gh pr ready <N>`.
- **Prohibido**: tener cambios locales sin push durante > 2 horas sin un
  Draft PR que los represente. Si te quedas sin tiempo, pusheas lo que
  tengas como draft y dejas un comentario en el issue explicando dónde
  te quedaste.

### 23.3 Handoff entre agentes

A veces un agente empieza un issue y no puede terminarlo (falta de tiempo,
contexto, capacidad). El handoff debe ser **explícito** para que otro
agente pueda retomar sin perder trabajo.

Protocolo:

1. Agente original hace `gh issue edit <N> --remove-assignee @me`.
2. Agente original deja un **comentario estructurado** en el issue:

```markdown
## Handoff

**Estado actual:** [qué está hecho, qué falta]

**Decisiones tomadas:** [alternativas consideradas y por qué descartadas]

**Bloqueos encontrados:** [si aplica]

**Rama en curso:** `<nombre>` (commit `<sha>`)

**Siguiente paso sugerido:** [lo que haría yo si siguiera]
```

3. Agente siguiente lee el comentario **completo** antes de tomar el
   issue. Si no entiende algo, pregunta en el issue antes de continuar.
4. Agente siguiente se auto-asigna, puede continuar en la misma rama o
   crear una nueva (a su criterio), y la rama vieja se cierra si queda
   huérfana.

### 23.4 Peer review entre agentes y rol exclusivo del humano

**Cualquier agente** (Claude, Gemini, GPT, Antigravity, Cursor, Copilot, u
otro) puede:

- **Auditar** el código, los commits y el PR body de cualquier otro agente.
- **Leer** el working tree, git history, issues, PRs y comentarios.
- **Comentar** en issues y PRs con objeciones técnicas, sugerencias o
  preguntas, citando secciones de AGENTS.md cuando aplique.
- **Revisar formalmente** un PR con `gh pr review --approve`, `--comment`
  o `--request-changes`.
- **Proponer ediciones** al PR body, al título, a los tests, o al código
  en un commit posterior de la misma rama.
- **Crear un PR nuevo** que ajusta, refactoriza o corrige el trabajo de
  otro agente, enlazando el PR original y explicando los cambios.

Los agentes son **peers**, no subordinados entre sí. Un agente no tiene más
autoridad que otro por ser de mayor capacidad, modelo más caro o venir de
mejor proveedor.

**Lo único exclusivo del humano** son tres acciones:

1. **Merge final** del PR (el squash-merge de la UI de GitHub o
   `gh pr merge`).
2. **Tiebreaker técnico** cuando dos agentes no llegan a acuerdo tras una
   ronda de comentarios.
3. **Revisión visual de la UI** (§20.13), porque ningún agente tiene
   navegador real con renderizado pixel-perfect.

**Reglas duras de auditoría**:

- **No hay merge-wars**. Ningún agente mergea sin humano.
- Un agente **no cierra** un PR de otro agente sin aprobación humana, salvo
  que el PR esté obsoleto (rebase imposible) y tenga un comentario del
  humano autorizando.
- Los comentarios sin resolver de otro agente **bloquean** el merge del
  propio agente hasta que el humano los resuelva o los marque como
  wontfix.
- Los agentes **deben citar** secciones de AGENTS.md al hacer comentarios
  técnicos — no pueden decir "esto no me gusta" sin referencia.
- **Cuando el humano pide** a un agente que audite o edite el trabajo
  de otro agente, el agente lo hace sin auto-limitaciones ("soy solo
  Claude, no debería modificar el PR de Antigravity"). La autorización
  ya está dada por la petición.

### 23.5 Creación de issues (cuando un agente propone trabajo)

Un agente puede **proponer un issue nuevo** al backlog cuando:

- Encuentra un bug mientras trabaja en otra cosa (y no forma parte del
  alcance actual — §12 YAGNI, §18.3).
- Identifica una refactorización necesaria que no puede hacerse en el PR
  actual.
- Detecta una regla de AGENTS.md que está faltando.
- El humano le pide explícitamente crear un issue.

**Reglas para crear un issue**:

1. **Usa la plantilla** apropiada (`bug_report` o `feature_request`) —
   están en `.github/ISSUE_TEMPLATE/`.
2. **Título**: formato Conventional Commits en español, ejemplo
   `feat(erd): añadir export_sql_ddl para PostgreSQL`.
3. **Labels obligatorios**:
   - `type:feat`, `type:fix`, `type:refactor`, `type:docs`, `type:chore`
     (uno y solo uno).
   - `priority:high`, `priority:normal`, `priority:low` (uno).
   - Al menos un `area:*` (erd, flow, aws, ui, server, shared, ci, agents).
4. **No auto-asignarse** al crearlo. El issue entra sin asignar al
   backlog y el humano (o el propio agente, después) decide cuándo
   tomarlo.
5. **Enlazar contexto**: si el issue nace de un PR, conversación o bug
   detectado, enlázalo en el cuerpo (`Relacionado con #N` o URL).
6. **Tamaño razonable**: un issue debería completarse en **< 1 día de
   trabajo**. Si es más grande, divídelo en sub-issues o documenta la
   división propuesta en el cuerpo.
7. **No duplicar**: antes de crear, revisa con
   `gh issue list --search "<palabra-clave>"` si ya existe uno similar.

**Prohibido**:

- Crear issues "por si acaso" para ideas no justificadas por un problema
  real (§12 YAGNI).
- Crear un issue y trabajarlo en el mismo turno sin dejar que otros
  agentes lo vean — salvo que el humano lo apruebe explícitamente.
- Cerrar issues que no creaste tú salvo que el PR que los resuelve use
  `Closes #N` (GitHub los cierra automáticamente al mergear, eso sí vale).

### 23.6 Excepciones que NO necesitan issue

Estas excepciones permiten saltarse §23.1 y crear una rama + PR directamente:

- **Fixes triviales de una línea** (typo en comentario, imports ordenados
  por Biome, formato).
- **Respuestas urgentes a CI roto en `main`** (aunque el humano debería
  saberlo en Slack/chat también).
- **Tareas que el humano pide explícitamente "ahora mismo"** sin pasar
  por backlog. Estas llevan scope `chore` y una nota *"solicitado
  directamente por el humano, sin issue"* en el cuerpo del PR.

Todas las demás tareas pasan por issue.

### 23.7 Comunicación entre agentes

Cuando dos agentes necesitan coordinar, la comunicación pasa por
**artefactos persistentes** (issues, PR comments, commits), **nunca** por
chat privado o memoria de sesión.

- **Issue comments** — para estado de avance, handoffs, dudas de alcance.
- **PR comments** — para revisiones técnicas y decisiones de diseño.
- **Commit messages** — para decisiones que quedan en la historia
  (§17 y §21.3).
- **AGENTS.md** — para reglas que deben aplicar a todos los agentes
  futuros. Si una conversación entre agentes produce una lección
  reutilizable, **proponer un PR a AGENTS.md**.

**Prohibido** asumir que otro agente recuerda una conversación anterior.
Cada sesión de cada agente empieza de cero; lo que no está en el repo
nunca existió.

### 23.8 Comentarios dirigidos al humano

Cuando un agente deja un comentario en un issue o PR pidiendo **acción
humana** (revisión visual, prueba manual en navegador, decisión técnica,
smoke test, intervención manual), el comentario debe ser **auto-contenido
y asumir cero contexto previo del proyecto**.

El agente que comenta tiene contexto completo del repo; el humano puede
estar respondiendo desde el móvil, en otra máquina, o sin recordar dónde
estaban los servicios corriendo. La carga de claridad la lleva siempre
el agente, no el humano.

**Estructura obligatoria del comentario**:

1. **Verbo de acción inicial**: qué hay que hacer en una frase
   (ej. *"Validar visualmente los iconos del PR #40 en ambos temas"*).
2. **Pasos numerados con comandos exactos**, no abreviaturas:
   - Cada `cd` con la **ruta absoluta** o el cwd explícito en la línea
     anterior.
   - Cada comando completo, sin asumir alias o variables del shell del
     humano.
   - Si depende de un servicio corriendo (Vite, dev server), incluir el
     comando para arrancarlo.
3. **URL, puerto o ruta** donde mirar, si aplica.
4. **Qué observar específicamente** (no "verificar que está bien", sino
   "verificar que el icono X aparece en la posición Y con el color Z").
5. **Qué hacer si algo sale mal**: qué reportar, qué comando ejecutar
   para volver atrás, o cuándo pedir ayuda.

**Ejemplo malo**:

> *"Validar visualmente."*

**Ejemplo bueno**:

> *"**Pasos para validar el bump de lucide-react en PR #40**:*
>
> *1. Cambia a la rama y baja deps:*
>
> ```bash
> cd "C:\Users\sentinel\Documents\MCP - Diseño"
> git fetch origin chore/33-deps-lucide-1
> git checkout chore/33-deps-lucide-1
> pnpm install
> ```
>
> *2. Arranca Vite si no lo tienes corriendo (en otra terminal):*
>
> ```bash
> pnpm --filter @arqyx/ui dev
> ```
>
> *3. Abre `http://localhost:5173` y verifica:*
>
> *- El icono de llave (🗝 `Key`) aparece junto a las columnas con
>     `isPrimaryKey: true` en los nodos de tipo `table`.*
> *- Los iconos `Moon` (🌙) y `Sun` (☀️) aparecen en el botón toggle
>     arriba a la derecha del header.*
>
> *4. Alterna a tema oscuro con el toggle y verifica los 3 iconos
>     siguen visibles y con buen contraste.*
>
> *5. Si todo OK, comenta `✅ validado en ambos temas` y yo procedo
>     al merge.*
>
> *6. Si algún icono falla (desapareció, cambió forma notablemente, o
>     contraste roto), comenta `❌ icono <nombre>` y haremos downgrade
>     con `gh pr close 40` y un nuevo PR pinneando la versión 0.460.0."*

**Reglas duras**:

- **Prohibido** usar *"verifica que está bien"* sin decir **qué**
  verificar específicamente.
- **Prohibido** comandos relativos sin cwd explícito (`cd path` o `cwd:
  path` en la línea anterior).
- **Prohibido** asumir que el humano sabe qué archivos, paths, puertos
  o servicios del proyecto son. Cada cosa nombrada se acompaña de su
  contexto la primera vez.
- **Prohibido** usar tecnicismos sin glosar (*"el WS hub"* sin explicar
  qué es) en un comentario dirigido al humano.
- Si la acción es **destructiva** (force push, delete branch, drop
  table), explicar en una frase qué pasa si se equivoca y cómo
  recuperar.

**Criterio de prueba**: lee el comentario como si fueras alguien que
**nunca ha tocado este repo** y ves el comentario en una notificación de
GitHub. ¿Puedes ejecutar todos los pasos sin abrir otro archivo del
repo? Si no, falta contexto.

Esta regla nace del feedback real del PR #40, donde el comentario
inicial de Claude al humano asumía contexto que no debía asumir.

### 23.9 Rol del auditor: reportar, no fixear

Cuando un agente audita el trabajo de otro agente (§23.4), su rol **por
defecto** es **reportar, no fixear**. La tentación de "arreglarlo yo
mismo porque es rápido" es un error sistémico que rompe el ciclo de
aprendizaje del autor original y confunde la autoría del trabajo.

**Responsabilidades del auditor**:

1. Leer el diff completo del PR.
2. Validar cumplimiento con AGENTS.md en todas las secciones aplicables.
3. Detectar bugs técnicos, cobertura de tests insuficiente, violaciones
   de estilo, decisiones de diseño cuestionables.
4. **Si el PR toca UI** (§20.13 aplica): verificar que el autor incluyó
   instrucciones completas para validación visual siguiendo §23.8. Si
   faltan o son insuficientes, es un finding que el autor debe corregir.
5. **Dejar un review estructurado** en el PR con `gh pr review --comment`
   o `gh pr review --request-changes` (si la cuenta permite request
   changes — GitHub bloquea request-changes sobre el propio PR).
6. **NO editar el código** salvo casos excepcionales (ver abajo).

**Estructura obligatoria del review del auditor**:

Para cada finding:

- **Severidad**: `🔴 high` / `🟠 medium` / `🟡 low`.
- **Ubicación**: `archivo:línea` exacta cuando aplique.
- **Regla AGENTS.md**: cita la sección violada con `§X.Y`.
- **Problema**: descripción concisa de qué está mal.
- **Fix sugerido**: código concreto o prosa clara de cómo resolverlo.

Además, el review debe incluir una **sección "Lo que está bien"** para
dar contexto positivo. Un review que solo lista problemas desmoraliza al
autor original y pierde señal.

**Cuándo el auditor SÍ puede editar directamente**:

- **Delegación explícita del humano**: *"auditor, arregla el bug X del
  PR #Y"*. A partir de esa frase concreta, el auditor tiene permiso
  para hacer commits sobre la rama del autor original.
- **Autor original abandonó la tarea**: aplicó §23.3 handoff. En ese
  caso, el siguiente agente toma el trabajo completo, no solo como
  auditor.
- **Fix puramente mecánico**: lint autofix (`pnpm lint:fix`), formato
  automático (`biome format`), reorder de imports, corrección de typos
  en comentarios. **Nunca lógica de negocio**.
- **Correcciones al body del PR** (no al código): sección faltante de
  §21.4, checkbox de §18.4 mal marcado, descripción incompleta. El body
  es metadata del PR, no parte del deliverable.

**Cuándo el auditor NO debe editar**:

- **Por defecto**, salvo que aplique una de las excepciones arriba.
- Cuando el fix involucra lógica de negocio (operaciones puras, schemas,
  handlers, tests).
- Cuando el fix cambia la intención o el alcance del autor original.
- Cuando el fix puede interpretarse de múltiples maneras y requiere
  decisión.
- Cuando el autor original aún está activo y puede leer el review y
  responder.

**Por qué esta regla importa**:

- **Aprendizaje del autor original**: si el auditor limpia silenciosamente,
  el autor no aprende qué hizo mal y repite los mismos errores.
- **Trazabilidad**: un review estructurado deja en el historial del PR
  **qué** se detectó, **por qué**, y **qué** se decidió. Los commits
  silenciosos del auditor pierden esa información.
- **Sostenibilidad**: un patrón donde el auditor hace el 15% del trabajo
  del autor no escala. Si el agente A entrega 85% y el agente B limpia,
  en el siguiente PR A entrega 70%, luego 50%, y acabamos con un autor
  pasivo y un auditor exhausto.
- **Autoría clara**: un PR debe ser atribuible. Si dos agentes
  commitean sin coordinación, el blame de git se vuelve confuso.

**Patrón correcto de colaboración auditor-autor**:

1. Autor A entrega PR.
2. Auditor B hace review estructurado con findings.
3. **Humano decide** el siguiente paso:
   - *"A, arregla los findings"* → A commitea una nueva versión.
   - *"B, arregla tú los findings"* → delegación explícita, B commitea
     sobre la rama de A con autorización.
   - *"Mergea tal cual, los findings van a follow-ups"* → se crean issues
     nuevos y se mergea el PR como está.
4. Auditor B re-revisa si aplica.
5. Humano mergea cuando esté listo.

Esta regla nace del PR #44 donde Claude Code (auditor) iba a commitear
directamente sobre la rama de Antigravity para "arreglar 3 findings
menores" sin delegación explícita del humano. El humano corrigió el
patrón antes de que ocurriera.
