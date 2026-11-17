# Independent visual / functional review — STILLWATER v3

## Follow-up recheck verdict: NEEDS_ANOTHER_PASS (bounded final assessment)

The targeted near-orchard correction is demonstrably successful, but it does **not** clear the entire visual review. Left-edge large caps and central/right/back shell masses remain prominent, while the ground and cottage remain major weak points. Composition/ground and architecture/contact therefore remain at 2/5; the visual gate remains NEEDS_ANOTHER_PASS. The user visual review is worthwhile as a review of a stylized in-progress result, but this is not READY_FOR_USER_VISUAL_REVIEW as an acceptance candidate, not professional/reference parity, and not an automatic quality approval. No further implementation loop is requested here.

I reviewed the fresh source and standalone images in `artifacts/visual-v3/integration/followup/` against the unchanged latest-v2 baseline set `33-canopy-reviewed-riverbend.png`, `34-canopy-reviewed-orchard.png`, `26-standalone-night-final.png`, and `25-standalone-aqueduct-final.png`. I also verified current source and built standalone live at 1440×900 in a fresh reviewer-owned `agent-browser --webgpu` session on port 4204 and captured corroborating images in `artifacts/visual-v3/review/recheck-*`. Both canvases rendered and reported ready; view/preset changes worked; browser errors/console were empty.

In the follow-up orchard canonical and close pixels, several near/front trees now have longer leafy boughs, visible individual leaf clusters, and negative-space gaps. This is a clear improvement over the tiny/sparse foreground trees in the earlier v3 captures. It is a **specific near-tree correction**, not a forest-wide solution: the large left-edge caps and central/right/back shell crowns remain visibly opaque. Riverbend still has a large empty green field with sparse scattered details, and the cottage is still a simple planar low-poly box. Starlight's warm wall and ground pool remain visible while stars and water are legible. Aqueduct silhouette remains intact.

### Recheck scores (1–5)

| Category | Score | Pixel evidence |
| --- | ---: | --- |
| Composition / ground | 2 | `followup/standalone-riverbend-1440x900.png`: readable river/bridge/cottage route and path, but the lower field remains broad and mostly empty; small tufts do not create a composed continuous garden/bank surface. |
| Vegetation | 3 | Follow-up `standalone-orchard-1440x900.png` / `standalone-orchard-close-1440x900.png`: several near trees now have leafy bough silhouettes and clear gaps. Left-edge large caps and central/right/back shell crowns remain prominent. This is a specific successful fix, not forest-wide correction. |
| Architecture / contact | 2 | Follow-up Hearthside canonical and garden-close show frames/mullions, porch, step and entry plants, but cottage remains a planar box with flat glazing and minimal ground contact/detail; no material cottage correction was made in this follow-up. |
| Lighting / depth | 3 | `followup/standalone-far-light-starlight-1440x900.png`: warm wall/facade contribution and soft amber ground pool around cottage; adjacent valley remains cool. Pool is broad/stylized and windows remain flat. |
| Night / atmosphere | 3 | Same Starlight frame preserves visible stars and readable blue water/river against a dark cool valley; the valley is still sparse and dim. |
| Water | 3 | River remains continuous and restrained in Riverbend, Aqueduct and Starlight; reflection/shoreline detail is limited. |
| Aqueduct regression | 3 | `followup/standalone-aqueduct-1440x900.png` retains open arches, piers and connected river. Broad repetitive structural faces remain. |
| Functional / pipeline evidence | 4* | Own live browser check verified current source and standalone render at 1440×900, ready API state, accessible viewpoints/preset change and no browser errors/console. Integration report records 27/27 tests, build and both smoke runs. This is functional/pipeline evidence, not a visual-quality score substitute or cross-device benchmark. |

`*` The complete tests and smoke runs were reported by the integration agent and were **not independently rerun** during this visual recheck.

### Remaining limitations (not another requested correction loop)

Most background orchard rows remain rounded shell LOD, and the nearest canonical Riverbend conifer is still a faceted cone. The lower valley/cottage approach retains broad green fields with scattered small plants; the cottage is an intentionally simple low-poly box with flat glazing, and the aqueduct remains repetitive. These limit polish, but the side-by-side pixels show the requested near-tree foliage and real local night spill are now present while the v2 composition, night sky/water and aqueduct qualities are retained. No further implementation pass is requested by this review.

### Recheck evidence

- Integrator's fresh source and standalone captures: `artifacts/visual-v3/integration/followup/` (all required Riverbend, orchard/close, cottage/garden-close, aqueduct, Far Light default and Starlight views).
- Independent live-browser corroboration: `artifacts/visual-v3/review/recheck-source-*` and `recheck-standalone-*`, 1440×900. These were captured from current `/` and `/dist/stillwater.html` in a fresh named WebGPU browser session; physical `window.stillwater` state reported `ready: true`.
- Latest-v2 baseline images under `artifacts/visual-v2/integration/` were read directly and left unchanged.
- Integration reports bounded generation at **822.14 ms / 54.23 MiB**, tests **27/27**, build, and source/standalone browser smoke. I did not rerun those suites; they remain distinct from subjective art review.

