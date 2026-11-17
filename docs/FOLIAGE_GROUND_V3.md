# Foliage / ground V3

Focused geometry pass; the reference captures reviewed were v2 integration `33-canopy-reviewed-riverbend.png` and `34-canopy-reviewed-orchard.png`. No ball/shell retessellation loop was repeated.

## Changes

- Added roughly **2,070** folded, two-facet lanceolate leaf meshes attached in repeated groups to fine secondary twigs on a curated set of near Riverbend and orchard deciduous trees. These trees now use branching silhouettes with gaps instead of a solid crown shell; distant canopy shells remain the low-cost LOD. Leaf vertices retain the existing wind and material channels.
- Added an irregular low cottage-garden fence, two raised herb beds, fine planted clumps, and window mullions raised ahead of the glazed panes. Existing access/path layout is unchanged.
- Terrain quads now carry color values sampled independently at each corner through MeshBuilder's optional `options.colors`, removing per-cell palette resets while keeping the 12-float / 48-byte vertex contract.
- Added eight world-space warm emitters near existing porch/window fixtures. After visual follow-up identified the original emitters on/behind fixture surfaces, moved each about 0.5 m outward from its facade along the scene-facing side; `tests/world.test.mjs` verifies positive normal-facing alignment against nearest lamp/glazing vertices. Renderer integration consumes the agreed `{position,color,intensity,radius}` interface; no material enum or vertex ABI changes.

## Bounded generation evidence

Command: `node scripts/with-deadline.mjs 10 -- node --input-type=module -e '...createWorld probe...'`.

Recovery recheck before light placement fix: `node scripts/with-deadline.mjs 10 -- node --input-type=module -e '...createWorld probe...'` measured **834.36 ms**, **1,064,226 vertices** / **354,742 triangles**, **51,082,848 bytes (48.72 MiB)**. After moving the emitters, the same bounded probe measured **782.59 ms**, with identical counts/bytes and eight finite lights. Both completed before the deadline. The mandatory MeshBuilder cap check remains before its capacity-growth loop.

Recovery recheck before light placement fix: `node scripts/with-deadline.mjs 30 -- npm test`: **26/26 passed**. After the placement and facing regression test: **27/27 passed** (suite duration 3.38 s; exit 0). `tests/world.test.mjs` checks corner-color preservation without ABI changes, deterministic generation, and that each paired light is on the visible side of nearest emissive/glazing geometry.

## Visual capture status

- `artifacts/visual-v3/foliage/webgpu-pipeline-error-during-concurrent-renderer-work.png` is retained as historical evidence from the earlier port 4191 attempt. It showed a renderer bind-group pipeline validation error during concurrent renderer edits; it is **not** an appearance capture and is not treated as proof of the current renderer state.
- After the lighting peer confirmed a clean native WebGPU first frame on its isolated 1440x900 session, I independently captured on a fresh named `--webgpu` session at port 4201: `riverbend-1440x900.png`, `hearthside-garden-1440x900.png`, `orchard-1440x900.png`, and `orchard-close-1440x900.png` in `artifacts/visual-v3/recovery-geometry/`. The page rendered at 1440x900; console and page errors were empty on the Riverbend capture and again after orchard exploration. The orchard views show twig-scale structure on selected foreground trees, while many crowns remain distant smooth shell LOD; leaves are small at this scenic distance and not all read individually. Riverbend/Hearthside still show a simple planar cottage and broad lawn/path color fields. The `orchard-close` image is a near orchard scenic view with slight movement, not a macro botanical detail shot. These are fresh source captures, not standalone evidence. The V2 comparison images under `artifacts/visual-v2/integration/` remain untouched.
- `hearthside-light-placement-starlight-1440x900.png` is retained as the pre-clamp capture: despite the corrected geometry placement, it showed emissive panes but no evident warm spill. The lighting peer traced this to renderer clamping source y/z to ±80 while the habitat reaches ±140, so the lamp at y≈139 uploaded around y=80, outside its radius. After their `src/renderer.js` finite clamp was raised to ±200, I reloaded my isolated named native WebGPU session and captured `hearthside-light-placement-starlight-final-1440x900.png`. At 1440x900 the facade around the windows/door has a distinct warm gradient and the door is visibly warmed; the threshold/path has subtler warmth, while nearby terrain stays cool/dark and the sky/stars and river remain readable. Console and page errors were empty. The lighting peer separately confirmed these pixels and saved final Hearthside/Far Light captures under `artifacts/visual-v3/recovery-lighting/`.

Geometry generation, facing regression, and tests are verified; the corrected local light placement now has a fresh combined-render pixel check. Residual tree/cottage/ground limitations above remain explicit; these scenic source captures do not substitute for the integration agent's standalone/browser regression.
