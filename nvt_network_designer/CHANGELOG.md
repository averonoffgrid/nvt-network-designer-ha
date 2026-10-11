# Changelog

## 0.3.0
- Node names can be edited directly in the React Flow node.
- Node name is stored in project.json and is authoritative for Home Assistant device naming.
- Every Deploy republishes Home Assistant MQTT Discovery.
- One NVT node = one HA device identified permanently by the 96-bit UUID.
- NVT variables are exposed as HA entities with stable unique IDs based on UUID + VAR_ID.
- Writable variables receive HA commands through Node 0 semantics (`DIRECT_WRITE`).
- MQTT broker credentials are obtained automatically from the Home Assistant Supervisor MQTT service.
- Removed entities are cleaned from MQTT Discovery on the next Deploy.
- Runtime state is published continuously to HA even when Designer UI is closed.

# Changelog

## 0.2.0
- Added a real runtime binding simulator.
- Subscriber variables now receive the source value after Deploy.
- Supports NVT_SWITCH, NVT_TEMP, NVT_PERCENT and NVT_VOLT propagation.
- Supports one source to many receivers.
- Supports self-binding and multi-hop binding chains.
- Active bindings are highlighted/animated when their source changes.
- Runtime is polled every 500 ms.
- Receiver-side deployment model is unchanged.

# Changelog

## 0.1.6
- Restores the local repository wrapper layout expected by the existing Home Assistant Supervisor store record.
- Keeps the v0.1.5 React Flow handle fix.
- Adds current Home Assistant app image labels to the Dockerfile.

# Changelog

## 0.1.5
- Rebuilt NVT connection points using a visible child element inside each React Flow Handle.
- Added `useUpdateNodeInternals()` after commissioning/profile changes.
- Explicitly sets `isConnectable=true`.
- Handle hit-area is 22 px; visible colored dot is 13 px.
- This follows the React Flow recommended custom-handle pattern and removes dependence on default handle styling.

# Changelog

## 0.1.4
- Reworked React Flow connection ports so they are rendered INSIDE dedicated left/right columns.
- Publisher ports are always blue and visible in the right column.
- Subscriber ports are always green and visible in the left column.
- Variables with direction `both` show both ports.
- Removed dependence on handles protruding outside the node border.

# Changelog

## 0.1.3
- Fixed invisible React Flow connection handles.
- Node container no longer clips handles positioned outside its border.
- Increased handle hit area to 12 px and added hover titles.

# Changelog

## 0.1.2
- Fixed React Flow TypeScript inference error in `App.tsx`.
- Fixed invalid `tsconfig.node.json` option causing TS5096.
- Runtime image now uses `python:3.12-alpine` directly, avoiding a likely Python 3.13/aarch64 `pydantic-core` source build on the Home Assistant base image.
- Retains simulator, commissioning, visible NVT types and receiver-side binding deployment.

## 0.1.1
- Fixed Home Assistant OS Docker build: the HA base image does not contain `pip`.
- Installs Python 3, pip and an isolated virtual environment explicitly.
- Removed deprecated `build.yaml`.
- Keeps the React/React Flow frontend build in a dedicated Node stage.

# Changelog

## 0.1.0
- Home Assistant Ingress app.
- React Flow network editor.
- Visible NVT type next to every variable.
- Simulated discovery of EMPTY nodes.
- Commissioning with manual NODE_ID assignment.
- NVT compatibility validation while drawing bindings.
- Project persistence in `/data/project.json`.
- Simulator deployment grouped by destination node.
- Live simulated NVT values.

## Repository packaging
- Added GitHub/GHCR update channel without changing the v0.3.0 application behavior.
- Multi-architecture amd64/aarch64 images are built by GitHub Actions.
- Runtime version is supplied from Home Assistant config version via BUILD_VERSION.