---

## Historical initial review — NEEDS ANOTHER PASS (preserved; applies to initial captures)

This initial read-only review compared the earlier v3 integration captures with v2 and found the orchard leaves too limited. Its verdict remains part of the review history and applies to those initial images. The dated follow-up recheck appended at the end records the bounded correction and current verdict. The initial score table, image descriptions, and correction recommendation below are preserved verbatim as history.

### Scores (1–5)

| Category | Score | Pixel evidence and rationale |
| --- | ---: | --- |
| Composition / ground | 2 | Fresh `standalone-riverbend-1440x900.png` (and matching source) has a readable river → bridge → cottage route, but a broad green field fills most of the lower-left and center. Only scattered thin grass, a few spiky clumps, and reeds break it up; there is no visually composed garden/path-bank transition at this scale. The path is a broad straight tan wedge at the cottage rather than a richly connected route. |
| Vegetation | 2 | Latest-v2 `34` already shows lumpy faceted crowns. In fresh `standalone-orchard-1440x900.png` and `standalone-orchard-close-1440x900.png`, foreground trees near the left/center show twig and small leaf clusters, but the rows across the center/right and hillside remain repeated opaque, flattened umbrella/cap crowns. Their outer contours have little twig-scale breakup or readable holes; the foliage does not replace shell-like masses as the dominant near-tree language. Canonical Riverbend's large conifer remains a faceted tiered cone. This is the critical gate. |
| Architecture / contact | 2 | Fresh Riverbend's cottage has added mullions, a porch/awning, and a front step compared with v2 `33`'s mostly plain facade. At canonical and close Hearthside captures (`standalone-hearthside-cottage-close-1440x900.png`), however, the house still reads as a planar rectangular box under a broad slab roof: panes are flat blue/orange rectangles, the door is a plain dark panel, the porch is thin, and ground contact/garden detail are minimal. Useful detail was added, but the result is not yet materially convincing. |
| Lighting / depth | 3 | `standalone-far-light-starlight-1440x900.png` has a clearly warm facade/door and a soft amber pool on the ground to the right/front of the cottage; the neighboring ground remains cool-green, so this is spatially local rather than a global exposure lift. v2 `26` showed luminous orange window panels without that obvious surrounding pool. The new spill is broad and stylized, windows remain flat, and the canyon ground still feels simple. |
| Night / atmosphere | 3 | Fresh Starlight preserves numerous visible stars in a blue-violet sky and readable blue water/river against the dark valley. The cottage and nearby terrain are more legible than v2 `26`, though the surrounding valley remains dark and largely empty. No night regression observed. |
| Water | 3 | Source/standalone Far Light show a continuous, restrained blue river; the night frame keeps it readable. It is still a fairly uniform ribbon with limited shoreline transition or environmental reflection. |
| Aqueduct regression | 3 | `standalone-aqueduct-1440x900.png` retains open arches, piers, and a continuous river. Relative to v2 `25`, the recognizable silhouette remains intact; faces/deck are still repetitive broad low-poly planes. This view does not introduce a new blocker. |
| Functional / pipeline evidence | 4* | In my fresh browser, source and standalone each produced a 1440×900 canvas, `window.stillwater` was ready, and scene changes/viewpoints plus the UI hide/show key worked; browser errors and console were empty at inspection. The integration report separately records 27/27 tests, build, source/standalone smoke, settings and resource lifecycle checks. This is functional/pipeline evidence only, not visual-quality evidence or a broad hardware benchmark. |

`*` Functional score is based on this browser check plus the integration report; I did not independently rerun the complete test suite or browser-smoke harness.

## Fresh reviewer captures

All images below are fresh screenshots from the reviewer-owned port 4204, native `--webgpu` browser session, 1440×900. Source and standalone are both captured. Orchard-close and cottage-close use actual browser keyboard movement after selecting the corresponding scenic viewpoint; canonical shots are retained separately. The clean scene retains only the small “Show Interface H” affordance.

