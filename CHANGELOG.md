# Changelog

Todas las versiones notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added
- Scaffold inicial del monorepo pnpm con `shared`, `server` y `ui`.
- Dominio ERD completo: lienzos, tablas, columnas, relaciones, drag-to-move,
  borrado en cascada, validación de invariantes.
- Persistencia automática de lienzos en `~/.arqyx/canvases` con rehidratación
  al arrancar el server.
- Dominio `FlowCanvas` con 5 shapes (rectangle, rounded, diamond, circle,
  note) y 6 colores (neutral, blue, green, amber, red, purple).
- 6 tools MCP para lienzos flow: `create_flow_canvas`, `add_flow_node`,
  `update_flow_node`, `remove_flow_node`, `connect_flow_nodes`,
  `remove_flow_edge`.
- Renderizado UI de lienzos flow con nodos custom por shape y colores
  adaptativos al tema claro/oscuro.
- Drag-to-move bidireccional para nodos ERD y flow — las posiciones se
  persisten en el server y se reflejan en tiempo real en todos los clientes
  conectados.
- Auto-layout con dagre: tool `auto_layout_flow` con direcciones `TB`, `LR` y
  `radial` para reorganizar lienzos automáticamente.
- `AGENTS.md` con 21 secciones de reglas senior, incluyendo idioma, frontend
  y GitHub.
- GitHub Actions con typecheck + lint + test + build en cada PR.
- Branch protection con ruleset que exige PR, CI verde y historial lineal.
- `CHANGELOG.md`, `LICENSE`, `.gitattributes`, `.editorconfig` y plantillas de
  PR e issues en `.github/`.

### Total de tools MCP
18 tools registradas:
- **Canvas** (4): `open_canvas`, `read_canvas`, `list_canvases`,
  `delete_canvas`.
- **ERD** (7): `create_erd_canvas`, `add_table`, `add_column`,
  `remove_column`, `add_relation`, `remove_relation`, `remove_table`.
- **Flow** (7): `create_flow_canvas`, `add_flow_node`, `update_flow_node`,
  `remove_flow_node`, `connect_flow_nodes`, `remove_flow_edge`,
  `auto_layout_flow`.

### Tests
90 tests pasando (76 en `server`, 14 en `ui`).
