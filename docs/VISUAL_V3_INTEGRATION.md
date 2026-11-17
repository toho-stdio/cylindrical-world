# STILLWATER focused v3 — integration evidence

## Scope and comparison

This integration resumes after the geometry and lighting recovery reports in [FOLIAGE_GROUND_V3.md](FOLIAGE_GROUND_V3.md) and [NIGHT_MATERIALS_V3.md](NIGHT_MATERIALS_V3.md). I compared against the latest v2 review set, which remains unchanged:

- `artifacts/visual-v2/integration/33-canopy-reviewed-riverbend.png`
- `artifacts/visual-v2/integration/34-canopy-reviewed-orchard.png`
- `artifacts/visual-v2/integration/26-standalone-night-final.png`
- `artifacts/visual-v2/integration/25-standalone-aqueduct-final.png`

The v2 Riverbend image has a large conifer and cottage but sparse ground detail; its orchard image is dominated by rounded faceted crowns. The v2 standalone night image has bright window rectangles without a visible spatially local ground/wall pool. The v2 aqueduct silhouette has open arches but broad, simple ground and structural faces. New integration images were captured separately and do not replace or relabel those baselines.

## Integration correction

Inspection of the predecessor captures and an initial fresh orchard close view showed that twig/leaf-scale geometry was only visually obvious on a small curated subset; broad rounded crowns still dominated the near orchard. In `src/world.js`, I widened the existing twig-and-leaf crown treatment from a few orchard coordinates to the two inner orchard rows (`x=74…115`, `theta=.40… .72`), increased branch-attached leaves per twig from 23 to 27, and lengthened each lanceolate leaf from `s*(.24… .36)` to `s*(.34… .48)`. Other canopy shells remain as distance LOD; the leaf meshes use the existing material and 12-float vertex contract. The canonical Riverbend view and existing trees remain unchanged in camera direction; the additional close image comes from moving forward/strafe in the actual runtime, not reframing the canonical comparisons.

This modestly increased the generated scene from 1,064,226 to **1,170,078 vertices** and from 354,742 to **390,026 triangles**, **56,163,744 bytes / 53.56 MiB** at 48 bytes per vertex. That remains below the 64 MiB geometry ceiling. It does not make every crown botanical: distant and several foreground trees still read as shell LOD. See the paired canonical and close orchard images below.

No camera-direction changes were required in `src/art-direction.js`. The renderer/light recovery remains as described in its predecessor report: finite world-space emitters, corrected vertical/circumferential upload bounds, local-distance lighting, the separate shadow-pass layout, scene-linear HDR and ACES output. The current Starlight image visibly warms the cottage facade, door/threshold and nearby ground while retaining a cool night valley and star field. The pool is broad/stylized and not occlusion- or physically calibrated.

## Fresh integration captures

All following images are fresh native WebGPU browser captures at **1440×900**. `source-*` are served from `/`; `standalone-*` are served from `/dist/stillwater.html` after the final build. The canonical view images retain the existing scenic indices. Orchard-close was taken after a short, browser-trusted W/D move from the Orchard stop; its reported position was approximately `[81.0, 116.9, 63.5]` in world coordinates. The narrow UI image is 390×844.

| View | Source | Standalone |
| --- | --- | --- |
| Riverbend canonical | `artifacts/visual-v3/integration/source-riverbend-1440x900.png` | `artifacts/visual-v3/integration/standalone-riverbend-1440x900.png` |
| Orchard canonical | `artifacts/visual-v3/integration/source-orchard-1440x900.png` | `artifacts/visual-v3/integration/standalone-orchard-1440x900.png` |
| Orchard close (actual movement) | `artifacts/visual-v3/integration/source-orchard-close-1440x900.png` | `artifacts/visual-v3/integration/standalone-orchard-close-1440x900.png` |
| Aqueduct regression | `artifacts/visual-v3/integration/source-aqueduct-1440x900.png` | `artifacts/visual-v3/integration/standalone-aqueduct-1440x900.png` |
| Far Light default | `artifacts/visual-v3/integration/source-far-light-default-1440x900.png` | `artifacts/visual-v3/integration/standalone-far-light-default-1440x900.png` |
| Far Light / Starlight | `artifacts/visual-v3/integration/source-far-light-starlight-1440x900.png` | `artifacts/visual-v3/integration/standalone-far-light-starlight-1440x900.png` |

Additional UI evidence: `artifacts/visual-v3/integration/standalone-narrow-390x844.png`. Browser-smoke structured reports are preserved separately as `browser-smoke-source.json` and `browser-smoke-standalone.json` in the same directory.

### Pixel-level assessment and remaining weaknesses

- **Foliage:** compared with v2, the selected fruit/broadleaf orchard trees show more visible twig structure, clustered leaves and clear gaps in the close view. It is a targeted improvement, not a whole-forest solution: rounded crowns remain easy to see across the orchard and on trees outside the selected rows; the new geometry does not give the overall valley a leaf-dense silhouette.
- **Ground/cottage:** the v3 Riverbend frame contains a path, low fence, herb beds, planted clumps, mullions and a framed cottage/porch. This gives more intentional inhabited detail than v2, but the lawn/path are still broad simple color fields, plants are small at the canonical distance, and the cottage remains a low-poly planar mass with relatively simple glazing/roof detail. No terrain palette or camera change was added in integration.
- **Night lighting:** compared with v2's emissive-looking panels, the final Starlight pixels include a warm facade/door gradient and a broad pool on the adjacent ground/threshold. The sky/stars and surrounding valley remain cool/readable. The illumination has no scene-accurate occlusion, is intentionally broad, and roof highlights/flat glazing remain stylized.
- **Aqueduct:** the open three-arch structure and canonical stop remain present. Its masonry/spandrels still read as simple repetitive low-poly faces, and the ground foreground remains broad.

