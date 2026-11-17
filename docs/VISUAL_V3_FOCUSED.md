# Focused visual pass v3 — leaf-scale detail and inhabited night

## Why another pass
The incoming graph result reflects the initial v2 review. Current docs/VISUAL_REVIEW.md and integration captures 33/34 already record three follow-up loops and an image-only re-review at roughly 3/5. Coordinator inspected the latest images, not just the stale verdict. This is improved but still not strong visual quality: near crowns remain solid faceted masses, the hero cottage is a simple planar box, the ground has broad triangulated/color-patched lawn, and night windows remain flat luminous rectangles without local illumination. Do not repeat merely changing sphere/cone tessellation.

## Baselines to open
- artifacts/visual-v2/integration/33-canopy-reviewed-riverbend.png
- artifacts/visual-v2/integration/34-canopy-reviewed-orchard.png
- artifacts/visual-v2/integration/26-standalone-night-final.png
- artifacts/visual-v2/integration/25-standalone-aqueduct-final.png

## Fixed boundaries
Original native WebGPU/WGSL, no copied assets/code, no raster backdrops or external engines. Keep 12-float/48-byte scene-contract ABI and MATERIAL enum. Preserve WORLD/terrainHeight/daylightAt, all controls, public API and main/audio lifecycle. Geometry <=64 MiB, deterministic, startup <10 seconds in an actual watchdog child. Buffer cap guard before growth loop MUST remain. tools.bash timeout is in SECONDS (use 30/60), not milliseconds. Do not interrupt/restart peer agents; send steer. Do not start full test generation before bounded generation succeeds. No killing unrelated processes/servers (4179 preview is coordinator-owned;4173 unrelated).

Coordinator supplied `scripts/with-deadline.mjs`: `node scripts/with-deadline.mjs 10 -- node --input-type=module -e '...probe...'` gives a true outer deadline (seconds), terminates only its newly owned process group and exits124 on timeout. `npm test` now wraps its entire suite in a30-second watchdog. Two dedicated watchdog regressions pass; don't overwrite this tooling.

## Ownership
- foliage-ground-v3: src/world.js, src/geometry.js, new geometry helpers, tests/world.test.mjs and tests/landmark.test.mjs. docs/FOLIAGE_GROUND_V3.md.
- night-materials-v3: src/renderer.js, src/shaders/*, tests/graphics.test.mjs and graphics helpers. docs/NIGHT_MATERIALS_V3.md.
- v3-integration after both: any implementation fixes, camera tuning in src/art-direction.js if needed; source/standalone screenshots and regression. docs/VISUAL_V3_INTEGRATION.md.
- v3-art-review after integration: read-only implementation; new fresh browser and comparison images; docs/VISUAL_V3_REVIEW.md.
Coordinator owns packaging, high-level docs, final acceptance. Preserve historical screenshots/reviews; don't relabel old images as new.

## Concrete visual work
### Foliage / ground / hero cottage
Use real visible twig/leaf scale structure on a composed small number of foreground/near orchard trees. Thousands of cheap folded almond/lanceolate leaf meshes attached to coherent branching positions, varied orientation, green depth/backlit edges and negative-space gaps. Existing connected crowns may remain as distant LOD, not the foreground solution. No wholesale unbounded tree/vertex explosion. Near trees must stop reading as smooth bowls, green ice-cream cones or overlapping balls.
Fill the startup's foreground meaningfully, not uniform spiky tufts: meandering bank and stone/dirt path transitions, fine grass/flower drifts, shrubs, a small cottage garden/fence or orchard underplanting. Keep movement/entry/path/river sightlines clear. Shared-point terrain vertex colors should interpolate continuously rather than reset per-cell region palettes; MeshBuilder can gain options.colors support while retaining ABI and existing usages. Improve hero cottage wall/roof thickness, framed recessed glazing with mullions and warm interior depth, porch/door/steps/ground contact; small proportions/detail matter more than more distant buildings.

### Lighting / night / materials
Add bounded real local light contribution around windows/porch/lanterns, not just emissive pixels or raising global exposure. Warm pools should visibly touch nearby wall, threshold, garden/ground while retaining cool blue/violet night and readable sky/stars. Windows should have framed/recessed variation rather than flat uniform panels. Calm water should respond to sky/local light if feasible; no neon stripes.
Smooth glaring blocky shadow edges at high quality (currently1024 map covering124m): targeted higher resolution/frustum/PCF/filtering with bounded texture resources, not indiscriminate blur. Make fine terrain/material variation read as grass/soil/stone rather than blurry giant mottled facets. Ensure correct linear-to-display/ACES decisions deliberately; do not blindly add gamma and wash out sky/terrain. No broad palette rewrite that regresses good v2 sky/water/camera coherence.

## Optional local-light interface (agreed now)
Geometry may return `lights`: up to 8 objects `{position:[x,y,z],color:[r,g,b],intensity:number,radius:number}` in world coordinates. Renderer reads `world.lights || []`, clamps count/finite inputs and builds a bounded GPU buffer/uniform; no new vertex attributes/material IDs. Night light shading uses actual position distance and normals (with soft bounded falloff), consumes intensity/radius meaningfully, modulated toward dusk/night. Emitters should correspond to real window/porch geometry, not arbitrary lights floating over grass. Geometry agent messages graphics peer when locations are finalized. Missing lights stays safe.

## Required evidence / gate
Before/after at 1440x900: clean Riverbend/hero cottage, close tree/orchard, aqueduct regression, Far Light/default and Starlight night. Restore UI and test movement/settings. Use distinct isolated named agent-browser --webgpu sessions and owned ports: foliage4191, lighting4192, integration4193, reviewer4194. Load current browser guide. Keep close detailed views AND original canonical views; don't hide weak geometry by changing camera far away or using dense fog.
Integrator must visually inspect and adjust after integration at least once when deficiencies remain. Screenshots under artifacts/visual-v3/<role>/. Preserve <=64MiB and actual generation duration, run npm test/build and scripts/browser-smoke.mjs against source + standalone with real deadlines. Report actual adapter/FPS as observations, not benchmark.
Reviewer must compare to LATEST v2 33/34/26, not historical v1. Explicitly identify whether leaf-scale silhouettes/negative space and warm light pools actually exist in pixels, whether cottage/ground is materially more convincing, and remaining issues. Do not treat merely reaching3/5 or functional tests as evidence of a cinematic/professional result. Target a clear substantial leap; stay honest about style and limitations.