| View | Source | Standalone |
| --- | --- | --- |
| Riverbend canonical | `artifacts/visual-v3/review/source-riverbend-1440x900.png` | `artifacts/visual-v3/review/standalone-riverbend-1440x900.png` |
| Orchard canonical | `artifacts/visual-v3/review/source-orchard-day-1440x900.png` | `artifacts/visual-v3/review/standalone-orchard-1440x900.png` |
| Orchard close / tree detail | `artifacts/visual-v3/review/source-orchard-close-1440x900.png` | `artifacts/visual-v3/review/standalone-orchard-close-1440x900.png` |
| Hearthside / cottage | `artifacts/visual-v3/review/source-hearthside-cottage-1440x900.png` | — |
| Hearthside garden / cottage close | `artifacts/visual-v3/review/source-hearthside-garden-close-1440x900.png` and `source-hearthside-cottage-close-1440x900.png` | `artifacts/visual-v3/review/standalone-hearthside-cottage-close-1440x900.png` |
| Aqueduct | `artifacts/visual-v3/review/source-aqueduct-1440x900.png` | `artifacts/visual-v3/review/standalone-aqueduct-1440x900.png` |
| Far Light default | `artifacts/visual-v3/review/source-far-light-default-1440x900.png` | `artifacts/visual-v3/review/standalone-far-light-default-1440x900.png` |
| Far Light / Starlight | `artifacts/visual-v3/review/source-far-light-starlight-1440x900.png` | `artifacts/visual-v3/review/standalone-far-light-starlight-1440x900.png` |

The original comparisons remain untouched in `artifacts/visual-v2/integration/`; no old screenshot was relabeled. Source and standalone current-image consistency was observed directly in the matching Riverbend, orchard, aqueduct, Far Light default, and Starlight captures.

## Bounded suggested correction for `v3-resumed-integration`

Please take one focused correction pass, not an open-ended loop:

1. Make the **foreground and central orchard tree silhouettes** in the existing canonical/close camera paths visibly twig-and-leaf structured. Extend the current leaf treatment to the most prominent nearby shell crowns or replace those crowns with a branching leafy canopy; leave shells as distant LOD. At 1440×900, several near crowns should show distinct leaf-scale edge breakup and open gaps in silhouette rather than just branches visible beneath an opaque cap. Keep the geometry/generation budget bounded and retain existing path sightlines.
2. Use the same bounded pass to make Riverbend foreground ground and cottage approach read as composed garden/bank/path transitions rather than a broad lawn plus a tan strip; improve the cottage's depth/contact (recessed/frame variation, porch/door/steps) only insofar as it fits the existing scene and budget.
3. Re-capture the same canonical Riverbend, close orchard/tree, close cottage/garden, default Far Light and Starlight at 1440×900 on source **and** standalone; preserve all prior captures and report honest residuals. Do not respond with only more vertex density, a farther camera, or passing checks.

I am not requesting a professional/reference-parity claim. Even after a correction, art quality remains a separate subjective review gate.

## Functional and pipeline distinction

The implementation report records the earlier bounded generation probe (919.31 ms, 53.56 MiB), `npm test` 27/27, `npm run build`, source/standalone browser smoke, and UI/runtime interactions. These are meaningful evidence for bounded geometry, packaging, functional lifecycle and browser paths. My independent check established that the fresh source/standalone pages rendered and the reviewed views were reachable without browser console/page errors. None of these facts cancels the observed visual blocker or proves professional quality, parity, cross-device performance, or user acceptance.

---

## Dated follow-up recheck — 2026-11-17

**Current verdict: NEEDS_ANOTHER_PASS for visual acceptance; user visual review is worthwhile as an in-progress stylized result, not as an acceptance candidate.** This is bounded to the one reported follow-up. I am not requesting another implementation loop.

Compared the new integration captures in `artifacts/visual-v3/integration/followup/` directly against v2 `33-canopy-reviewed-riverbend.png`, `34-canopy-reviewed-orchard.png`, `26-standalone-night-final.png`, and `25-standalone-aqueduct-final.png`. The near-tree correction is visible and successful: several foreground orchard trunks now carry longer leafy boughs with discernible leaf clusters and negative-space gaps, unlike the earlier sparse sapling treatment. This does not resolve the larger composition: left-edge caps plus central/right/back shell crowns remain visible, and Riverbend's lower field is still predominantly empty green. The cottage remains a planar box with flat glazing and little ground contact. Night spill remains genuinely local and the sky/water legibility and aqueduct silhouette are retained.

Final visual scores for this bounded recheck are **Composition/ground 2, Vegetation 3, Architecture/contact 2, Lighting/depth 3, Night/atmosphere 3, Water 3, Aqueduct regression 3**. Foliage improvement should not be conflated with whole-scene acceptance. Full test/build/browser-smoke results and the **822.14 ms / 54.23 MiB** world probe are integration-agent-reported; I did not independently rerun them. My own live browser check used a fresh named `agent-browser --webgpu` source and standalone session at 1440×900 on port 4204: both rendered, reported ready, view/preset changes worked, and browser errors/console were empty.

Independent fresh corroborating images are preserved as `artifacts/visual-v3/review/recheck-source-*` and `recheck-standalone-*`. The exact requested integrator captures remain untouched under `artifacts/visual-v3/integration/followup/`, including `source-/standalone-orchard-1440x900.png`, orchard-close, Riverbend, Hearthside cottage/garden-close, default Far Light, Starlight and Aqueduct. Earlier review captures and v2 baselines were preserved; no historical screenshot was relabeled.