This is a measured visual improvement, **not professional/reference parity and not an automatic acceptance verdict**. The independent v3 review returned **NEEDS ANOTHER PASS** on the earlier integration: it called out the still-shell-dominated near/mid orchard. A bounded follow-up is documented below; an independent recheck of its new images is still pending.

## Runtime and verification

- Initial integration generation before the first full test suite measured 919.31 ms / 53.56 MiB. The final bounded follow-up measurement below supersedes it.
- `node scripts/with-deadline.mjs 30 -- npm test` — **27/27 passed** in the initial integration and again after the final follow-up geometry change (about 3.5 s).
- `npm run build` — succeeded; generated `dist/stillwater.html` (81 KiB).
- `scripts/browser-smoke.mjs` ran against both `http://localhost:4203/` and `http://localhost:4203/dist/stillwater.html` with the owned browser CDP endpoint. Both reports show browser-trusted A/W/Q/E movement; no audio context before gesture; lazy audio construction; reuse/resume of a suspended context; destroy closing audio/GPU and stopping submissions; and a visible fallback with `navigator.gpu` deliberately hidden. That last case is a **controlled capability simulation**, not a claim about physically unsupported hardware. Reports: `browser-smoke-source.json`, `browser-smoke-standalone.json`.
- A real select interaction exposed that settings selects were only listening for `input`, so the native quality select showed a new value while runtime quality stayed `high`. Fixed `src/ui.js` to also commit select controls on `change`; then exercised the actual standalone UI Low → Medium → High and observed runtime `getState().quality` transition through all three values. Also exercised a 1200×800 → 1440×900 resize cycle and the 390×844 narrow layout. No current console/page errors were observed after reload/capture. `agent-browser doctor --webgpu --quick` reported Chrome for Testing **155.0.8059.84**, successful native **Apple Metal 3** WebGPU probe, and readback in 0.88 s (doctor probe, not application benchmark). `getState()` showed **60 FPS** during captures and interaction; this is a live UI observation, not a performance benchmark. The preferred canvas format was `bgra8unorm`; adapter `info` was empty in page context.

The browser, GPU probe and tests do not establish performance on other GPUs/browsers, long-session stability, or a complete walk/tour review. See the predecessor reports for geometry, local-light and shader-specific bounds/limits.

## Bounded follow-up after independent review

The independent reviewer returned **NEEDS ANOTHER PASS** and identified a specific cause: the prior predicate skipped orchard row three at `theta≈.86` and the prominent edge trees, while the previous detailed trees were visibly sparse lower branches. This single correction pass keeps the camera/views and distant shell LOD intact and limits detailed open crowns to selected hero trees in the canonical sightline: the center/right orchard rows (`x=74…115`, `theta=.60… .70` and `.83… .91`), two closest left silhouettes (`x=77…89`, `theta=.40… .49`), and the existing three Riverbend broadleaves. Other tree shells remain distance/background LOD.

Hero trees now use eight full-width, vertically distributed boughs instead of six low limbs; each carries three longer secondary twigs and 17 larger folded lance leaves. This spreads visible structure through the crown volume rather than leaving a sparse lower ring of clipped branches. It adds leaf/twig silhouette breakup and gaps to the canonical orchard rows without raising the leaf count through indiscriminate density. The nearest whole tree shell language has not disappeared throughout the scene: some lateral/mid-distance crowns remain as LOD, and several background rows still appear rounded.

Final post-follow-up probe (again before tests): **822.14 ms**, **1,184,637 vertices**, **394,879 triangles**, **56,862,576 bytes / 54.23 MiB**, eight finite lights. This is below the 64 MiB ceiling and close to the previous 53.56 MiB integration footprint; the pre-growth capacity guard is retained. No camera, ground palette, cottage, renderer, shader, or light changes were made in this pass. Therefore Riverbend's broad lawn and the cottage's planar walls/flat panes remain explicit weaknesses rather than claimed fixes.

Fresh post-follow-up source and freshly built standalone native WebGPU captures are 1440×900 in `artifacts/visual-v3/integration/followup/`:

| View | Source | Standalone |
| --- | --- | --- |
| Riverbend canonical | `source-riverbend-1440x900.png` | `standalone-riverbend-1440x900.png` |
| Orchard canonical | `source-orchard-1440x900.png` | `standalone-orchard-1440x900.png` |
| Orchard close (actual W/D movement) | `source-orchard-close-1440x900.png` | `standalone-orchard-close-1440x900.png` |
| Cottage / Hearthside canonical | `source-hearthside-cottage-1440x900.png` | `standalone-hearthside-cottage-1440x900.png` |
| Cottage/garden close (actual W movement) | `source-hearthside-garden-close-1440x900.png` | `standalone-hearthside-garden-close-1440x900.png` |
| Aqueduct regression | `source-aqueduct-1440x900.png` | `standalone-aqueduct-1440x900.png` |
| Far Light default | `source-far-light-default-1440x900.png` | `standalone-far-light-default-1440x900.png` |
| Far Light / Starlight | `source-far-light-starlight-1440x900.png` | `standalone-far-light-starlight-1440x900.png` |

Current source and standalone browser-smoke reports are preserved as `browser-smoke-source.json` and `browser-smoke-standalone.json` in this `followup/` directory; both passed the bounded movement/audio/destroy/fallback flow with no uncaught browser exceptions. `npm run build` succeeded after the final code change. Review the new pixels against both the latest v2 baseline and the earlier v3 reviewer captures; this focused follow-up does **not** cancel the reviewer's NEEDS ANOTHER PASS verdict until that recheck occurs.
