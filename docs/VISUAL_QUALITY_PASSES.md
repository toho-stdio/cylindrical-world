# Visual-quality passes — art direction and shared contract

## User direction / acceptance
User explicitly asked for more agent-led visual-quality passes. The current functional 49 KiB low-poly prototype is NOT visual acceptance. Do not finish this effort just because build/tests pass. Work within the original independent native WebGPU/WGSL direction; no copied Duskward code/assets, engines, CDNs, AI raster backdrops, or external textures/audio.

## Baseline / concrete failures to address
Baseline screenshots: artifacts/final-qa/02-riverbend.png, 04-night-space.png, 10-final-standalone-aqueduct.png. Visually inspect these, not only descriptions.
- Everything uses the cylinder radial normal, including roofs, trunks and walls: no credible material/form shading.
- Flat yellow-green carpet, featureless monochrome slopes, sparse tiny toy trees; no foreground richness or deliberate negative space.
- Collapsed layered fan triangles used for broadleaf crowns. Build genuinely volumetric organic canopies, branches and species silhouettes.
- Neon cyan river with broad identical bright stripes; use believable darker reflective water, small irregular ripple normals, banks/reeds/rocks and depth/color variation.
- Aqueduct piers/arch bands are disconnected and look suspended. Build connected physically readable masonry arches/spandrels/deck and visible ground contact.
- Sun is a giant opaque overexposed disk very near camera, empty dark hole dominates the horizon. Replace with sensible distant source scale, halo/sky/space depth and coherent sunlight direction.
- HUD always consumes much of a weak scene. Let the environment lead, with an unobstructed view/capture option and carefully framed scenic views.

