# STILLWATER

An original, explorable cylindrical habitat, inspired by the idea of travelling from daylight into night inside a space cylinder. Built directly with WebGPU and WGSL, without Three.js or an external game engine.

## Phase freeze

The user approved freezing this improved stylized prototype as **`phase-v3-freeze`**. This is a stable baseline for the next polish phase, not a claim of final visual acceptance or reference parity. Source, standalone build, tests, and visual evidence are preserved together.

Next priorities: remaining opaque canopy shells, Riverbend ground/shoreline/garden composition, and cottage depth/glazing/ground contact. See [docs/PHASE_V3_FREEZE.md](docs/PHASE_V3_FREEZE.md) for scope, verification and the next-phase gates.

## Run

Requires a recent Node.js (22+) and a desktop browser with WebGPU enabled. Use current Chrome/Edge on supported hardware. WebGPU requires a secure context; localhost is permitted.

```sh
npm install
npm run dev
```

Open **http://localhost:4173**. Controls: WASD + mouse look, Q/E radial descent/ascent, Shift faster movement, G walk/fly, Escape release cursor. Click the landscape to capture the pointer for mouse look; the HUD remains clickable until then. UI provides viewpoints, guided tour, audio and visual settings. Audio starts only after an explicit user gesture.

## Standalone HTML

```sh
npm run build
```

Output: **dist/stillwater.html**. JavaScript and CSS are embedded with no external runtime dependencies. For reliable WebGPU availability serve over localhost, e.g. open **http://localhost:4173/dist/stillwater.html** while the dev server runs. Browser handling of direct file:// URLs varies.

## Verification

```sh
npm test
npm run build
```

Implementation contract: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md). Fresh v3 source/standalone captures, bounded geometry measurements, browser verification and remaining visual limits are documented in [docs/VISUAL_V3_INTEGRATION.md](docs/VISUAL_V3_INTEGRATION.md); predecessor geometry/lighting reports are linked there. The earlier [docs/QA_REPORT.md](docs/QA_REPORT.md) is historical. Unit/build checks alone do not prove graphics quality or GPU compatibility.

## Agent controls

Runtime exposes `window.stillwater` (and optionally `window.world`): `params`, `defs`, `get(key)`, `set(key,value)`, `setMany(values)`, `preset(name)`, `reset()`, `viewpoint(index)`, `tour(boolean)`, and `getState()`. See implementation contract for details.

## Implemented features and limitations

STILLWATER generates a deterministic, art-directed cylindrical habitat with varied terrain, riverbanks, orchards, cottages, a connected multi-arch aqueduct, and a day-to-night sky in native WebGPU/WGSL. The renderer uses authored mesh normals and materials, a view-focused PCF shadow map, procedural water/foliage motion, HDR tone mapping, restrained bloom, and quality-scaled MSAA. It provides six scenic viewpoints, guided flight, walk/fly controls, lighting/color/world settings, presets, and locally synthesized ambient audio (enabled only after a user gesture). See [docs/VISUAL_V3_INTEGRATION.md](docs/VISUAL_V3_INTEGRATION.md) for rendered integration evidence and known limitations. Older integration and QA reports are historical.

The frozen baseline passes `npm test` (27/27) and `npm run build`. Integration-agent native WebGPU source and standalone smoke flows passed on Chrome for Testing 155 / Apple Metal 3; the independent reviewer confirmed live rendering and ready state without browser/console errors. Its final post-follow-up verdict remains NEEDS_ANOTHER_PASS for visual acceptance: near orchard foliage improved, but remaining shell crowns, sparse ground and planar cottage detail require polish. The user approved freezing this phase as an improved in-progress result. See the integration and review reports for evidence and limits. The visual style is low-poly and geometry-only, not photorealistic. Shadows are view-focused rather than cascaded, water response is procedural rather than a planar scene reflection, and walking collision is simplified. Ambient audio is procedural synthesis, not field recordings or a composed score. The project is independent and does not redistribute reference code, fonts, sounds or assets.
