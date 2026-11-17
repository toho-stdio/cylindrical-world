# Phase v3 freeze

## Decision

On 2026-11-17, the user approved the improved STILLWATER result for a phase freeze and requested publication to https://github.com/toho-stdio/cylindrical-world. The Git checkpoint is the annotated tag `phase-v3-freeze` on `main`.

This freezes the existing implementation, not the remaining visual-quality issues. The independent post-follow-up verdict is **NEEDS_ANOTHER_PASS for visual acceptance**. The user considers the current result substantially improved and suitable as the starting point for further polish. No additional runtime/art changes are part of this freeze.

## Preserved baseline

- Original native WebGPU/WGSL cylindrical habitat with modular source and self-contained `dist/stillwater.html`.
- Deterministic terrain, river, cottages, orchard, aqueduct, cinematic viewpoints and exploration controls.
- Selected near orchard trees with open leaf-bearing boughs and visible negative space; shell crowns remain elsewhere.
- Real bounded local warm light spilling onto cottage walls and ground, with cool night, stars and water preserved.
- Settings quality-select correction, procedural audio lifecycle, resource teardown and unsupported-WebGPU fallback.
- Unchanged 12-float/48-byte vertex ABI and pre-growth mesh-capacity guard.
- Integration measurement: 1,184,637 vertices, 394,879 triangles, 56,862,576 bytes / 54.23 MiB, eight finite lights; 822.14 ms generation in a 10-second watchdog child. These are one-run integration observations, not performance guarantees.

## Verification at freeze

The coordinator reran `npm test` (27/27 passing) and `npm run build` successfully immediately before publication. No runtime code changes were made during packaging.

The integration agent previously passed real native WebGPU browser-smoke flows on source and standalone, including sustained movement, lazy/resumed audio, destruction, halted GPU submissions and a controlled injected unavailable-WebGPU fallback. Quality changes, resize and narrow UI were exercised. Chrome for Testing 155 reported an Apple Metal 3 probe; a displayed 60 FPS is an observation, not a benchmark.

The independent reviewer separately confirmed source and standalone live rendering/ready state at 1440x900 without browser/console errors, and corroborated the near-tree improvement and retained night/aqueduct appearance. It did not independently rerun the full tests/smoke harness.

Evidence:
- [Integration and bounded follow-up](VISUAL_V3_INTEGRATION.md)
- [Independent initial review and dated recheck](VISUAL_V3_REVIEW.md)
- `artifacts/visual-v3/integration/followup/`
- `artifacts/visual-v3/review/recheck-*`
- Historical canonical v2 comparisons: `artifacts/visual-v2/integration/` images 33, 34, 26 and 25.

## Next polish phase — prioritized scope

1. **Canopy language:** replace the prominent remaining opaque cap/bowl crowns in near/mid canonical views with coherent branching, fuller leaf groups and readable gaps. Keep cheaper shells for genuinely distant trees. Avoid uniformly sparse saplings or merely adding shell tessellation.
2. **Riverbend ground composition:** make the approach, riverbank, garden and path read as designed transitions rather than an expansive plain green field and broad tan strip. Use deliberate scale, density and negative space; preserve movement corridors and shoreline readability.
3. **Cottage depth and contact:** deepen glazing/frames and door treatment, strengthen porch/eaves/step proportions and believable foundation/ground connections. Preserve the verified local night-light spill rather than substituting emissive panes or global exposure changes.

### Carry-forward acceptance gates

- Compare the same canonical 1440x900 views plus close orchard/cottage details on both source and fresh standalone. Preserve this tag's captures; do not hide regressions behind a new camera or heavy fog.
- Retain the good Starlight palette, stars, water and aqueduct silhouette.
- Keep deterministic generation below 64 MiB with the pre-growth guard, finite lights and unchanged ABI unless an explicit subsequent decision changes that contract.
- Start with a bounded generation probe, then tests/build and real browser lifecycle/settings checks.
- Separate functional verification from subjective art acceptance. Require a fresh independent visual review and user judgment; no automatic claim of professional/reference parity.

## Repository hygiene

Source, build, tests, documentation and visual evidence are versioned. Dependencies, local agent configuration/state, environment files, process IDs and logs are ignored. Publication does not deploy the application or change GitHub Pages settings. No license or ownership rights over reference material are inferred.