## Ownership and parallel passes
1. `environment-art`: src/world.js, new geometry helper modules only, tests/world.test.mjs and tests/landmark.test.mjs. Own deterministic shape/layout/normal generation and physically grounded terrain/vegetation/architecture. Documentation docs/ENVIRONMENT_ART.md.
2. `graphics-lighting`: src/renderer.js, src/shaders/*, new graphics-only modules; tests/graphics.test.mjs if needed. Own GPU geometry format consumption, actual normals/materials, shadows, atmosphere/sky, water, anti-aliasing and postprocessing. Documentation docs/GRAPHICS_PASS.md.
3. `cinematic-direction`: src/experience.js, src/ui.js, src/styles.css, new src/art-direction.js; tests/controls.test.mjs only if necessary. Own startup/six viewpoints/tour composition and restrained UI presentation, not world or shaders. Documentation docs/CINEMATIC_PASS.md.
4. `visual-integration` after all three: may fix any implementation file, iterate actual screenshots at multiple viewpoints, verify functional regressions and standalone. Own docs/VISUAL_INTEGRATION.md.
5. `independent-art-review` after integration: independent read-only visual assessment and real browser evidence, docs/VISUAL_REVIEW.md. Must judge rendered images critically, not accept added feature labels.
Coordinator owns src/scene-contract.js, tooling/browser-smoke, packaging, high-level docs and final acceptance. Do not edit others' files concurrently; message each other for cross-boundary changes.

## CPU/GPU vertex contract (mandatory)
Shared module `src/scene-contract.js` is created and immutable unless coordinator approves a change. All agents read it.
12 float32 values per vertex, 48-byte stride:
- location 0 offset 0: world position xyz
- location 1 offset 12: world normal xyz, normalized; real smooth terrain normals and appropriate geometry normals, NOT a radial normal for every mesh
- location 2 offset 24: linear base color rgb
- location 3 offset 36: scalar material ID (same integer on each triangle, flat interpolation)
- location 4 offset 40: wind animation weight 0..1 (0 for rooted hard surface)
- location 5 offset 44: stable seed/phase variation 0..1
Materials from MATERIAL enum: TERRAIN0, WOOD1, LEAF2, STONE3, ROOF4, WATER5, GLASS6, EMISSIVE7, FLOWER8, STAR9, METAL10, PATH11, GRASS12. Do not infer materials by RGB. Export VERTEX_FLOATS/STRIDE/ATTRIBUTES provided.
Sun from SUN constant: position [-236,0,0], radius13. Geometry and lighting use the same source; do not leave the huge former sphere at [-115,116,-7]. Negative axial x is daytime; positive x is dusk/night. Camera receives daylight fraction progress 1day..0night.

## World / renderer / camera contracts
- Preserve exports WORLD={radius:140,length:480,seed:731942}, AQUEDUCT metadata, terrainHeight(x,theta), daylightAt(x), createWorld(). World returns {vertices:Float32Array,seed,landmarks,terrainHeight,daylightAt}; may additionally return vertexCount, bounds, metadata and material ranges. Geometry can keep a single interleaved buffer; optimize only as needed.
- terrainHeight positive means inward above nominal shell; world surface radius = 140 - h(x,theta). Camera = [x,cos(theta)*(140-h-offset),sin(theta)*(140-h-offset)]. Ground-facing positive up is inward toward cylinder axis.
- Smooth terrain may have richer height envelope than old +/-4: if deliberately expanded, update tests to enforce declared finite safe envelope, seam continuity and derivative bounds rather than delete assertions. Keep safe camera flight/walk at all angles. Target generation under 10sec and mesh <=64 MiB with documented counts, not an unbounded vertex explosion.
- createRenderer(canvas) returns {render(camera,params)->fps,world,device,setQuality,destroy}; preserve API. render camera={position,target,up,progress}; may consume optional fov in radians from camera, default PI/3. Use actual time for gentle leaves/grass/water movement.
- Preserve window.stillwater public APIs, settings normalization, six viewpoint indices, keyboard/tour/audio behavior. Q DESCENDS toward terrain (offset decreases), E ASCENDS toward axis (offset increases). Do not regress the corrected sign convention.
- Preserve src/main.js / audio lifecycle and trusted CDP regression harness; main and audio are not part of visual rewrite.
- Source runtime uses JS string shader modules, NOT raw .wgsl ESM browser imports.

## Rendering priorities
First correct normals/material lighting and non-flat physical form; then warm/cool light separation, grounded contact/shadows, non-opaque distance atmosphere, water reflection/specular, rich sky/space and restrained HDR/ACES/MSAA. Prefer real shadow-map PCF if feasible; do not fake feature claims. If implementing HDR/bloom, use valid texture usages and scene-linear math, bounded sample counts, destroy/recreate render targets safely on quality/resize. Bright glows must not wash out the entire landscape. A simpler honest correct light pass beats broken over-ambitious effects.

## Required visible outcomes
- Startup/river view: a deliberately framed foreground (detailed cottage/tree/riverbank or flowers), midground path/water/bridge and layered curved inhabited background. Not a uniform empty green tube.
- Orchard/forest: distinct organic tree silhouettes, volumetric leaf masses with lit/shadowed sides and subtle motion; variation and placement composition, no uniform scatter.
- Aqueduct: recognizable connected masonry, material/shading variation and contact, negative-space arches preserving sightlines.
- Night: dark blue/violet atmosphere with visible stars/space at open end and warm local lantern/window glows; not just multiply day colors darker.
- Water: restrained plausible reflectance/ripples, no neon washboard stripes.

## Browser iteration / verification
Use isolated named agent-browser --webgpu sessions and owned unique ports (environment 4181, graphics 4182, cinematic 4183, integration 4184, review 4185). Existing preview server 4179 is coordinator owned; port4173 unowned, do not kill either. Load current agent-browser core guide first. A partially changed vertex contract may temporarily make source runtime incompatible until both world/renderer are ready; do not call that a final rendering verdict.
Save actual screenshots under artifacts/visual-v2/<role>/ and inspect them visually. For clean images `document.querySelector('#stillwater-ui').style.visibility='hidden'` temporarily; restore before UI QA. Capture 1440x900 or similar landscape and a narrow UI check, at least startup/river, cottage/trees, aqueduct, night. Do not hide deficiencies using extreme fog/overexposure or only a single flattering shot. Integrator must inspect and make at least one evidence-driven refinement pass after full integration if deficiencies remain.
Build/test: npm test, npm run build. Existing portable tests and scripts/browser-smoke.mjs protect functional behavior; renderer/device cleanup, no-autoplay, controls and source/standalone remain requirements. Report actual GPU/runtime errors and performance, not static feature assertions. Keep screenshot comparisons to the immutable baseline paths above.

## Independent visual gate
Reviewer scores 1..5 for composition, lighting/depth, vegetation, architecture/contact, water, atmosphere/night, and functional integrity, with image-specific reasons. If any major visual category remains <=2 (obvious primitive placeholder appearance, disconnected geometry, featureless surfaces, giant disk/empty void), verdict NEEDS ANOTHER PASS. A working renderer or 19 tests is not a substitute. No requirement to pretend photorealism or Duskward parity; target a substantial, clear leap to art-directed stylized quality.
